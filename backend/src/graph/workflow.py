"""LangGraph workflow for the COLREG assistant."""

from langgraph.graph import StateGraph, START, END
from src.graph.state import GraphState
from src.graph.nodes import (
    preprocess_node,
    fallback_node,
    load_history_node,
    extract_rules_node,
    compile_context_node,
)


def route_after_preprocess(state: GraphState) -> str:
    """Route based on query validity."""
    if state.get("is_valid_query", True):
        return "load_history"
    return "fallback"


def create_prep_graph():
    """Create preparation-only graph for streaming architecture.

    Flow:
        START -> preprocess -> (valid) -> load_history -> extract_rules -> compile_context -> END
                           -> (invalid) -> fallback -> END

    Response generation and suggestions are handled separately in the endpoint for true streaming.
    """
    graph = StateGraph(GraphState)

    # Add nodes (no generate, suggestions, or save_history - those are handled in endpoint)
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("fallback", fallback_node)
    graph.add_node("load_history", load_history_node)
    graph.add_node("extract_rules", extract_rules_node)
    graph.add_node("compile_context", compile_context_node)

    # Define edges
    graph.add_edge(START, "preprocess")
    graph.add_conditional_edges("preprocess", route_after_preprocess)
    graph.add_edge("fallback", END)
    graph.add_edge("load_history", "extract_rules")
    graph.add_edge("extract_rules", "compile_context")
    graph.add_edge("compile_context", END)

    return graph.compile()
