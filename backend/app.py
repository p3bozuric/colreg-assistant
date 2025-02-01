import os
from dotenv import load_dotenv
from datetime import datetime
from flask import Flask, request, jsonify
from langchain_anthropic import ChatAnthropic
from langchain_voyageai import VoyageAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize RAG components
embeddings = VoyageAIEmbeddings(
    model="voyage-3", 
    voyage_api_key=os.environ.get("VOYAGE_API_KEY"))

vector_store = PineconeVectorStore(
    index_name="colregs-rag-app-test",
    embedding=embeddings        
)

# Define the system message template
system_template = """You are an experienced maritime navigation instructor specializing in COLREGs. Your role is to:

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

Use the following pieces of context to answer the user's question. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.
       ----------------
       {context}"""

# Create the chat prompt templates
messages = [
    SystemMessagePromptTemplate.from_template(system_template),
    HumanMessagePromptTemplate.from_template("Question: {question}")
]
qa_prompt = ChatPromptTemplate.from_messages(messages)

# Store user questions by session
conversation_chains = {}

def get_or_create_chain(session_id):
    if session_id not in conversation_chains:
        llm = ChatAnthropic(model="claude-3-sonnet-20240229")

        memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)

        retriever = vector_store.as_retriever()

        conversation_chain = ConversationalRetrievalChain.from_llm(llm=llm,
                                                                   retriever=retriever,
                                                                   memory=memory,
                                                                   combine_docs_chain_kwargs={'prompt': qa_prompt})

        conversation_chains[session_id] = conversation_chain

        # Clean up old sessions
        if len(conversation_chains) > 1000:
            oldest_session = min(conversation_chains.keys())
            del conversation_chains[oldest_session]

    return conversation_chains[session_id]

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        session_id = data.get('session_id', datetime.now().strftime("%Y%m%d%H%M%S"))

        chain = get_or_create_chain(session_id)

        response = chain.invoke({"question": user_message})
        
        return jsonify({
            "answer": response["answer"],
            "sources": [] 
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)