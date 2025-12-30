from loguru import logger
from supabase import create_client
from src.config import get_settings
from src.services.embeddings import embed_text


settings = get_settings()

# Use Supabase client for vector search via RPC
_supabase_client = None


def _get_supabase_client():
    """Lazy initialization of Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def retrieve_context(query: str, top_k: int = 10, match_threshold: float = 0.3) -> list[str]:
    """
    Retrieve relevant context from Supabase pgvector using RPC.

    Args:
        query: User query to search for
        top_k: Number of top results to return
        match_threshold: Minimum similarity score (0-1) for results

    Returns:
        List of relevant text chunks
    """
    try:
        logger.info(f"Retrieving context for query: {query[:50]}...")

        # Embed the query
        query_embedding = embed_text(query)

        # Use Supabase RPC to search vectors
        supabase = _get_supabase_client()

        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_count": top_k,
                "match_threshold": match_threshold,
                "collection_name": settings.collection_name,
            }
        ).execute()

        # Extract text from results
        contexts = [row["text"] for row in response.data] if response.data else []

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
