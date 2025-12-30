import tempfile
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from datetime import datetime
from loguru import logger
from src.graph.workflow import create_graph
from src.services.llm import generate_streaming_response
from src.services.retriever import retrieve_context, format_context
from src.services.chat_history import load_session_history, save_message, format_history_for_llm
from src.graph.nodes import SYSTEM_PROMPT
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
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or datetime.now().strftime("%Y%m%d%H%M%S")

        logger.info(f"Chat request for session {session_id}: {request.message[:50]}...")

        # Load chat history
        messages_history = load_session_history(session_id)
        chat_history = format_history_for_llm(messages_history)

        # Retrieve context
        contexts = retrieve_context(request.message, top_k=5)
        formatted_context = format_context(contexts)

        # Build messages for LLM
        messages = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{formatted_context}"}
        ]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": request.message})

        # Streaming generator
        async def event_generator():
            full_response = ""

            try:
                async for chunk in generate_streaming_response(messages):
                    full_response += chunk
                    yield {"data": chunk}

                # Save conversation after streaming completes
                save_message(session_id, "user", request.message)
                save_message(session_id, "assistant", full_response)

                logger.info(f"Chat completed for session {session_id}")

            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                yield {"data": f"[ERROR]: {str(e)}"}

        return EventSourceResponse(event_generator())

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@router.post("/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    _: HTTPAuthorizationCredentials = Depends(verify_api_key),
):
    """
    Ingest a PDF document into the vector database.

    Accepts a PDF file upload, processes it, and stores embeddings in pgvector.
    Protected endpoint - requires API key.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Import here to keep docling optional for regular API runtime
        from src.ingestion.ingest import ingest_pdf

        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        logger.info(f"Ingesting uploaded file: {file.filename}")

        try:
            # Run ingestion
            ingest_pdf(tmp_path)

            return {
                "status": "success",
                "message": f"Successfully ingested {file.filename}",
                "filename": file.filename,
            }
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except ImportError as e:
        logger.error(f"Ingestion dependencies not installed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion dependencies not installed: {e}",
        )
    except Exception as e:
        logger.error(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))
