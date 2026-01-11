"""Embedding service using OpenAI text-embedding-3-large."""

import math
from openai import OpenAI
from loguru import logger
from src.config import get_settings


# Initialize OpenAI client
_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    """Get or create OpenAI client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def embed_text(text: str, model: str = "text-embedding-3-large") -> list[float]:
    """Embed a single text string.

    Args:
        text: The text to embed
        model: The embedding model to use (default: text-embedding-3-large)

    Returns:
        List of floats representing the embedding vector (1536 dimensions)
    """
    client = get_openai_client()

    # Clean and truncate text if needed (model has 8191 token limit)
    text = text.strip()
    if not text:
        raise ValueError("Cannot embed empty text")

    try:
        response = client.embeddings.create(
            model=model,
            input=text,
            dimensions=1536,
            encoding_format="float"
        )
        embedding = response.data[0].embedding

        logger.debug(f"Generated embedding with {len(embedding)} dimensions")
        return embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise


def embed_texts(texts: list[str], model: str = "text-embedding-3-large") -> list[list[float]]:
    """Embed multiple texts in a single API call (more efficient).

    Args:
        texts: List of texts to embed
        model: The embedding model to use

    Returns:
        List of embedding vectors, one per input text
    """
    client = get_openai_client()

    # Filter and clean texts
    cleaned_texts = [t.strip() for t in texts if t.strip()]
    if not cleaned_texts:
        raise ValueError("No valid texts to embed")

    try:
        response = client.embeddings.create(
            model=model,
            input=cleaned_texts,
            dimensions=1536,
            encoding_format="float"
        )
        # Embeddings are returned in the same order as input
        embeddings = [item.embedding for item in response.data]
        logger.info(f"Generated {len(embeddings)} embeddings")
        return embeddings
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise
