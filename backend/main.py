import os
import json
import re
from difflib import SequenceMatcher
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi

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
llm = None
dataset = []
bm25 = None
bm25_corpus_tokens = []


def _normalize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def _score_query(user_query: str, candidate_question: str) -> float:
    q_tokens = set(_normalize(user_query))
    c_tokens = set(_normalize(candidate_question))

    if not q_tokens or not c_tokens:
        token_overlap = 0.0
    else:
        token_overlap = len(q_tokens.intersection(c_tokens)) / len(q_tokens.union(c_tokens))

    sequence_score = SequenceMatcher(None, user_query.lower(), candidate_question.lower()).ratio()
    return (0.65 * token_overlap) + (0.35 * sequence_score)


def _normalize_scores(scores: List[float]) -> List[float]:
    if not scores:
        return []
    min_score = min(scores)
    max_score = max(scores)
    if max_score == min_score:
        return [0.0 for _ in scores]
    return [(s - min_score) / (max_score - min_score) for s in scores]


def get_top_matches(user_query: str, k: int = 12) -> list[dict]:
    if not dataset or not bm25:
        return []

    query_tokens = _normalize(user_query)
    bm25_raw_scores = bm25.get_scores(query_tokens)
    bm25_scores = _normalize_scores(list(bm25_raw_scores))

    ranked_items = []
    for idx, item in enumerate(dataset):
        question = item.get("question", "")
        answer = item.get("answer", "")
        qa_blob = f"{question} {answer}"

        question_match = _score_query(user_query, question)
        qa_match = _score_query(user_query, qa_blob)
        matcher_score = (0.7 * question_match) + (0.3 * qa_match)

        # Hybrid score: BM25 (keyword precision) + lexical matcher (paraphrase tolerance)
        hybrid_score = (0.55 * bm25_scores[idx]) + (0.45 * matcher_score)

        ranked_items.append(
            {
                "question": question,
                "answer": answer,
                "hybrid_score": float(hybrid_score),
            }
        )

    ranked_items.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return ranked_items[:k]


def build_context(matches: list[dict], max_chars: int = 14000) -> str:
    chunks = []
    total = 0
    for idx, item in enumerate(matches, start=1):
        chunk = (
            f"[{idx}]\n"
            f"Q: {item.get('question', '')}\n"
            f"A: {item.get('answer', '')}\n"
            f"Score: {item.get('hybrid_score', 0):.4f}"
        )
        next_total = total + len(chunk) + 2
        if next_total > max_chars:
            break
        chunks.append(chunk)
        total = next_total

    return "\n\n".join(chunks)

def init_app():
    global llm, dataset, bm25, bm25_corpus_tokens

    # 1. Load dataset directly into memory
    dataset_path = os.getenv("DATASET_PATH", "./dataset.json")
    if os.path.exists(dataset_path):
        try:
            with open(dataset_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, list):
                dataset = loaded
                bm25_corpus_tokens = [
                    _normalize(f"{item.get('question', '')} {item.get('answer', '')}")
                    for item in dataset
                ]
                bm25 = BM25Okapi(bm25_corpus_tokens) if bm25_corpus_tokens else None
            else:
                print("CRITICAL: dataset.json format is invalid. Expected a list of objects.")
        except Exception as e:
            print(f"CRITICAL: Failed to load dataset.json: {e}")
    else:
        print(f"CRITICAL: Dataset file '{dataset_path}' not found.")

    # 2. Initialize Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        llm = genai.GenerativeModel("gemini-2.5-flash")
    else:
        print("CRITICAL: GEMINI_API_KEY not found in .env file.")

# Run initialization
init_app()

class ChatQuery(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat_endpoint(query: ChatQuery):
    if not dataset:
        raise HTTPException(status_code=500, detail="Dataset not loaded on server.")
    
    if not llm:
        raise HTTPException(status_code=500, detail="AI Model not initialized. Check API Key.")

    try:
        # 🔍 Step 1: Retrieve with hybrid BM25 + lexical matcher
        top_k = int(os.getenv("RETRIEVAL_TOP_K", "12"))
        max_context_chars = int(os.getenv("MAX_CONTEXT_CHARS", "14000"))
        matches = get_top_matches(query.message, k=top_k)
        context = build_context(matches, max_chars=max_context_chars)

        recent_history = query.history[-6:] if query.history else []
        history_text = "\n".join(
            [f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in recent_history]
        )

        # 🧠 Step 2: Build prompt
        final_prompt = f"""You are a professional BCA & MCA Admission Assistant.

Important rules:
1) The user may ask in English, Hindi, or Hinglish (Hindi-English mix in Roman script).
2) Treat paraphrases and intent-level matches as valid if they map to the same admission topic.
3) Use only the retrieved context below for factual details.
4) If context does not contain the answer, clearly say you don't have that information.
5) Reply in the same language style as the user (English/Hindi/Hinglish), concise and helpful.

Recent chat history (for conversational continuity):
{history_text if history_text else 'No prior history.'}

Context:
{context}

Student Question:
{query.message}

Assistant Answer:"""

        # 🤖 Step 3: Generate response
        response = llm.generate_content(
            final_prompt,
            generation_config={
                "temperature": 0.4,
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
        "dataset_loaded": len(dataset) > 0,
        "dataset_count": len(dataset),
        "bm25_ready": bm25 is not None,
        "gemini_ready": llm is not None
    }