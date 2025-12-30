# Backend Rewrite Plan

## Current State
- Flask app with `/chat` endpoint
- Anthropic Claude 3.7 Sonnet for LLM
- VoyageAI embeddings (voyage-3)
- Pinecone vector store
- LangChain ConversationalRetrievalChain
- In-memory session management

## Target State
- FastAPI with SSE streaming
- Gemini 2.5 Flash via LiteLLM
- Google embeddings (gemini-embedding-001)
- Supabase (pgvector + chat history persistence)
- LangGraph for orchestration
- uv for package management
- loguru for logging

---

## Phase 1: Project Setup

### 1.1 Initialize uv project
- [ ] Remove Pipfile and Pipfile.lock
- [ ] Initialize with `uv init`
- [ ] Create pyproject.toml with dependencies:
  - fastapi
  - uvicorn
  - sse-starlette
  - litellm
  - langgraph
  - langchain-core
  - supabase (Supabase client)
  - vecs (Supabase vector client for pgvector)
  - google-genai (for embeddings)
  - python-dotenv
  - loguru
  - docling (for PDF ingestion)
  - langchain-text-splitters (for chunking)

### 1.2 Project structure
```
backend/
├── pyproject.toml
├── .env.example
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings/env management
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # API endpoints
│   ├── graph/
│   │   ├── __init__.py
│   │   ├── nodes.py         # LangGraph nodes
│   │   ├── state.py         # Graph state definition
│   │   └── workflow.py      # Graph construction
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm.py           # LiteLLM wrapper
│   │   ├── embeddings.py    # Google embeddings
│   │   ├── retriever.py     # Supabase pgvector retrieval
│   │   └── chat_history.py  # Supabase chat history
│   └── ingestion/
│       ├── __init__.py
│       └── ingest.py        # PDF ingestion script
├── data/
│   └── eCOLREGs.pdf
└── Dockerfile
```

---

## Phase 2: Core Services

### 2.1 Configuration (`config.py`)
- [ ] Pydantic settings for env vars
- [ ] GOOGLE_API_KEY
- [ ] SUPABASE_URL
- [ ] SUPABASE_KEY
- [ ] Model configurations

### 2.2 LLM Service (`services/llm.py`)
- [ ] LiteLLM client setup for gemini-2.5-flash
- [ ] Streaming response generator
- [ ] Thinking config (low level)

### 2.3 Embeddings Service (`services/embeddings.py`)
- [ ] Google genai client for gemini-embedding-001
- [ ] Embed single text
- [ ] Embed batch

### 2.4 Retriever Service (`services/retriever.py`)
- [ ] Supabase vecs client for pgvector
- [ ] Similarity search function
- [ ] Context formatting

### 2.5 Chat History Service (`services/chat_history.py`)
- [ ] Supabase client for chat history table
- [ ] Save message (user/assistant)
- [ ] Load session history
- [ ] Format for LLM context

---

## Phase 3: LangGraph Workflow

### 3.1 State Definition (`graph/state.py`)
- [ ] TypedDict with:
  - query: str
  - session_id: str
  - retrieved_context: list[str]
  - formatted_context: str
  - response: str
  - chat_history: list[dict]

### 3.2 Nodes (`graph/nodes.py`)
- [ ] `load_history_node`: Load chat history from Supabase
- [ ] `retrieve_node`: Query pgvector via Supabase, return relevant chunks
- [ ] `format_node`: Format retrieved docs + history into context
- [ ] `generate_node`: Call LLM with context, yield streaming response
- [ ] `save_history_node`: Save user query + assistant response to Supabase

### 3.3 Workflow (`graph/workflow.py`)
- [ ] Build StateGraph
- [ ] Flow: START -> load_history -> retrieve -> format -> generate -> save_history -> END

---

## Phase 4: API Layer

### 4.1 FastAPI App (`main.py`)
- [ ] CORS middleware
- [ ] Lifespan for startup/shutdown
- [ ] Include router

### 4.2 Routes (`api/routes.py`)
- [ ] POST `/chat` - SSE streaming endpoint
  - Accept: query, session_id (optional)
  - Return: EventSourceResponse with streamed tokens
- [ ] GET `/health` - Health check

---

## Phase 5: Ingestion

### 5.1 Ingestion Script (`ingestion/ingest.py`)
- [ ] Load PDF with docling (`DocumentConverter`)
- [ ] Export to markdown for clean structure
- [ ] Chunk with RecursiveCharacterTextSplitter
- [ ] Embed with Google embeddings
- [ ] Store in Supabase pgvector via vecs

---

## Phase 6: Infrastructure

### 6.1 Supabase Setup
- [ ] Create Supabase project (if needed)
- [ ] Enable pgvector extension
- [ ] Create collections table via vecs
- [ ] Create chat_history table (session_id, role, content, timestamp)

### 6.2 Docker
- [ ] Update Dockerfile for uv
- [ ] Multi-stage build

### 6.3 Environment
- [ ] .env.example with:
  - GOOGLE_API_KEY
  - SUPABASE_URL
  - SUPABASE_KEY
  - MODEL_NAME (gemini-2.5-flash)

---

## Execution Order

1. Phase 1 - Setup (foundation)
2. Phase 2.1 - Config
3. Phase 2.2 - LLM service
4. Phase 2.3 - Embeddings service
5. Phase 5 - Ingestion (need embeddings to populate Supabase)
6. Phase 2.4 - Retriever service
7. Phase 2.5 - Chat history service
8. Phase 3 - LangGraph workflow
9. Phase 4 - API layer
10. Phase 6 - Docker & cleanup
