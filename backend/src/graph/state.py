from typing import TypedDict, Annotated
from langgraph.graph import add_messages


class GraphState(TypedDict):
    """State for the RAG graph workflow."""

    query: str
    session_id: str
    retrieved_context: list[str]
    formatted_context: str
    chat_history: Annotated[list[dict], add_messages]
    response: str
    is_valid_query: bool  # False if query is malicious or out of scope
