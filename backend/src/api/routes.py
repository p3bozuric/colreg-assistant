import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from loguru import logger
from src.graph.workflow import create_graph
from src.config import get_settings


router = APIRouter()
graph = create_graph()
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
    Chat endpoint with SSE streaming.

    Accepts a user message and optional session_id, returns a streaming response.
    Uses the rule-based COLREG workflow graph.
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or datetime.now().strftime("%Y%m%d%H%M%S")

        logger.info(f"Chat request for session {session_id}: {request.message[:50]}...")

        # Run the graph workflow
        result = await graph.ainvoke({
            "query": request.message,
            "session_id": session_id,
        })

        response_text = result.get("response", "")
        matched_rules = result.get("matched_rules", [])

        # Stream the response via SSE
        async def event_generator():
            try:
                # Stream response in chunks for better UX
                chunk_size = 20
                for i in range(0, len(response_text), chunk_size):
                    chunk = response_text[i:i + chunk_size]
                    yield f"data: {chunk}\n\n"

                # Send matched rules as metadata event
                if matched_rules:
                    rules_data = [rule.model_dump() for rule in matched_rules]
                    yield f"event: metadata\ndata: {json.dumps({'matched_rules': rules_data})}\n\n"

                logger.info(f"Chat completed for session {session_id}")

            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                yield f"data: [ERROR]: {str(e)}\n\n"

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
