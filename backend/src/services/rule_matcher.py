"""Keyword-based rule matching fallback service.

Used when LLM structured output fails after retries.
Uses fuzzy string matching to identify relevant COLREG rules.
"""

from rapidfuzz import fuzz
from loguru import logger
from src.data.rules import COLREG_RULES


def keyword_fallback_extraction(query: str, top_k: int = 5) -> list[str]:
    """
    Fallback rule extraction using fuzzy keyword matching.
    Used when LLM structured output fails after retries.

    Args:
        query: User's query text
        top_k: Maximum number of rules to return

    Returns:
        List of rule identifiers sorted by relevance score
    """
    logger.info(f"Using keyword fallback extraction for query: {query[:50]}...")

    query_lower = query.lower()
    scores: dict[str, float] = {}

    for rule_id, rule_data in COLREG_RULES.items():
        keywords = rule_data.get("keywords", [])
        title = rule_data.get("title", "").lower()

        # Score based on keyword matches
        keyword_score = 0.0
        if keywords:
            keyword_score = sum(
                fuzz.partial_ratio(query_lower, kw.lower())
                for kw in keywords
            ) / len(keywords)

        # Score based on title similarity
        title_score = fuzz.partial_ratio(query_lower, title)

        # Combined score (weighted average)
        combined_score = (keyword_score * 0.6) + (title_score * 0.4)
        scores[rule_id] = combined_score

    # Sort by score and filter above threshold
    sorted_rules = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    result = [rule_id for rule_id, score in sorted_rules[:top_k] if score > 40]

    logger.info(f"Keyword fallback matched {len(result)} rules: {result}")
    return result


def get_rule_by_number(rule_number: int | str) -> str | None:
    """
    Get a rule identifier by its number.

    Args:
        rule_number: Rule number (e.g., 14 or "14")

    Returns:
        Rule identifier (e.g., "rule_14") or None if not found
    """
    rule_id = f"rule_{rule_number}"
    if rule_id in COLREG_RULES:
        return rule_id
    return None


def get_annex_by_number(annex_number: int | str) -> str | None:
    """
    Get an annex identifier by its number.

    Args:
        annex_number: Annex number in Roman numerals or integer (e.g., "I", "IV", 1, 4)

    Returns:
        Annex identifier (e.g., "annex_i") or None if not found
    """
    # Map Roman numerals to lowercase
    roman_map = {"I": "i", "II": "ii", "III": "iii", "IV": "iv", "1": "i", "2": "ii", "3": "iii", "4": "iv"}
    annex_str = str(annex_number).upper()

    if annex_str in roman_map:
        annex_id = f"annex_{roman_map[annex_str]}"
        if annex_id in COLREG_RULES:
            return annex_id

    return None
