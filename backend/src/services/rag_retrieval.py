"""RAG retrieval service for semantic rule search."""

from loguru import logger
from supabase import create_client, Client

from src.config import get_settings
from src.services.embeddings import embed_text


_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def retrieve_relevant_rules(
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.4,
    language: str = "en"
) -> list[str]:
    """Retrieve relevant rule IDs using semantic search.

    Embeds the query, searches the vector store, and returns
    unique rule IDs from matching chunks.

    Args:
        query: User query to search for
        top_k: Maximum number of results to retrieve
        similarity_threshold: Minimum similarity score (0-1)
        language: Language to filter by

    Returns:
        List of unique rule IDs (e.g., ["rule_27", "rule_18"])
    """
    if not query or not query.strip():
        logger.warning("Empty query provided for RAG retrieval")
        return []

    try:
        # Generate query embedding
        logger.debug(f"Generating embedding for query: {query[:100]}...")
        query_embedding = embed_text(query)

        # Call the Supabase RPC function for similarity search
        supabase = get_supabase()

        # Convert embedding list to string format for pgvector
        embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"

        response = supabase.rpc(
            "match_rule_embeddings",
            {
                "query_embedding": embedding_str,
                "match_threshold": similarity_threshold,
                "match_count": top_k,
                "filter_language": language
            }
        ).execute()

        if not response.data:
            logger.info(f"No RAG results found above threshold {similarity_threshold}")
            return []

        # Extract unique rule IDs, preserving order by similarity
        seen = set()
        rule_ids = []
        for result in response.data:
            rule_id = result["rule_id"]
            similarity = result["similarity"]
            if rule_id not in seen:
                seen.add(rule_id)
                rule_ids.append(rule_id)
                logger.debug(f"RAG match: {rule_id} (similarity: {similarity:.3f})")

        logger.info(f"RAG retrieval found {len(rule_ids)} unique rules: {rule_ids}")
        return rule_ids

    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}")
        # Return empty list on failure - don't break the pipeline
        return []


def retrieve_with_scores(
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.4,
    language: str = "en"
) -> list[dict]:
    """Retrieve relevant chunks with their similarity scores.

    Similar to retrieve_relevant_rules but returns full result data
    including scores and content for debugging/analysis.

    Args:
        query: User query to search for
        top_k: Maximum number of results
        similarity_threshold: Minimum similarity score (0-1)
        language: Language to filter by

    Returns:
        List of result dicts with rule_id, subsection, similarity, content
    """
    if not query or not query.strip():
        return []

    try:
        query_embedding = embed_text(query)
        supabase = get_supabase()

        # Convert embedding list to string format for pgvector
        embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"

        response = supabase.rpc(
            "match_rule_embeddings",
            {
                "query_embedding": embedding_str,
                "match_threshold": similarity_threshold,
                "match_count": top_k,
                "filter_language": language
            }
        ).execute()

        results = response.data or []
        logger.info(f"RAG retrieval returned {len(results)} chunks")

        return [
            {
                "rule_id": r["rule_id"],
                "subsection": r["subsection"],
                "similarity": r["similarity"],
                "content": r["content"][:200] + "..." if len(r["content"]) > 200 else r["content"],
                "metadata": r["metadata"]
            }
            for r in results
        ]

    except Exception as e:
        logger.error(f"RAG retrieval with scores failed: {e}")
        return []
