import os
import pymupdf
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger
import vecs
from src.config import get_settings
from src.services.embeddings import embed_batch

load_dotenv()
settings = get_settings()


def ingest_pdf(pdf_path: str):
    """
    Ingest PDF document into Supabase pgvector.

    Args:
        pdf_path: Path to the PDF file
    """
    logger.info(f"Starting ingestion of {pdf_path}")

    # Extract text from PDF with PyMuPDF
    logger.info("Extracting text from PDF...")
    doc = pymupdf.open(pdf_path)
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

    # Embed chunks
    logger.info("Embedding chunks...")
    embeddings = embed_batch(chunks)
    logger.info(f"Generated {len(embeddings)} embeddings")

    # Store in Supabase pgvector via vecs
    logger.info("Storing in Supabase pgvector...")
    vx = vecs.create_client(settings.supabase_url)

    # Create or get collection
    try:
        collection = vx.get_or_create_collection(
            name=settings.collection_name,
            dimension=len(embeddings[0]),
        )
    except Exception as e:
        logger.error(f"Error creating collection: {e}")
        raise

    # Prepare records: (id, vector, metadata)
    records = [
        (
            f"chunk_{i}",
            embedding,
            {"text": chunk, "source": os.path.basename(pdf_path)},
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    # Upsert to collection
    collection.upsert(records=records)
    logger.info(f"Upserted {len(records)} records to collection '{settings.collection_name}'")

    # Create index for faster search
    collection.create_index()
    logger.info("Created vector index")

    logger.info("Ingestion complete!")


if __name__ == "__main__":
    pdf_path = "data/eCOLREGs.pdf"
    ingest_pdf(pdf_path)
