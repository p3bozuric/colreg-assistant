from datetime import datetime
from supabase import create_client, Client
from loguru import logger
from src.config import get_settings


_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create the Supabase client (lazy initialization for serverless)."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


def save_message(session_id: str, role: str, content: str):
    """
    Save a message to chat history in Supabase.

    Args:
        session_id: Unique session identifier
        role: Message role ('user' or 'assistant')
        content: Message content
    """
    try:
        data = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }

        get_supabase().table("chat_history").insert(data).execute()
        logger.info(f"Saved {role} message for session {session_id}")

    except Exception as e:
        # Don't fail the response if history saving fails
        logger.error(f"Error saving message: {e}")


def load_session_history(session_id: str, limit: int = 10) -> list[dict]:
    """
    Load chat history for a session from Supabase.

    Args:
        session_id: Unique session identifier
        limit: Maximum number of messages to load

    Returns:
        List of messages ordered by timestamp
    """
    try:
        response = (
            get_supabase().table("chat_history")
            .select("role, content, timestamp")
            .eq("session_id", session_id)
            .order("timestamp", desc=False)
            .limit(limit)
            .execute()
        )

        messages = response.data
        logger.info(f"Loaded {len(messages)} messages for session {session_id}")
        return messages

    except Exception as e:
        logger.error(f"Error loading session history: {e}")
        return []


def format_history_for_llm(messages: list[dict]) -> list[dict]:
    """
    Format chat history for LLM consumption.

    Args:
        messages: List of message dicts from Supabase

    Returns:
        List of formatted messages for LLM
    """
    return [{"role": msg["role"], "content": msg["content"]} for msg in messages]
