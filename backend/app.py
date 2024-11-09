import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_voyageai import VoyageAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_pinecone import PineconeVectorStore
from langchain_core.runnables import RunnablePassthrough
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# CORS with specific origins
CORS(app, 
     origins=['https://ecolreg-assistant.netlify.app'],
     allow_headers=['Content-Type'],
     methods=['POST', 'OPTIONS'],
     supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://ecolreg-assistant.netlify.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return response

# Load environment variables
load_dotenv()

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Initialize RAG components
embeddings = VoyageAIEmbeddings(
    model="voyage-3", 
    voyage_api_key=os.environ.get("VOYAGE_API_KEY")
)

llm = ChatAnthropic(model="claude-3-sonnet-20240229")

vectorstore = PineconeVectorStore(
    index_name="colregs-rag-app-test",
    embedding=embeddings        
)

# Store user questions by session
user_questions = {}

# Define the prompt template
template = """You are an experienced maritime navigation instructor specializing in COLREGs. Your role is to:

1. If the question provides complete information:
   - Cite the specific COLREGs rule(s) that apply
   - Explain the required action clearly
   - When relevant, explain the reasoning behind the rule for better learning

2. If the question lacks necessary details:
   - Politely ask for specific missing information (vessel types, situation type, etc.)
   - Frame your questions as a teaching moment to help users understand what factors matter in COLREGs decisions
   - Use simple bullet points to request the key details needed

3. For scenario questions:
   - Break down the situation systematically
   - If relevant, mention any visual/sound signals required
   - Highlight any special considerations for safety

Previous questions from this user:
{question_history}

Context from documents: {context}
Current question: {question}

Maritime Instructor Response:"""

custom_rag_prompt = PromptTemplate.from_template(template)

def generate_response(question, question_history):
    # Format previous questions
    formatted_history = "\n".join([f"- {q}" for q in question_history]) if question_history else "No previous questions"
    
    # Get response from LLM
    response = llm.invoke(
        rag_chain = (
            {"context": vectorstore.as_retriever() | format_docs, "question": RunnablePassthrough(), "question_history": formatted_history} | custom_rag_prompt | llm
        )
    )
    
    return response.content
# Create the RAG chain


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        session_id = data.get('session_id', datetime.now().strftime("%Y%m%d%H%M%S"))
        
        # Initialize or get question history for this session
        if session_id not in user_questions:
            user_questions[session_id] = []

        # Get response
        response = generate_response(user_message, user_questions[session_id])

        # Store the question
        user_questions[session_id].append(user_message)
        
        # Keep only last 10 questions for context
        user_questions[session_id] = user_questions[session_id][-10:]

        if len(user_questions) > 1000:
            oldest_session = min(user_questions.keys())
            del user_questions[oldest_session]
        
        return jsonify({
            "answer": response.content,
            "sources": [] 
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)