import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from loguru import logger
from src.graph.workflow import create_prep_graph
from src.graph.nodes import SYSTEM_PROMPT, generate_suggestions_node
from src.services.llm import generate_streaming_response
from src.services.chat_history import save_message
from src.config import get_settings


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

        # Build messages for LLM
        system_content = SYSTEM_PROMPT.format(rule_context=prep_result.get("rule_context", ""))
        messages = [{"role": "system", "content": system_content}]
        messages.extend(prep_result.get("chat_history", []))
        messages.append({"role": "user", "content": request.message})

        # Stream response with true LLM streaming
        async def event_generator():
            full_response = ""
            try:
                # Send matched rules immediately (before streaming starts)
                if matched_rules:
                    rules_metadata = {"matched_rules": [rule.model_dump() for rule in matched_rules]}
                    yield f"event: metadata\ndata: {json.dumps(rules_metadata)}\n\n"

                # Stream LLM response directly
                async for chunk in generate_streaming_response(messages):
                    full_response += chunk
                    yield f"data: {json.dumps({'text': chunk})}\n\n"

                # After streaming, generate suggestions
                suggestion_result = generate_suggestions_node({
                    **prep_result,
                    "query": request.message,
                    "response": full_response,
                })
                suggested_questions = suggestion_result.get("suggested_questions", [])

                # Save to history
                save_message(session_id, "user", request.message)
                save_message(session_id, "assistant", full_response)

                # Send suggested questions
                if suggested_questions:
                    yield f"event: metadata\ndata: {json.dumps({'suggested_questions': suggested_questions})}\n\n"

                logger.info(f"Chat completed for session {session_id}")

            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

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
