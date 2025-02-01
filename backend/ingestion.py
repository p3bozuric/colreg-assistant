import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_voyageai import VoyageAIEmbeddings
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore

load_dotenv()

if __name__=="__main__":
    print("Ingesting...")
    loader = PyPDFLoader("data/eCOLREGs.pdf")
    document = loader.load()

    print("Splitting...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1400, chunk_overlap=200)
    chunks = text_splitter.split_documents(document)
    print(f"Created {len(chunks)} chunks.")

    print("Embedding and ingesting...")

    embeddings = VoyageAIEmbeddings(model="voyage-3", 
                                    voyage_api_key=os.environ.get("VOYAGE_API_KEY"))
        
    PineconeVectorStore.from_documents(chunks,
                                       embeddings, 
                                       index_name=os.environ['INDEX_NAME'])
                                       
    
    print("Done.")
