import os
import pymupdf
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger
from supabase import create_client
from src.config import get_settings
from src.services.embeddings import embed_batch

settings = get_settings()

# Supabase client for ingestion
_supabase_client = None


def _get_supabase_client():
    """Lazy initialization of Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def ingest_pdf_bytes(pdf_bytes: bytes, filename: str) -> dict:
    """
    Ingest PDF document from bytes into Supabase pgvector.

    Args:
        pdf_bytes: PDF file content as bytes
        filename: Original filename for source tracking

    Returns:
        Dictionary with ingestion stats
    """
    logger.info(f"Starting ingestion of {filename}")

    # Extract text from PDF with PyMuPDF
    logger.info("Extracting text from PDF...")
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    text = "\n\n".join(page.get_text() for page in doc)
    doc.close()
    logger.info(f"Extracted text ({len(text)} characters)")

    # Chunk the text
    logger.info("Chunking text...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1400,
        chunk_overlap=200,
    )
    chunks = text_splitter.split_text(text)
    logger.info(f"Created {len(chunks)} chunks")

    # Embed chunks in batches (API limits)
    logger.info("Embedding chunks...")
    batch_size = 100
    all_embeddings = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        embeddings = embed_batch(batch)
        all_embeddings.extend(embeddings)
        logger.info(f"Embedded batch {i // batch_size + 1}/{(len(chunks) + batch_size - 1) // batch_size}")

    logger.info(f"Generated {len(all_embeddings)} embeddings")

    # Store in Supabase via REST API
    logger.info("Storing in Supabase...")
    supabase = _get_supabase_client()

    # Clear existing documents (optional - for re-ingestion)
    supabase.table("documents").delete().neq("id", "").execute()
    logger.info("Cleared existing documents")

    # Insert in batches
    insert_batch_size = 50
    for i in range(0, len(chunks), insert_batch_size):
        batch_records = [
            {
                "id": f"chunk_{j}",
                "text": chunk,
                "embedding": embedding,
                "source": filename,
            }
            for j, (chunk, embedding) in enumerate(
                zip(
                    chunks[i : i + insert_batch_size],
                    all_embeddings[i : i + insert_batch_size],
                ),
                start=i,
            )
        ]
        supabase.table("documents").upsert(batch_records).execute()
        logger.info(f"Inserted batch {i // insert_batch_size + 1}/{(len(chunks) + insert_batch_size - 1) // insert_batch_size}")

    logger.info(f"Ingestion complete! Stored {len(chunks)} chunks.")

    return {
        "filename": filename,
        "chunks": len(chunks),
        "characters": len(text),
    }


def ingest_pdf(pdf_path: str) -> dict:
    """
    Ingest PDF document from file path into Supabase pgvector.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Dictionary with ingestion stats
    """
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    return ingest_pdf_bytes(pdf_bytes, os.path.basename(pdf_path))


if __name__ == "__main__":
    pdf_path = "data/eCOLREGs.pdf"
    ingest_pdf(pdf_path)
