# Before Backend is Available

## 1. Supabase Setup

### Enable pgvector extension
- Go to Supabase dashboard → Database → Extensions
- Search for `vector` and enable it

### Create chat_history table
Run this SQL in Supabase SQL Editor:

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

## 2. Environment Variables

Create `backend/.env` from `.env.example`:

```
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
MODEL_NAME=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
LOG_LEVEL=INFO
```

## 3. Run Ingestion

Populate vector store with COLREGs document:

```bash
cd backend
uv run python -m src.ingestion.ingest
```

## 4. Start API

```bash
cd backend
uv run python -m src.main
```

API will be available at `http://localhost:8000`

- `POST /chat` - SSE streaming chat endpoint
- `GET /health` - Health check
