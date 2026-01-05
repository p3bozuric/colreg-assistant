import json
import re
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from loguru import logger
from src.graph.workflow import create_prep_graph
from src.graph.nodes import SYSTEM_PROMPT, VISUAL_INSTRUCTIONS, generate_suggestions_node
from src.services.llm import generate_streaming_response
from src.services.stream_parser import parse_streaming_response
from src.services.chat_history import save_message
from src.data.visual_catalog import generate_catalog_reference
from src.data.rules import COLREG_RULES
from src.models.extraction import RuleMetadata
from src.config import get_settings


def extract_mentioned_rules(text: str, existing_rule_ids: set[str]) -> list[RuleMetadata]:
    """Extract rule mentions from LLM response that aren't already in matched rules.

    Parses patterns like "Rule 30", "Rule 35(a)", "rule 14" from text and returns
    RuleMetadata for any rules not already included.
    """
    # Match "Rule X" or "Rule X(y)" patterns (case insensitive)
    pattern = r'\brule\s+(\d+)(?:\s*\([a-z]\))?'
    matches = re.findall(pattern, text, re.IGNORECASE)

    additional_rules = []
    seen = set()

    for rule_num in matches:
        rule_id = f"rule_{rule_num}"
        # Skip if already matched or already added
        if rule_id in existing_rule_ids or rule_id in seen:
            continue

        rule = COLREG_RULES.get(rule_id)
        if rule:
            seen.add(rule_id)
            additional_rules.append(RuleMetadata(
                id=rule_id,
                title=rule["title"],
                part=rule["part"],
                section=rule.get("section"),
                summary=rule["summary"],
                content=rule["content"],
                keywords=rule["keywords"],
            ))

    return additional_rules


router = APIRouter()
prep_graph = create_prep_graph()
security = HTTPBearer()


async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the bearer token matches the API key."""
    settings = get_settings()
    if credentials.credentials != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/chat")
async def chat(request: ChatRequest, _: HTTPAuthorizationCredentials = Depends(verify_api_key)):
    """
    Chat endpoint with true SSE streaming.

    Accepts a user message and optional session_id, returns a streaming response.
    Uses prep graph for context, then streams LLM response directly.
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or datetime.now().strftime("%Y%m%d%H%M%S")

        logger.info(f"Chat request for session {session_id}: {request.message[:50]}...")

        # Run preparation graph (preprocess, load_history, extract_rules, compile_context)
        prep_result = await prep_graph.ainvoke({
            "query": request.message,
            "session_id": session_id,
        })

        matched_rules = prep_result.get("matched_rules", [])

        # Check if query was invalid (fallback response set)
        if prep_result.get("response"):
            # Invalid query - return fallback without streaming
            fallback_text = prep_result["response"]

            async def fallback_generator():
                yield f"data: {json.dumps({'text': fallback_text})}\n\n"

            return StreamingResponse(fallback_generator(), media_type="text/event-stream")

        # Build messages for LLM with visual catalog
        visual_catalog = generate_catalog_reference()
        visual_instructions = VISUAL_INSTRUCTIONS.format(visual_catalog=visual_catalog)
        system_content = SYSTEM_PROMPT.format(
            rule_context=prep_result.get("rule_context", ""),
            visual_instructions=visual_instructions
        )
        messages = [{"role": "system", "content": system_content}]
        messages.extend(prep_result.get("chat_history", []))
        messages.append({"role": "user", "content": request.message})

        # Stream response with visual marker parsing
        async def event_generator():
            full_response = ""  # Accumulate full response (text only, for history)
            try:
                # Send matched rules immediately (before streaming starts)
                if matched_rules:
                    rules_metadata = {"matched_rules": [rule.model_dump() for rule in matched_rules]}
                    yield f"event: metadata\ndata: {json.dumps(rules_metadata)}\n\n"

                # Stream LLM response with visual marker parsing
                raw_stream = generate_streaming_response(messages)
                async for chunk in parse_streaming_response(raw_stream):
                    if chunk.type == "text":
                        text = chunk.data.get("text", "")
                        full_response += text
                        yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"
                    elif chunk.type == "visual":
                        # Emit visual event (don't add to full_response - keep history text-only)
                        yield f"event: visual\ndata: {json.dumps(chunk.data)}\n\n"

                # After streaming, check for additional rules mentioned in response
                existing_rule_ids = {r.id for r in matched_rules}
                additional_rules = extract_mentioned_rules(full_response, existing_rule_ids)

                # Send additional rules if found
                if additional_rules:
                    additional_metadata = {"additional_rules": [rule.model_dump() for rule in additional_rules]}
                    yield f"event: metadata\ndata: {json.dumps(additional_metadata)}\n\n"
                    logger.info(f"Found {len(additional_rules)} additional rules in response: {[r.id for r in additional_rules]}")

                # Generate suggestions
                suggestion_result = generate_suggestions_node({
                    **prep_result,
                    "query": request.message,
                    "response": full_response,
                })
                suggested_questions = suggestion_result.get("suggested_questions", [])

                # Save to history (text only, markers stripped)
                save_message(session_id, "user", request.message)
                save_message(session_id, "assistant", full_response)

                # Send suggested questions
                if suggested_questions:
                    yield f"event: metadata\ndata: {json.dumps({'suggested_questions': suggested_questions})}\n\n"

                logger.info(f"Chat completed for session {session_id}")

            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def root():
    """Root endpoint."""
    return {"detail": "COLREG Assistant"}


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
