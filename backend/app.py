import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_voyageai import VoyageAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_pinecone import PineconeVectorStore
from langchain_core.runnables import RunnablePassthrough
from pinecone import Pinecone
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

Context: {context}
Question: {question}

Maritime Instructor Response:"""

custom_rag_prompt = PromptTemplate.from_template(template)

# Create the RAG chain
rag_chain = (
    {"context": vectorstore.as_retriever() | format_docs, "question": RunnablePassthrough()}
    | custom_rag_prompt
    | llm
)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Get response from the chain
        response = rag_chain.invoke(user_message)
        
        return jsonify({
            "answer": response.content,
            "sources": []  # If you want to add sources, you'll need to modify the chain to return them
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)