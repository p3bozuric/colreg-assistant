# COLREG Assistant

A maritime navigation chatbot specializing in COLREGs (International Regulations for Preventing Collisions at Sea) with interactive visual aids and voice input.

## Features

- **Interactive Vessel Lights**: Animated displays showing navigation light configurations for different vessel types and situations
- **Day Shapes Visualization**: Visual representations of day signals (balls, cones, diamonds, etc.)
- **Sound Signal Playback**: Audio playback of horn signals with visual morse code representation
- **Voice Input**: Speech-to-text using OpenAI Whisper-1 for hands-free queries
- **Streaming Responses**: Real-time SSE streaming for immediate feedback
- **Inline Visual Markers**: LLM embeds `[[VISUAL:catalog_id]]` references that render as interactive components

## Architecture

- **Frontend**: Next.js 15 with Tailwind CSS, Framer Motion
- **Backend**: FastAPI with LangGraph, LiteLLM
- **Database**: Supabase (PostgreSQL with pgvector)
- **LLM**: GPT-4o mini via LiteLLM
- **Context Retrieval**: Hybrid approach combining:
  - LLM-based rule extraction (structured output)
  - RAG semantic search (OpenAI embeddings + pgvector)
- **Embeddings**: OpenAI text-embedding-3-large (3072 dimensions)
- **Speech-to-Text**: OpenAI Whisper-1
- **Streaming**: Server-Sent Events (SSE)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/chat` | POST | Bearer | Chat with the assistant (SSE streaming) |
| `/health` | GET | None | Health check |

## Setup

### Prerequisites

- Node.js 18+
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

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

4. Run Supabase migration (see [Supabase Setup](#supabase-setup))

5. Ingest COLREG rules into vector store:
```bash
uv run python -m scripts.ingest_rules
```

6. Start the API:
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
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4o-mini
API_KEY=your_secure_api_key
LOG_LEVEL=INFO
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your_secure_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Supabase Setup

The backend uses Supabase for chat history storage and RAG vector search.

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and service role key to `.env`

### 2. Run Migrations

Run the SQL migration in the Supabase SQL Editor:

```sql
-- File: supabase/migrations/001_rule_embeddings.sql
-- Creates the rule_embeddings table with pgvector for semantic search
```

Or use the Supabase CLI:
```bash
supabase db push
```

### 3. Ingest Rules

After running the migration, ingest the COLREG rules:

```bash
cd backend
uv run python -m scripts.ingest_rules
```

Options:
- `--dry-run`: Preview chunks without inserting
- `--language <code>`: Set language (default: "en")
- `--batch-size <n>`: Batch size for embeddings (default: 20)

## Deployment

### Vercel (Backend)

1. Create new project, set **Root Directory** to `backend`
2. Framework Preset: **Other**
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy
5. Run ingestion script locally (one-time) to populate vector store

### Vercel (Frontend)

1. Create new project, set **Root Directory** to `frontend`
2. Framework Preset: **Next.js**
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_API_KEY` = your API key
   - `OPENAI_API_KEY` = your OpenAI API key (for Whisper)
4. Deploy
