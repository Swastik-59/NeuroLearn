<div align="center">

# 🧠 NeuroLearn

### Adaptive Personalized Learning Tutor

An AI-powered learning platform that adapts to each student's level in real time.
Upload your study material, take diagnostics, get personalised lessons and exercises,
track mastery with an analytics dashboard, and revise with smart flashcards.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-4285F4?logo=google)](https://ai.google.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Ollama](https://logowik.com/ollama-language-model-logo-vector-71308.html)](https://ollama.com)

</div>

---

## ✨ Features

| Category | Details |
|---|---|
| **Adaptive Engine** | Bayesian-style scoring adjusts difficulty level (Beginner → Intermediate → Advanced) after every exercise |
| **Diagnostic Assessment** | Choose question format (MCQ / True-False / Short Answer / Descriptive / Mixed) and get placed at the right level |
| **AI-Generated Lessons** | Structured markdown lessons tailored to the student's current level |
| **Smart Exercises** | 5 question types with instant grading and detailed feedback |
| **PDF / PPTX Upload + RAG** | Upload study material → sentence-aware chunking → TF-IDF retrieval → generate lessons & quizzes from *your* content |
| **Flashcard System** | AI-generated flashcards with flip animation, known/remaining tracking, and progress bar |
| **Mastery Dashboard** | Live accuracy, level history, topic heatmap, weakness analysis, and recommendations |
| **Dual AI Provider** | Toggle between **Google Gemini** (cloud) and **Ollama / Mistral** (local) with a single env var |
| **Dark Glassmorphism UI** | Polished dark theme with frosted glass cards, gradient accents, and Framer Motion animations |

---

## 🏗️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **FastAPI 0.110** | Async REST API framework |
| **MongoDB Atlas** (motor ≥ 3.6) | Cloud NoSQL database for sessions, scores, and progress |
| **Google Generative AI** (google-genai) | Gemini 2.5 Flash — lesson, quiz, and flashcard generation |
| **Ollama + Mistral** (httpx ≥ 0.27) | Local LLM fallback for offline / token-saving development |
| **scikit-learn** | TF-IDF vectorizer + cosine similarity for RAG retrieval |
| **PyPDF2** | PDF text extraction |
| **python-pptx** | PowerPoint text extraction |
| **Pydantic** | Request / response validation |
| **certifi** | SSL CA bundle for MongoDB Atlas TLS |

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework with SSR/SSG support |
| **TailwindCSS 3.4** | Utility-first CSS with custom dark theme |
| **Framer Motion 11** | Page transitions, flip animations, staggered reveals |
| **Axios** | HTTP client with 120 s timeout |
| **Lenis** | Smooth scrolling |

---

## 📁 Project Structure

```
NeuroLearn/
├── README.md
├── backend/
│   ├── .env                    # Environment variables (see below)
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── routes.py               # All 10 API endpoints
│   ├── models.py               # LEVELS & SUBJECTS constants
│   ├── schemas.py              # Pydantic request / response models
│   ├── database.py             # MongoDB Atlas connection (motor + certifi)
│   ├── gemini_client.py        # Dual AI provider (Gemini / Ollama)
│   ├── adaptive_engine.py      # Diagnostic scoring & level adjustment
│   ├── performance_tracker.py  # Per-topic / per-type mastery tracking
│   ├── flashcard_engine.py     # Flashcard prompt builder
│   ├── material_rag.py         # RAG pipeline: extract → chunk → store → retrieve
│   └── requirements.txt        # Python dependencies
└── frontend/
    ├── app/
    │   ├── page.tsx             # Root orchestrator (step navigation)
    │   ├── layout.tsx           # HTML layout + global font
    │   ├── globals.css          # Tailwind layers + custom styles
    │   ├── diagnostic.tsx       # Diagnostic assessment + type selector
    │   ├── quiz.tsx             # Initial placement quiz
    │   ├── lesson.tsx           # AI-generated lesson viewer
    │   ├── exercise.tsx         # Practice questions + grading
    │   ├── dashboard.tsx        # Mastery analytics dashboard
    │   ├── flashcards.tsx       # Flashcard system with flip UI
    │   └── material-upload.tsx  # Drag-and-drop file upload + RAG Q&A
    ├── components/              # Shared UI components
    ├── lib/                     # Utility functions
    ├── tailwind.config.js
    ├── next.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **MongoDB Atlas** cluster (free M0 tier works)
- **Google Gemini API key** — [get one free](https://aistudio.google.com/apikey)
- *(Optional)* **Ollama** installed locally with Mistral model pulled

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/NeuroLearn.git
cd NeuroLearn
```

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install certifi           # Required for MongoDB Atlas TLS
```

Create a `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
IS_GEMINI=true
OLLAMA_MODEL=mistral
```

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Generative AI API key | *(required when IS_GEMINI=true)* |
| `MONGO_URI` | MongoDB Atlas connection string | *(required)* |
| `IS_GEMINI` | `true` = use Gemini API, `false` = use local Ollama | `true` |
| `OLLAMA_MODEL` | Ollama model name when IS_GEMINI=false | `mistral` |

> **Important:** Add your machine's IP to the MongoDB Atlas Network Access whitelist, or use `0.0.0.0/0` for development.

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd ../frontend

npm install
npm run dev          # Starts on http://localhost:3000
```

### 4. (Optional) Ollama Local Mode

To save Gemini API tokens during development, use the local Ollama provider:

```bash
# Install Ollama: https://ollama.ai
ollama pull mistral

# In backend/.env, set:
IS_GEMINI=false
OLLAMA_MODEL=mistral
```

Restart the backend server. All AI calls will now go to Ollama on `localhost:11434`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/start-session` | Create a new learning session for a subject |
| `POST` | `/api/generate-diagnostic` | Generate diagnostic quiz (configurable question type) |
| `POST` | `/api/submit-diagnostic` | Submit answers and determine initial level |
| `POST` | `/api/generate-lesson` | Generate an AI lesson for the current level |
| `POST` | `/api/generate-exercise` | Generate practice questions (MCQ/TF/Short/QA/Mixed) |
| `POST` | `/api/submit-exercise` | Grade exercise, update level and mastery |
| `GET`  | `/api/progress/{sid}` | Get full progress analytics for a session |
| `POST` | `/api/upload-material` | Upload PDF/PPTX for RAG (multipart form) |
| `POST` | `/api/generate-from-material` | Generate lesson or quiz from uploaded material |
| `POST` | `/api/generate-flashcards` | Generate flashcards (from curriculum or uploaded material) |

---

## 🔄 How the Adaptive Engine Works

```
┌──────────────┐       ┌───────────────┐       ┌──────────────┐
│  Diagnostic  │──────▶│  Level Placed │──────▶│   Lesson     │
│  Assessment  │       │  (B / I / A)  │       │  Generated   │
└──────────────┘       └───────────────┘       └──────┬───────┘
                                                      │
                              ┌────────────────────────┘
                              ▼
                       ┌──────────────┐       ┌──────────────┐
                       │   Exercise   │──────▶│  Grading &   │
                       │   Practice   │       │  Level Adj.  │
                       └──────────────┘       └──────┬───────┘
                              ▲                      │
                              └──────────────────────┘
                                (loop until mastery)
```

1. **Diagnostic** → Bayesian-style scoring places the student at Beginner, Intermediate, or Advanced
2. **Lesson** → AI generates a structured lesson tailored to the placed level
3. **Exercise** → 5 questions at the current difficulty; answers are graded
4. **Level Adjustment** → If accuracy ≥ 80%: level up · If accuracy ≤ 40%: level down · Otherwise: stay
5. **Mastery** → Exponential moving average of accuracy across all attempts
6. **Repeat** → New lesson + exercise at the updated level until the student masters the topic

---

## 📄 RAG Pipeline (PDF / PPTX Upload)

```
 Upload          Extract         Clean           Chunk
┌──────┐  ───▶  ┌──────┐  ───▶  ┌──────┐  ───▶  ┌──────────────┐
│ PDF  │        │ Text │        │ Norm │        │ Sentence-    │
│ PPTX │        │      │        │      │        │ aware splits │
└──────┘        └──────┘        └──────┘        └──────┬───────┘
                                                       │
                 Retrieve          Store (TF-IDF)       │
                ┌──────────┐  ◀──  ┌──────────────┐ ◀──┘
                │ Top-k    │       │ Vectorize    │
                │ chunks   │       │ bigrams      │
                └────┬─────┘       │ sublinear TF │
                     │             └──────────────┘
                     ▼
              ┌──────────────┐
              │ Prompt +     │
              │ context ───▶ │  AI generates lesson / quiz
              │ from chunks  │
              └──────────────┘
```

**Key features of the RAG implementation:**

- **Sentence-aware chunking** — splits on sentence boundaries (`.!?`) and paragraph breaks instead of raw word counts, keeping context coherent
- **Sliding-window overlap** — 80-word overlap between chunks prevents information loss at boundaries
- **Bigram TF-IDF** — `ngram_range=(1, 2)` captures multi-word terms like "binary search" or "neural network"
- **Sublinear TF** — dampens high-frequency terms to give more weight to distinctive vocabulary
- **Score threshold** — filters out low-relevance chunks (cosine similarity < 0.05) with a fallback guarantee
- **Multi-file support** — uploading additional files appends to the existing chunk store per session
- **Text cleaning** — normalises whitespace, removes control characters, collapses blank lines
- **PPTX table extraction** — extracts text from both shapes and table cells
- **Slide attribution** — chunks from PPTX include `[Slide N]` markers for traceability

---

## 🃏 Flashcard System

- AI generates 10 flashcards per topic with a **front** (question) and **back** (answer)
- Can generate from curriculum knowledge or from **uploaded material** (RAG-backed)
- Interactive flip animation (Framer Motion 3D transform)
- Cards marked as "Known" are removed; progress bar shows remaining count
- Automatic key normalisation (`question→front`, `answer→back`) for consistent rendering

---

## 📊 Dashboard Analytics

The mastery dashboard provides real-time learning analytics:

| Metric | Description |
|---|---|
| **Overall Accuracy** | Percentage across all attempts |
| **Mastery Score** | Exponential moving average (0 – 100%) |
| **Level History** | Timeline of level changes (B → I → A) |
| **Topic Accuracy** | Heatmap of performance by topic area |
| **Question-Type Accuracy** | Breakdown by MCQ, True/False, Short, Q&A |
| **Weaknesses** | Auto-detected weak areas with < 50% accuracy |
| **Recommendations** | AI-generated study suggestions based on gaps |

---

## 📝 Supported Subjects

| # | Subject |
|---|---|
| 1 | Data Structures & Algorithms |
| 2 | Machine Learning |
| 3 | Operating Systems |
| 4 | Database Management |
| 5 | Computer Networks |
| 6 | Object Oriented Programming |
| 7 | Web Development |
| 8 | Discrete Mathematics |
| 9 | Computer Architecture |
| 10 | Cyber Security |
| 11 | Cloud Computing |
| 12 | Artificial Intelligence |

---

## 🧩 Question Types

| Type | Format | Grading |
|---|---|---|
| **MCQ** | 4 options, single correct | Exact match |
| **True / False** | Boolean answer | Exact match |
| **Short Answer** | Brief text response | AI-assisted |
| **Descriptive (Q&A)** | Long-form with expected points | Point coverage |
| **Mixed** | Random combination of above | Per-type rules |

---

## 🛠️ Development Notes

### Switching AI Providers

| Mode | `IS_GEMINI` | Model | Rate Limit |
|---|---|---|---|
| **Production** | `true` | Gemini 2.5 Flash | ~1500 req/day (free tier) |
| **Development** | `false` | Ollama / Mistral (local) | Unlimited |

The AI client (`gemini_client.py`) includes:
- **Smart retry** with exponential backoff (up to 4 retries)
- **429 handling** — parses `retryDelay` from Gemini error responses
- **JSON unwrapping** — handles Ollama's tendency to wrap arrays in `{data: [...]}` objects

### MongoDB Atlas SSL

If you encounter `SSL: CERTIFICATE_VERIFY_FAILED`, ensure `certifi` is installed:

```bash
pip install certifi
```

The database module uses `certifi.where()` as the TLS CA file automatically.

### Environment Changes

Changes to `.env` require a **server restart** — the `IS_GEMINI` flag is cached at first use for performance.

---

## 📜 License

This project is built for the hackathon and is available under the [MIT License](LICENSE).
