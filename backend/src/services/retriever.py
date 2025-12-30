import vecs
from loguru import logger
from src.config import get_settings
from src.services.embeddings import embed_text


settings = get_settings()
vx = vecs.create_client(settings.database_url)


def retrieve_context(query: str, top_k: int = 5) -> list[str]:
    """
    Retrieve relevant context from Supabase pgvector.

    Args:
        query: User query to search for
        top_k: Number of top results to return

    Returns:
        List of relevant text chunks
    """
    try:
        logger.info(f"Retrieving context for query: {query[:50]}...")

        # Embed the query
        query_embedding = embed_text(query)

        # Get collection
        collection = vx.get_collection(name=settings.collection_name)

        # Search for similar vectors
        results = collection.query(
            data=query_embedding,
            limit=top_k,
            include_value=False,
            include_metadata=True,
        )

        # Extract text from results
        contexts = [result[1]["text"] for result in results]

        logger.info(f"Retrieved {len(contexts)} context chunks")
        return contexts

    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        raise


def format_context(contexts: list[str]) -> str:
    """
    Format retrieved contexts into a single string.

    Args:
        contexts: List of context chunks

    Returns:
        Formatted context string
    """
    if not contexts:
        return "No relevant context found."

    formatted = "\n\n---\n\n".join(contexts)
    return f"Relevant COLREGs information:\n\n{formatted}"
