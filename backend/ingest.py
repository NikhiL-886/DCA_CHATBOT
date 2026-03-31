import json
import os
from dotenv import load_dotenv

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

def ingest_data():
    if not os.path.exists("dataset.json"):
        print("dataset.json not found!")
        return
        
    with open("dataset.json", "r") as f:
        data = json.load(f)

    # ✅ FREE embeddings (no API key needed)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Prepare document texts and metadatas
    texts = [f"Q: {item['question']}\nA: {item['answer']}" for item in data]
    metadatas = [{"question": item["question"]} for item in data]
    ids = [str(i) for i in range(len(data))]
    
    # Store in ChromaDB
    print("Ingesting data into ChromaDB...")
    vectorstore = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        ids=ids,
        persist_directory=CHROMA_PERSIST_DIR
    )
    
    print(f"Successfully ingested {len(data)} Q&A pairs into ChromaDB.")

if __name__ == "__main__":
    ingest_data()