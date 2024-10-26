# eCOLREG Assistant

A RAG-powered application for learning COLREGs using LangChain, Pinecone, VoyageAI, and Anthropic Claude.

## Setup Options

### Local Setup (Without Docker)
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
python app.py
```

4. Open frontend/index.html in your browser

### Docker Setup
1. Create .env file (same as above)
2. Start the services:
```bash
docker-compose up --build
```
3. Access the application at http://localhost

## Architecture
- Frontend: Static HTML/JS/CSS 
- Backend: Flask API with LangChain RAG implementation
- Vector Store: Pinecone
- Embeddings: VoyageAI
- LLM: Anthropic Claude

## Deployment
Instructions for AWS EC2 and Netlify deployment coming soon.