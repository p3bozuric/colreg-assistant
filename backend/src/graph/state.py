from typing import TypedDict
from src.models.extraction import RuleMetadata


class GraphState(TypedDict):
    """State for the rule-based COLREG workflow."""

    # Input
    query: str
    session_id: str

    # Chat history (plain dicts for LiteLLM compatibility)
    chat_history: list[dict]

    # Validation
    is_valid_query: bool  # False if query is malicious or out of scope

    # Rule extraction - LLM-based
    extracted_rules: list[str]  # e.g., ["rule_14", "rule_15", "annex_i"]
    include_general: bool  # Whether to include general COLREG overview
    extraction_method: str  # "llm" or "fallback" (for logging/debugging)

    # Rule extraction - RAG-based (parallel retrieval)
    rag_rules: list[str]  # Rules found via semantic search

    # Merged results (union of LLM + RAG, deduplicated)
    rule_context: str  # Compiled rule text for LLM
    matched_rules: list[RuleMetadata]  # Full metadata for frontend display

    # Output
    response: str
    suggested_questions: list[str]  # Follow-up questions for user


