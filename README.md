# BCA & MCA Admission Chatbot 🤖

A fully responsive, AI-powered admission query chatbot. It answers predefined academic questions based on a customized dataset via an interactive frontend UI with stunning animations.

---

## 🚀 Complete Local Run Guide

To run this application on your local computer, you will need to run the **Backend** and the **Frontend** simultaneously in **two separate terminal windows**.

### Step 1: Running the Backend (Python)
The backend requires Python and it will load data into a vector database (ChromaDB) to accurately answer queries without AI hallucinations.

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment provided:
   - **Windows:** `.\venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
3. Edit the `.env` file inside the `backend` folder and paste your OpenAI API Key:
   ```env
   OPENAI_API_KEY="sk-proj-xxxxxxxxxxxx"
   ```
4. Update the Q&A pairs (Optional): 
   - Open `backend/dataset.json` and insert your 150 Q&A pairs in the existing format.
5. Ingest the data into ChromaDB (*You only need to run this command once or whenever you change the `dataset.json`*):
   ```bash
   python ingest.py
   ```
6. Start the API Server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Leave this terminal window open and running.*

### Step 2: Running the Frontend (Next.js)
The frontend uses Next.js app router and TailwindCSS styling.

1. Open a **second, new terminal window** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and go to `http://localhost:3000` to view the running chatbot!


---


## ☁️ Complete Vercel Hosting Guide

You can host both the Frontend and the Python Backend directly on Vercel. Vercel supports Python "Serverless Functions" as long as they are properly configured.

### Prerequisites for Vercel:
1. You must have a GitHub account.
2. Push your `DCA CHATBOT` code to a single GitHub Repository.

### Option 1: Hosting Frontend on Vercel & Backend on Render (Recommended)
Because ChromaDB is a *local disk* database (writes files to `./chroma_db`), serverless platforms like Vercel (which are read-only) **cannot use ChromaDB natively** out of the box without changing it to an external database (e.g. Pinecone). 
For the easiest full-stack deployment without changing code:

**Host Backend on Render:**
1. Go to [Render.com](https://render.com) and create an account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository. Select the root directory as `/backend`.
4. Build Command: `pip install -r requirements.txt` *(Make sure you run `pip freeze > requirements.txt` locally inside `backend/venv` before pushing)*.
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variable: `OPENAI_API_KEY` with your OpenAI Key.
7. Deploy. Render will give you a public URL (e.g. `https://dca-backend.onrender.com`).

**Host Frontend on Vercel:**
1. Open up `frontend/src/app/page.tsx` in your code editor.
2. Find `http://localhost:8000/chat` on line ~47 and replace it with your new Render URL:
   `https://dca-backend.onrender.com/chat`
3. Push the change to GitHub.
4. Go to [Vercel.com](https://vercel.com) and click **Add New Project**. Select your repository.
5. Setup the Vercel project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
6. Click **Deploy**. Your frontend is now live globally and talks to your Render backend!

### Option 2: Pinecone Vector Database (If you want 100% Vercel)
If you wish to host the python backend strictly on Vercel Serverless, you must replace ChromaDB with an external Vector DB like **Pinecone**, because Vercel does not allow writing to local SQLite files during runtime.

1. Create a Pinecone index.
2. Update `main.py` and `ingest.py` to use `PineconeVectorStore` instead of `Chroma`.
3. Add a `vercel.json` file in your root folder configuring the Python runtime API builder.
4. Deploy the entire monolithic repository to Vercel. 
*(For beginners, Option 1 is highly recommended as it requires zero code modifications!)*
