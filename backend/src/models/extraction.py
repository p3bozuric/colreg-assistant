"""Pydantic models for structured LLM outputs."""

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class RuleExtraction(BaseModel):
    """Structured output for COLREG rule extraction from user queries."""

    model_config = ConfigDict(extra="forbid")

    query_type: Literal["specific", "general", "comparison", "scenario"] = Field(
        description="Type of query: 'specific' for direct rule questions, 'general' for overview questions, 'comparison' for comparing rules, 'scenario' for situational questions"
    )
    rules: list[str] = Field(
        description="List of relevant rule identifiers (e.g., 'rule_14', 'rule_18', 'annex_i'). Use lowercase with underscores."
    )
    include_general: bool = Field(
        description="Whether to include general COLREG overview information in the response context"
    )
    reasoning: str = Field(
        description="Brief explanation of why these rules are relevant to the query"
    )


class RuleMetadata(BaseModel):
    """Metadata for a matched COLREG rule to send to frontend."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="Rule identifier (e.g., 'rule_14')")
    title: str
    part: str
    section: str | None
    summary: str
    content: str
    keywords: list[str]


class SuggestedQuestions(BaseModel):
    """Suggested follow-up questions for the user."""

    model_config = ConfigDict(extra="forbid")

    questions: list[str] = Field(
        description="List of 2-3 brief follow-up questions (max 10 words each)",
        max_length=3
    )
