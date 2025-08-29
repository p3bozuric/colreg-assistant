# eCOLREG Assistant

A RAG-powered application for learning COLREGs using LangChain, Pinecone, VoyageAI, and Anthropic Claude.

## Setup Options

### Local Setup
1. Install dependencies:
```bash
pipenv install
```

2. Create a .env file with your API keys:
```
VOYAGE_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
```

3. Run the backend:
```bash
cd backend

# Start the ingestion process
python ingestion.py

# Start the app
python app.py
```

4. Open frontend/index.html in your browser

## Architecture
- Frontend: Static HTML/JS/CSS 
- Backend: Flask API with LangChain RAG implementation
- Vector Store: Pinecone
- Embeddings: VoyageAI
- LLM: Anthropic Claude
