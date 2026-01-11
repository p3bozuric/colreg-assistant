#!/usr/bin/env python3
"""
Ingestion script for COLREG rules into vector store.

Parses rules.py, splits each rule into subsection chunks,
generates embeddings, and stores them in Supabase.

Usage:
    cd backend
    python -m scripts.ingest_rules [--language en] [--dry-run]
"""

import argparse
import re
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from supabase import create_client, Client

from src.config import get_settings
from src.data.rules import COLREG_RULES
from src.services.embeddings import embed_texts


def get_supabase() -> Client:
    """Create Supabase client for ingestion."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def parse_subsections(content: str) -> list[tuple[str, str]]:
    """Parse rule content into top-level subsections only.

    Splits content by TOP-LEVEL patterns like (a), (b), (c) only.
    Sub-items like (i), (ii), (iii) are kept within their parent section.

    Args:
        content: The full rule content text

    Returns:
        List of (subsection_id, subsection_content) tuples
        Each tuple contains a top-level section with all its sub-items included.
    """
    if not content or not content.strip():
        return [("", content)]

    # Pattern to match ONLY top-level subsection markers: (a), (b), (c), etc.
    # Matches at start of string OR after newline
    # Excludes (i), (v), (x) which are common roman numerals used as sub-items
    top_level_pattern = r'((?:^|\n)\([a-hj-uw-z]\))'

    # Split content while keeping the delimiters
    parts = re.split(top_level_pattern, content)

    if len(parts) <= 1:
        # No top-level subsections found, return whole content as single chunk
        return [("", content.strip())]

    subsections = []
    intro = parts[0].strip()  # Content before first subsection marker

    i = 1
    while i < len(parts):
        marker_match = re.match(r'(?:^|\n)\(([a-hj-uw-z])\)', parts[i])
        if marker_match:
            section_id = f"({marker_match.group(1)})"
            # Get the content that follows this marker (includes all sub-items)
            if i + 1 < len(parts):
                section_content = parts[i + 1].strip()
                i += 2
            else:
                section_content = ""
                i += 1

            if section_content:
                # Prepend intro to each section for context (if intro exists)
                if intro:
                    full_content = f"{intro}\n\n{section_id} {section_content}"
                else:
                    full_content = f"{section_id} {section_content}"
                subsections.append((section_id, full_content))
        else:
            i += 1

    # If no subsections were found but we have content, return as single chunk
    if not subsections:
        return [("", content.strip())]

    return subsections


def create_chunks(rule_id: str, rule_data: dict, language: str = "en") -> list[dict]:
    """Create embedding chunks for a single rule.

    Each chunk contains:
    - The subsection content
    - The rule summary (for context)

    Args:
        rule_id: The rule identifier (e.g., "rule_27")
        rule_data: The rule data dict from COLREG_RULES
        language: Language code

    Returns:
        List of chunk dicts ready for embedding
    """
    chunks = []
    content = rule_data.get("content", "")
    summary = rule_data.get("summary", "")
    title = rule_data.get("title", "")
    part = rule_data.get("part", "")
    section = rule_data.get("section")

    subsections = parse_subsections(content)

    for subsection_id, subsection_content in subsections:
        # Create chunk text: subsection content + summary for context
        # This helps semantic search match queries to relevant subsections
        chunk_text = f"{subsection_content}\n\nRule Summary: {summary}"

        chunk = {
            "rule_id": rule_id,
            "subsection": subsection_id,
            "content": chunk_text,
            "language": language,
            "metadata": {
                "title": title,
                "part": part,
                "section": section,
                "original_subsection_content": subsection_content,
            }
        }
        chunks.append(chunk)

    return chunks


def ingest_rules(language: str = "en", dry_run: bool = False, batch_size: int = 20):
    """Main ingestion function.

    Args:
        language: Language code for the embeddings
        dry_run: If True, don't actually insert into database
        batch_size: Number of chunks to embed at once
    """
    logger.info(f"Starting rule ingestion (language={language}, dry_run={dry_run})")

    # Create all chunks first
    all_chunks = []
    for rule_id, rule_data in COLREG_RULES.items():
        chunks = create_chunks(rule_id, rule_data, language)
        all_chunks.extend(chunks)
        logger.debug(f"Created {len(chunks)} chunks for {rule_id}")

    logger.info(f"Total chunks to process: {len(all_chunks)}")

    if dry_run:
        logger.info("Dry run mode - showing sample chunks:")
        for chunk in all_chunks[:5]:
            logger.info(f"  {chunk['rule_id']} {chunk['subsection']}: {chunk['content'][:100]}...")
        return

    # Get Supabase client
    supabase = get_supabase()

    # Clear existing embeddings for this language (idempotent re-runs)
    logger.info(f"Clearing existing embeddings for language={language}")
    supabase.table("rule_embeddings").delete().eq("language", language).execute()

    # Process in batches for efficient embedding
    total_inserted = 0
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        texts = [chunk["content"] for chunk in batch]

        logger.info(f"Embedding batch {i // batch_size + 1}/{(len(all_chunks) + batch_size - 1) // batch_size}")

        try:
            embeddings = embed_texts(texts)

            # Prepare records for insertion
            records = []
            for chunk, embedding in zip(batch, embeddings):
                records.append({
                    "rule_id": chunk["rule_id"],
                    "subsection": chunk["subsection"],
                    "content": chunk["content"],
                    "embedding": embedding,
                    "language": chunk["language"],
                    "metadata": chunk["metadata"],
                })

            # Insert batch
            supabase.table("rule_embeddings").insert(records).execute()
            total_inserted += len(records)
            logger.info(f"Inserted {len(records)} records (total: {total_inserted})")

        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            raise

    logger.info(f"Ingestion complete! Total records: {total_inserted}")


def main():
    parser = argparse.ArgumentParser(description="Ingest COLREG rules into vector store")
    parser.add_argument(
        "--language", "-l",
        default="en",
        help="Language code for embeddings (default: en)"
    )
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Show what would be ingested without actually inserting"
    )
    parser.add_argument(
        "--batch-size", "-b",
        type=int,
        default=20,
        help="Batch size for embedding API calls (default: 20)"
    )

    args = parser.parse_args()

    try:
        ingest_rules(
            language=args.language,
            dry_run=args.dry_run,
            batch_size=args.batch_size
        )
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
