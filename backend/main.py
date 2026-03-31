import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Updated imports to avoid Deprecation Warnings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate

import google.generativeai as genai

# Load environment variables
load_dotenv()

app = FastAPI(title="BCA & MCA Admission Chatbot API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
embeddings = None
vectorstore = None
llm = None
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

def init_langchain():
    global embeddings, vectorstore, llm

    # 1. Initialize Embeddings (Updated Class)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # 2. Initialize Vector Store (Updated Class)
    # Ensure CHROMA_PERSIST_DIR exists by running ingest.py first!
    if os.path.exists(CHROMA_PERSIST_DIR):
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings
        )
    else:
        print(f"CRITICAL: Chroma directory '{CHROMA_PERSIST_DIR}' not found. Please run ingest.py first.")

    # 3. Initialize Gemini (Fixed Model Name)
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        # Using "gemini-1.5-flash" specifically to avoid the 404 error
        llm = genai.GenerativeModel("gemini-2.5-flash")
    else:
        print("CRITICAL: GEMINI_API_KEY not found in .env file.")

# Run initialization
init_langchain()

class ChatQuery(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat_endpoint(query: ChatQuery):
    if not vectorstore:
        raise HTTPException(status_code=500, detail="Vector Database not found on server.")
    
    if not llm:
        raise HTTPException(status_code=500, detail="AI Model not initialized. Check API Key.")

    try:
        # 🔍 Step 1: Search for relevant admission data
        docs = vectorstore.similarity_search(query.message, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])

        # 🧠 Step 2: Create the Prompt
        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are a professional BCA & MCA Admission Assistant. 
            
Use the provided context to answer the student's question. 
If the answer isn't in the context, politely say you don't have that information.
Provide a natural, conversational response.

Context:
{context}

Student Question:
{question}

Assistant Answer:"""
        )

        final_prompt = prompt_template.format(
            context=context,
            question=query.message
        )

        # 🤖 Step 3: Generate Response with Safety handling
        response = llm.generate_content(
            final_prompt,
            generation_config={
                "temperature": 0.4, # Lower temperature for more factual answers
                "max_output_tokens": 500
            }
        )

        # Check if the response was blocked or empty
        if response and response.text:
            return {"response": response.text}
        else:
            return {"response": "I'm sorry, I couldn't process that. Please try rephrasing your question."}

    except Exception as e:
        print(f"Server Error: {str(e)}")
        # If the API key is invalid or quota is hit, it will show here
        return {"response": "I'm having trouble connecting to my brain (AI service). Please try again in a moment."}

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "vectorstore_ready": vectorstore is not None,
        "gemini_ready": llm is not None
    }