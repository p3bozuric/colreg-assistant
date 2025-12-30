# COLREG Assistant

A RAG-powered maritime navigation chatbot specializing in COLREGs (International Regulations for Preventing Collisions at Sea).

## Architecture

- **Frontend**: Next.js 15 with Tailwind CSS, Framer Motion
- **Backend**: FastAPI with LangGraph, LiteLLM
- **Vector Store**: Supabase (pgvector)
- **Embeddings**: Google (gemini-embedding-001)
- **LLM**: Gemini 2.5 Flash via LiteLLM
- **PDF Processing**: PyMuPDF
- **Streaming**: Server-Sent Events (SSE)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/chat` | POST | Bearer | Chat with the assistant (SSE streaming) |
| `/ingest` | POST | Bearer | Upload PDF for ingestion |
| `/health` | GET | None | Health check |

## Setup

### Prerequisites

- Node.js 18+
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Supabase account

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Create `.env` from example:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Install dependencies:
```bash
uv sync
```

4. Run ingestion (first time only):
```bash
uv run python -m src.ingestion.ingest
```

5. Start the API:
```bash
uv run python -m src.main
```

Backend runs at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Create `.env.local` from example:
```bash
cp .env.local.example .env.local
```

3. Install dependencies:
```bash
npm install
```

4. Start dev server:
```bash
npm run dev
```

Frontend runs at `http://localhost:3001`

## Environment Variables

### Backend (`.env`)
```
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
MODEL_NAME=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
API_KEY=your_secure_api_key
LOG_LEVEL=INFO
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your_secure_api_key
NEXT_PUBLIC_PARENT_URL=https://bozuric.com
```

## Deployment

### Vercel (Backend)

1. Set root directory to `backend`
2. Add environment variables in Vercel dashboard
3. Deploy:
```bash
cd backend
vercel deploy
```

### Vercel (Frontend)

1. Set root directory to `frontend`
2. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_API_KEY` = your API key
3. Deploy via Vercel dashboard or CLI

## Supabase Setup

1. Enable pgvector extension in Supabase dashboard
2. Create chat_history table:
```sql
CREATE TABLE chat_history (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_chat_history_session ON chat_history(session_id);
```

## Manual Ingestion via API

Upload a PDF document to the vector database:

```bash
curl -X POST "https://your-api.vercel.app/ingest" \
  -H "Authorization: Bearer your_api_key" \
  -F "file=@/path/to/document.pdf"
```
