from google import genai
from loguru import logger
from src.config import get_settings


settings = get_settings()
client = genai.Client(api_key=settings.google_api_key)


def embed_text(text: str) -> list[float]:
    """
    Embed a single text using Google embeddings.

    Args:
        text: Text to embed

    Returns:
        Embedding vector as list of floats
    """
    try:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=[text],
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
        List of embedding vectors
    """
    try:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=texts,
        )
        return [emb.values for emb in result.embeddings]

    except Exception as e:
        logger.error(f"Error embedding batch: {e}")
        raise
