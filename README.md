# NeuroLearn

**Adaptive Learning Platform with Cognitive Load Modeling, Weakness DNA Mapping, and Stress-Responsive Pedagogy**

---

## Core Innovation

NeuroLearn is a full-stack adaptive learning system that goes beyond static quiz-and-score tutoring. It continuously models the learner's cognitive state through three interconnected engines -- a Cognitive Strain Index derived from response timing and error patterns, a Weakness DNA map that tracks per-topic mastery degradation and recurring failure modes, and a real-time stress detector that triggers pedagogical interventions when performance instability is detected. These signals drive automatic difficulty adjustment, content selection, and pacing -- producing a closed-loop learning system that responds to how the learner is performing, not just what they got right.

---

## Problem Statement

Most AI tutoring tools generate content at a fixed difficulty and measure success by accuracy alone. They cannot distinguish between a student who answers slowly but correctly (conceptual struggle) and one who answers quickly but incorrectly (guessing). They do not track which specific topics degrade over time, what types of errors recur, or whether the learner is approaching cognitive overload. The result is a one-size-fits-all experience that fails to adapt meaningfully.

---

## What Makes NeuroLearn Different

| Conventional AI Tutors | NeuroLearn |
|---|---|
| Score-based difficulty adjustment | Multi-signal adaptive engine (accuracy + timing + streaks + strain) |
| Flat accuracy tracking | Per-topic Weakness DNA with error-type classification and pattern tracking |
| No cognitive state awareness | Cognitive Strain Index (0-100) computed from response time variance and mistake streaks |
| No stress detection | Real-time stress detection with three intervention types |
| Generic content generation | RAG pipeline grounded in the learner's own uploaded material |
| Text-only output | Multi-modal: lessons, exercises, flashcards, AI-generated podcasts with TTS |
| No wellness integration | Embedded posture trainer (MediaPipe), breathing exercises, eye exercises, ambient soundscapes |

---

## NeuroAdaptive Engine

The NeuroAdaptive Engine is a backend subsystem implemented across `performance_tracker.py` and `adaptive_engine.py`. It operates on every exercise submission and produces three outputs: a cognitive strain score, an adaptive mode classification, and a stress detection result.

### Cognitive Strain Index (CSI)

A composite score from 0 to 100 computed after each exercise submission:

| Signal | Weight | Normalization |
|---|---|---|
| Average response time per question | 40% | Capped at 60 seconds |
| Standard deviation of response times | 30% | Capped at 30 seconds |
| Consecutive mistake streak length | 30% | Capped at 5 consecutive errors |

The CSI captures not just whether a student is struggling, but the temporal pattern of that struggle. High variance in response times indicates cognitive inconsistency. A rising mistake streak compounds the index even if average speed is normal.

### Adaptive Mode Classifier

The CSI and per-session accuracy feed a four-state classifier that determines the current pedagogical mode:

| Mode | Condition | System Response |
|---|---|---|
| `fluency_training` | Accuracy >= 70% and avg response time > 30s | Student knows the material but is slow; push toward speed |
| `concept_reinforcement` | Accuracy < 50% and avg response time < 8s | Student is guessing; force slower, deeper engagement |
| `cognitive_overload` | Accuracy < 50% and avg response time > 30s | Student is overwhelmed; reduce complexity |
| `standard` | All other cases | Normal progression |

### Weakness DNA

A per-topic profile maintained across the session. For each topic the learner has attempted:

- **Mastery score**: Derived from the topic's correct/total ratio in `topic_accuracy`
- **Error types**: The question formats (MCQ, short answer, true/false, open-ended) on which the learner failed for that topic
- **Recurring patterns**: Keywords extracted from incorrect answers (up to 20), surfacing systematic misconceptions

Topics are automatically removed from the weakness profile when accuracy reaches 60% with at least 3 attempts, reflecting genuine recovery.

### Stress Detection

Three independent triggers, checked after every exercise submission:

| Trigger | Condition | Recommended Action |
|---|---|---|
| Mistake streak | 3+ consecutive wrong answers | `switch_to_review` |
| Response time spike | Last response > 2.5x running average AND > 30s | `micro_break` |
| Rolling accuracy collapse | Last 5 answers < 30% accuracy | `simplified_explanation` |

The stress detection result is surfaced to the frontend as a non-intrusive alert banner with context-specific guidance.

---

## System Architecture

```
Browser (Next.js 14)
    |
    | Axios + JWT Bearer token
    v
FastAPI (uvicorn, /api prefix)
    |
    +-- Auth (bcrypt + JWT via python-jose)
    +-- Session Management (MongoDB via Motor)
    +-- Content Generation
    |       +-- Google Gemini API (primary LLM)
    |       +-- Ollama / Mistral (local fallback)
    |
    +-- RAG Pipeline
    |       +-- Text extraction (PyPDF2, python-pptx)
    |       +-- Sentence-aware chunking (500 tokens, 80 overlap)
    |       +-- TF-IDF vectorization (scikit-learn, 8000 features, bigrams)
    |       +-- Cosine similarity retrieval (top-5 chunks)
    |
    +-- Performance Tracker
    |       +-- CSI computation
    |       +-- Adaptive mode classification
    |       +-- Weakness DNA profiling
    |       +-- Stress detection
    |       +-- Mastery computation
    |       +-- Level adjustment
    |
    +-- Podcast Engine
    |       +-- LLM script generation (host + guest dialogue)
    |       +-- ElevenLabs TTS (per-segment voice synthesis)
    |       +-- MP3 concatenation and serving
    |
    +-- MongoDB Atlas
            +-- sessions (learning state, performance, history)
            +-- users (credentials, profile)
```

---

## Feature Breakdown

### Adaptive Learning Loop

1. **Subject Selection** -- Choose from 12 computer science subjects
2. **Diagnostic Assessment** -- 5 questions to determine initial level (Beginner/Intermediate/Advanced)
3. **Lesson Generation** -- LLM-generated structured lesson at the diagnosed level
4. **Exercise Generation** -- 5 practice questions in configurable format (MCQ, short answer, true/false, open-ended, mixed)
5. **Submission with Timing** -- Per-question response times captured and sent alongside answers
6. **Adaptive Scoring** -- Accuracy, mastery, CSI, adaptive mode, stress detection all computed server-side
7. **Level Adjustment** -- Difficulty raised or lowered based on mastery (>80% up, <50% down) or accuracy
8. **Progress Dashboard** -- Full cognitive analytics, weakness DNA, topic/type accuracy breakdown, recommendations

### RAG-Based Material Learning

- Upload PDF or PPTX files (client-side format validation)
- Server-side text extraction and sentence-aware chunking
- TF-IDF vectorization with bigram features stored in-memory per session
- Cosine similarity retrieval of top-5 relevant chunks for any generation request
- RAG-grounded lesson or exercise generation from the learner's own material
- Multi-file support: new uploads append to existing session store

### Flashcard System

- Generate from subject/topic directly via LLM
- Generate from uploaded material via RAG retrieval
- 3D flip animation with `rotateY` transitions
- Swipe navigation (Framer Motion drag) on mobile
- Keyboard navigation (arrow keys, spacebar) on desktop
- Per-card "known" tracking with visual progress dots

### AI Podcast Generation

- LLM generates a two-speaker conversational script (8-14 exchanges) on any topic
- Speakers: "Alex" (host) and "Dr. Sam" (expert guest) with per-line emotion tags
- ElevenLabs TTS synthesis with distinct voice IDs per speaker
- Per-segment and full-episode MP3 audio served via static file endpoint
- Custom audio player with waveform visualization and seek controls
- Chat-style transcript display with speaker avatars

### Wellness Module

- **Posture Trainer**: MediaPipe PoseLandmarker via webcam for guided exercises (head tilts, chin tucks, shoulder rolls). Canvas overlay with real-time skeleton rendering. Timer advances only when correct posture is detected.
- **Breathing Exercise**: 4-4-6 cadence (inhale/hold/exhale) with animated circle visualization
- **Eye Exercise**: 30-second guided eye movement with animated tracking dot
- **Ambient Soundscapes**: 5 tracks (Rain, Forest, Ocean, Brown Noise, Lo-fi Piano) with volume control, fade transitions, and context-aware auto-pause during podcast playback

---

## Backend Architecture Overview

| Module | Responsibility |
|---|---|
| `main.py` | FastAPI app bootstrap, CORS, lifespan (DB connect/disconnect), router mount |
| `routes.py` | 13 API endpoints: auth, sessions, diagnostics, lessons, exercises, materials, flashcards, podcasts, progress |
| `adaptive_engine.py` | Level calculation, level adjustment, prompt generation for lessons/exercises/diagnostics |
| `performance_tracker.py` | CSI computation, adaptive mode classification, weakness DNA, stress detection, mastery scoring, answer recording |
| `material_rag.py` | Text extraction, chunking, TF-IDF vectorization, cosine retrieval, RAG prompt building |
| `gemini_client.py` | Dual-provider LLM client (Gemini / Ollama) with retry logic, rate-limit handling, robust JSON parsing |
| `flashcard_engine.py` | Flashcard prompt templates (direct and material-based) |
| `podcast_engine.py` | Script generation, ElevenLabs TTS integration, MP3 assembly |
| `database.py` | MongoDB connection via Motor, session CRUD, user collection access |
| `models.py` | Constants: level names, subject list |
| `schemas.py` | Pydantic request/response models for all endpoints |

---

## Frontend Architecture Overview

| Layer | Implementation |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 with CSS custom properties design system (light/dark themes) |
| Animation | Framer Motion 11 (page transitions, scroll reveals, 3D card flips, spring counters, drag interactions) |
| HTTP | Axios with JWT interceptor, 120s default timeout |
| Routing | `/` (landing), `/login`, `/signup`, `/[userId]/dashboard` (SPA orchestrator) |
| State | Local `useState` in orchestrator + per-page components; no global state library |
| Smooth Scroll | Lenis provider wrapping all routes |

### Orchestrator Pattern

The `/[userId]/dashboard` route acts as a client-side SPA after authentication. A `step` state machine drives which page component renders:

```
select -> quiz -> lesson -> exercise -> dashboard -> (loop back to lesson, or navigate to flashcards/upload/podcast)
```

Shared state (`sessionId`, `subject`, `level`, `hasMaterial`) is lifted to the orchestrator and passed via props. Page transitions use `AnimatePresence` with blur/fade/translate variants. Navigation history (`prevStep`) enables correct "Back" button behavior.

### Key Components

| Component | Purpose |
|---|---|
| `Header` | Sticky, auto-hiding on scroll. Desktop center nav with animated tab underline. Responsive right-side actions. |
| `MobileDock` | Bottom floating dock (mobile/tablet). Glass-morphism, animated active indicator, 44px touch targets. |
| `QuestionCard` | Polymorphic renderer for MCQ, true/false, short answer, and open-ended questions. Review mode with color-coded correctness. |
| `SoundscapePlayer` | 5-track ambient audio with fade transitions, volume slider, context-aware auto-pause. |
| `WellnessCoach` | Modal with posture trainer (MediaPipe), breathing exercise, eye exercise. |
| `CustomCursor` | Dot + trailing ring with hover scaling. Desktop only (pointer: fine). |
| `ProgressBar` | Animated bar with color thresholds (green/amber/red) and optional glow. |
| `DifficultyBadge` | Color-coded pill for Beginner/Intermediate/Advanced with pulsing indicator. |

---

## RAG System Explanation

The Retrieval-Augmented Generation pipeline in `material_rag.py` operates in three stages:

**1. Ingestion**

- PDF text extracted via `PyPDF2.PdfReader` (all pages)
- PPTX text extracted via `python-pptx` (shapes + table cells, slide-numbered)
- Text cleaned: whitespace normalized, control characters removed, excessive newlines collapsed

**2. Chunking**

- Sentence-aware splitting by punctuation boundaries (`.!?`) and double newlines
- Greedy packing up to 500 tokens per chunk
- 80-token sliding window overlap between consecutive chunks
- Trailing fragments (< 25% of max) merged with previous chunk

**3. Retrieval**

- `TfidfVectorizer` with English stop words, 8000 max features, unigram + bigram, sublinear TF
- Per-session in-memory store (supports additive multi-file uploads)
- Query transformed against stored vectorizer; cosine similarity against TF-IDF matrix
- Top-5 chunks above 0.05 similarity threshold returned
- Fallback: top 2 chunks returned if nothing passes threshold
- Retrieved chunks injected into structured prompts for lesson or exercise generation

---

## Cognitive Load and Weakness DNA Logic

### Mastery Score (0-100)

Computed in `compute_mastery()` as a weighted composite:

| Component | Weight | Calculation |
|---|---|---|
| Overall accuracy | 60% | Aggregate correct/total across all topics |
| Coverage breadth | 20% | Unique topics + question types attempted, normalized by 8 |
| Best streak | 20% | Longest consecutive correct streak, capped at 10 |

### Level Adjustment

`adjust_level()` uses a priority system:

1. If mastery score is available: >80 triggers level up, <50 triggers level down
2. Otherwise: accuracy >80 triggers level up, <40 triggers level down
3. Level is clamped to the range [Beginner, Intermediate, Advanced]

### Weakness Detection

`detect_weaknesses()` returns topics and question types where:
- Accuracy is below 50%
- At least 2 attempts have been made

### Study Recommendations

`get_study_recommendations()` generates text-based guidance:
- Mastery < 30: fundamentals advice
- Mastery 30-59: progress encouragement with specific weakness targeting
- Mastery >= 60: advance to harder material
- Per-weakness specific recommendations appended
- Streak information included for motivation

---

## Stress Detection Logic

Implemented in `detect_stress()` within `performance_tracker.py`. Three triggers are checked sequentially; the first match is returned:

**Trigger 1: Mistake Streak**
- Condition: `mistake_streak >= 3` (3+ consecutive wrong answers)
- Action: `switch_to_review`
- Rationale: Persistent errors indicate the learner is stuck and needs to revisit fundamentals

**Trigger 2: Response Time Spike**
- Condition: Last response time > 2.5x the running average AND exceeds 30 seconds absolute
- Action: `micro_break`
- Rationale: Sudden slowdown suggests cognitive fatigue or confusion

**Trigger 3: Rolling Accuracy Collapse**
- Condition: Accuracy across the last 5 answers drops below 30%
- Action: `simplified_explanation`
- Rationale: Rapid accuracy degradation suggests material is too complex

The result `{stress_detected: bool, recommended_action: string | null}` is returned to the frontend and displayed as a non-intrusive banner.

---

## API Surface Summary

All endpoints are prefixed with `/api`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Create user account (username, email, password) |
| POST | `/auth/login` | None | Authenticate, returns JWT + userId |

### Session Management

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/start-session` | JWT | Create learning session for a subject |

### Diagnostic

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/diagnostic-questions` | None | Generate diagnostic questions for initial assessment |
| POST | `/diagnostic` | None | Submit diagnostic answers, receive level classification |

### Content Generation

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generate-lesson` | None | Generate structured lesson at current level |
| POST | `/generate-exercise` | None | Generate 5 practice questions in specified format |
| POST | `/submit-exercise` | None | Submit answers with timing data; returns full adaptive analysis |

### Material (RAG)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload-material` | None | Upload PDF/PPTX; extract, chunk, vectorize |
| POST | `/generate-from-material` | None | Generate RAG-grounded lesson or exercise |

### Flashcards

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generate-flashcards` | None | Generate flashcards from subject or uploaded material |

### Podcast

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generate-podcast` | None | Generate two-speaker podcast script + TTS audio |
| GET | `/podcast-audio/{filename}` | None | Serve generated MP3 file |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/progress` | None | Full progress report: mastery, CSI, weakness DNA, recommendations |
| GET | `/weakness-profile/{session_id}` | None | Weakness DNA profile for a session |

---

## Tech Stack

### Backend

| Component | Technology |
|---|---|
| Framework | FastAPI 0.110 |
| Server | Uvicorn (ASGI) |
| Database | MongoDB Atlas via Motor (async driver) |
| Auth | bcrypt password hashing + JWT (python-jose, HS256) |
| LLM (Primary) | Google Gemini API (gemini-2.5-flash) |
| LLM (Fallback) | Ollama with configurable model (default: Mistral) |
| TTS | ElevenLabs API (eleven_multilingual_v2) |
| RAG Vectorization | scikit-learn TfidfVectorizer + cosine similarity |
| Document Parsing | PyPDF2 (PDF), python-pptx (PPTX) |
| HTTP Client | httpx (async, for Ollama and ElevenLabs) |
| Validation | Pydantic v2 |

### Frontend

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 + CSS custom properties |
| Animation | Framer Motion 11 |
| HTTP | Axios |
| Pose Detection | MediaPipe PoseLandmarker (via @mediapipe/tasks-vision) |
| Smooth Scroll | Lenis |

---

## Data Model and Persistence

### MongoDB Collections

**`users`**

```
{
  user_id: string,
  username: string,
  email: string,
  hashed_password: string,
  is_active: boolean
}
```

**`sessions`** (unique index on `session_id`)

```
{
  session_id: string,
  user_id: string | null,
  subject: string,
  level: "unknown" | "Beginner" | "Intermediate" | "Advanced",
  total_correct: int,
  total_attempts: int,
  level_history: string[],
  performance: {
    topic_accuracy: { [topic]: { correct: int, total: int } },
    type_accuracy: { [question_type]: { correct: int, total: int } },
    mastery_score: float,
    total_time_seconds: float,
    total_responses: int,
    streak: int,
    best_streak: int,
    correct_streak: int,
    mistake_streak: int,
    response_times: float[],        // last 50
    rolling_results: boolean[],     // last 20
    cognitive_strain_index: float,
    adaptive_mode: string | null,
    weakness_profile: {
      [topic]: {
        mastery_score: float,
        error_types: string[],
        recurring_patterns: string[],  // max 20
        last_updated: string
      }
    },
    stress_history: string[]
  },
  created_at: datetime
}
```

### In-Memory Stores

- **RAG Vector Store**: Per-session TF-IDF matrices and chunk text stored in a Python dict. Not persisted across server restarts.
- **Podcast Audio**: MP3 files written to `backend/podcast_audio/` directory.

---

## How Adaptive Logic Works

Step-by-step flow for a single exercise submission:

1. **Answer Scoring**: Each answer scored by type -- exact match for MCQ/short, boolean normalization for true/false, substring containment for open-ended
2. **Timing Resolution**: Per-question times used if provided; otherwise total session time distributed evenly
3. **Topic Accuracy Update**: Correct/total counts incremented for the exercise topic in `performance.topic_accuracy`
4. **Type Accuracy Update**: Same for the question format in `performance.type_accuracy`
5. **Response Time Recording**: Per-question times appended to `response_times` (capped at last 50)
6. **Streak Update**: `streak`, `correct_streak`, `mistake_streak`, `best_streak` all updated based on sequential correctness
7. **Rolling Results**: Last 20 correct/incorrect booleans maintained for windowed analysis
8. **CSI Computation**: `_compute_csi()` calculates the Cognitive Strain Index from response time stats and mistake streak
9. **Adaptive Mode**: `_determine_adaptive_mode()` classifies current mode from accuracy and average response time
10. **Weakness DNA**: `_update_weakness_profile()` updates per-topic mastery, error types, and recurring misconception patterns; removes recovered topics
11. **Mastery Computation**: `compute_mastery()` produces the 0-100 mastery score from accuracy, coverage, and streaks
12. **Level Adjustment**: `adjust_level()` raises or lowers difficulty based on mastery or accuracy thresholds
13. **Stress Detection**: `detect_stress()` checks mistake streak, response time spikes, and rolling accuracy for intervention triggers
14. **Persistence**: All updated fields written to MongoDB session document

---

## How to Run Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB instance)
- Google Gemini API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGO_DB=neurolearn
SECRET_KEY=your_jwt_secret_key
IS_GEMINI=true
EOF

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and expects the backend at `http://localhost:8000`.

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes (if IS_GEMINI=true) | -- | Google Gemini API key |
| `MONGO_URI` | Yes | Placeholder Atlas URI | MongoDB connection string |
| `MONGO_DB` | No | `neurolearn` | MongoDB database name |
| `SECRET_KEY` | Yes | Hardcoded fallback | JWT signing secret |
| `IS_GEMINI` | No | `true` | `true` for Gemini, `false` for Ollama |
| `OLLAMA_MODEL` | No | `mistral` | Ollama model name (when IS_GEMINI=false) |
| `ELEVENLABS_API_KEY` | No | -- | ElevenLabs API key for podcast TTS |
| `ELEVENLABS_MODEL` | No | `eleven_multilingual_v2` | ElevenLabs model ID |
| `ELEVENLABS_HOST_VOICE` | No | `pNInz6obpgDQGcFmaJgB` | Voice ID for podcast host |
| `ELEVENLABS_GUEST_VOICE` | No | `21m00Tcm4TlvDq8ikWAM` | Voice ID for podcast guest |

---

## Known Limitations

- **RAG store is in-memory**: TF-IDF vectors and chunks are not persisted. A server restart clears all uploaded material.
- **No multi-session continuity**: Each session is independent. Weakness DNA and mastery do not carry across sessions for the same user.
- **Level granularity**: Only three levels (Beginner, Intermediate, Advanced). There is no continuous difficulty scale.
- **Scoring heuristics**: Answer scoring uses string matching (exact match for MCQ, substring for QA). There is no semantic similarity scoring.
- **Podcast audio**: MP3 concatenation is binary append, which works for CBR MP3 but is not a proper muxing operation.
- **No WebSocket communication**: All interactions are request/response. There is no real-time push for long-running generation tasks.
- **Single LLM dependency**: Content quality depends entirely on the configured LLM (Gemini or Ollama model).
- **No rate limiting on API**: Endpoints are not rate-limited beyond the LLM provider's own rate limits.

---

## Future Scalability

- **Persistent vector store**: Replace in-memory TF-IDF with a vector database (FAISS, Qdrant, or Pinecone) for durable RAG storage
- **Cross-session learning profiles**: Aggregate weakness DNA and mastery across sessions per user for longitudinal tracking
- **Embedding-based retrieval**: Replace TF-IDF with dense embeddings for higher-quality semantic retrieval
- **Semantic answer scoring**: Use LLM-based evaluation for open-ended answer grading instead of substring matching
- **Continuous difficulty scaling**: Replace three discrete levels with a continuous Elo-like rating system
- **Collaborative filtering**: Use aggregate user performance data to identify commonly difficult topics and optimize content ordering
- **Spaced repetition**: Integrate SM-2 or similar algorithms into the flashcard system for optimal review scheduling

---

## Why This Is Hackathon-Worthy

**Technical depth, not surface breadth.** NeuroLearn does not simply wrap an LLM with a chat interface. It implements a structured adaptive pipeline where every exercise submission triggers a cascade of computations -- cognitive strain indexing, adaptive mode classification, weakness profiling, stress detection, mastery scoring, and level adjustment -- all feeding back into the next content generation cycle.

**Closed-loop adaptation.** The system forms a genuine feedback loop: diagnostic -> content generation -> exercise -> multi-signal analysis -> difficulty adjustment -> next content generation. Each iteration refines the model of the learner's cognitive state.

**Grounded generation.** The RAG pipeline enables content generation from the learner's own study materials, not just generic LLM knowledge. The sentence-aware chunking and TF-IDF retrieval ensure relevant context is injected into every prompt.

**Multi-modal output.** A single platform produces structured lessons (markdown), interactive exercises (5 question types with per-question timing), flashcards (with swipe and keyboard navigation), and full podcast episodes (LLM script generation + multi-voice TTS synthesis).

**Wellness as infrastructure.** The posture trainer uses real-time pose estimation (MediaPipe PoseLandmarker) via webcam with canvas-rendered skeleton overlay. This is not a timer -- the exercise only advances when the correct posture is detected. Combined with guided breathing, eye exercises, and ambient soundscapes, wellness is integrated as a core system capability rather than an afterthought.

**Production-grade frontend.** Responsive design (320px-1440px), fixed header with scroll-aware auto-hiding, mobile bottom dock with glass-morphism, 3D card flip animations, spring-animated counters, SVG mastery rings, drag-based swipe navigation, custom cursor, dual-theme system with flash prevention, and smooth scroll -- all implemented without a component library.