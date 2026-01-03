"""LangGraph workflow for the COLREG assistant."""

from langgraph.graph import StateGraph, START, END
from src.graph.state import GraphState
from src.graph.nodes import (
    preprocess_node,
    fallback_node,
    load_history_node,
    extract_rules_node,
    compile_context_node,
    generate_node,
    save_history_node,
)


def route_after_preprocess(state: GraphState) -> str:
    """Route based on query validity."""
    if state.get("is_valid_query", True):
        return "load_history"
    return "fallback"


def create_graph():
    """Create and compile the rule-based COLREG workflow graph.

    Flow:
        START -> preprocess -> (valid) -> load_history -> extract_rules -> compile_context -> generate -> save_history -> END
                           -> (invalid) -> fallback -> END
    """

    # Initialize graph
    graph = StateGraph(GraphState)

    # Add nodes
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("fallback", fallback_node)
    graph.add_node("load_history", load_history_node)
    graph.add_node("extract_rules", extract_rules_node)
    graph.add_node("compile_context", compile_context_node)
    graph.add_node("generate", generate_node)
    graph.add_node("save_history", save_history_node)

    # Define edges
    graph.add_edge(START, "preprocess")
    graph.add_conditional_edges("preprocess", route_after_preprocess)
    graph.add_edge("fallback", END)
    graph.add_edge("load_history", "extract_rules")
    graph.add_edge("extract_rules", "compile_context")
    graph.add_edge("compile_context", "generate")
    graph.add_edge("generate", "save_history")
    graph.add_edge("save_history", END)

    # Compile
    return graph.compile()
