from typing import TypedDict, Annotated
from langgraph.graph import add_messages
from src.models.extraction import RuleMetadata


class GraphState(TypedDict):
    """State for the rule-based COLREG workflow."""

    # Input
    query: str
    session_id: str

    # Chat history
    chat_history: Annotated[list[dict], add_messages]

    # Validation
    is_valid_query: bool  # False if query is malicious or out of scope

    # Rule extraction (new)
    extracted_rules: list[str]  # e.g., ["rule_14", "rule_15", "annex_i"]
    include_general: bool  # Whether to include general COLREG overview
    rule_context: str  # Compiled rule text for LLM
    extraction_method: str  # "llm" or "fallback" (for logging/debugging)
    matched_rules: list[RuleMetadata]  # Full metadata for frontend display

    # Output
    response: str


