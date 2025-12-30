from google import genai
from google.genai import types
from loguru import logger
from src.config import get_settings


settings = get_settings()
client = genai.Client(api_key=settings.google_api_key)

EMBEDDING_DIMENSION = 1536


def embed_text(text: str) -> list[float]:
    """
    Embed a single text using Google embeddings.

    Args:
        text: Text to embed

    Returns:
        Embedding vector as list of floats (1536 dimensions)
    """
    try:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=[text],
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSION),
        )
        return result.embeddings[0].values

    except Exception as e:
        logger.error(f"Error embedding text: {e}")
        raise


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple texts in batch.

    Args:
        texts: List of texts to embed

    Returns:
        List of embedding vectors (1536 dimensions each)
    """
    try:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSION),
        )
        return [emb.values for emb in result.embeddings]

    except Exception as e:
        logger.error(f"Error embedding batch: {e}")
        raise
