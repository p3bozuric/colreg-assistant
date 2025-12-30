from langgraph.graph import StateGraph, START, END
from src.graph.state import GraphState
from src.graph.nodes import (
    preprocess_node,
    fallback_node,
    load_history_node,
    retrieve_node,
    format_node,
    generate_node,
    save_history_node,
)


def route_after_preprocess(state: GraphState) -> str:
    """Route based on query validity."""
    if state.get("is_valid_query", True):
        return "load_history"
    return "fallback"


def create_graph():
    """Create and compile the RAG workflow graph."""

    # Initialize graph
    graph = StateGraph(GraphState)

    # Add nodes
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("fallback", fallback_node)
    graph.add_node("load_history", load_history_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("format", format_node)
    graph.add_node("generate", generate_node)
    graph.add_node("save_history", save_history_node)

    # Define edges
    graph.add_edge(START, "preprocess")
    graph.add_conditional_edges("preprocess", route_after_preprocess)
    graph.add_edge("fallback", END)
    graph.add_edge("load_history", "retrieve")
    graph.add_edge("retrieve", "format")
    graph.add_edge("format", "generate")
    graph.add_edge("generate", "save_history")
    graph.add_edge("save_history", END)

    # Compile
    return graph.compile()
