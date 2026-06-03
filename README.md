# Sizuka — AI Talent Scouting Agent

## Demo

🎥 Demo Video:
https://drive.google.com/file/d/1u49YvvJnQzCrJrjRicfDqbwUtPqxiYSw/view?usp=sharing

Watch a complete end-to-end walkthrough showing JD ingestion, candidate discovery, AI scoring, automated outreach, reply handling, and final shortlist generation.

---

An autonomous AI pipeline that takes a Job Description as input, discovers matching candidates from GitHub and Hacker News, scores them, sends personalised outreach emails, and outputs a ranked shortlist — all without recruiter involvement.

---

## Key Features

- Multi-agent AI recruiting workflow
- GitHub & Hacker News candidate discovery
- LangGraph orchestration
- AI-powered candidate scoring
- Automated personalized outreach
- Gmail reply handling
- Real-time pipeline monitoring
- PostgreSQL + Redis backed architecture

---

### Tech Stack

**Frontend:** React, TypeScript, SSE

**Backend:** NestJS, BullMQ, Redis

**AI Pipeline:** Python, FastAPI, LangGraph, Groq LLM

**Data:** PostgreSQL (Supabase)

**Integrations:** GitHub API, Hacker News API, Resend, Gmail IMAP

---

## How it works

1. Recruiter pastes a JD → **NestJS API** creates a job and pushes it to BullMQ
2. **BullMQ worker** triggers the **Python FastAPI** pipeline
3. Pipeline runs 6 LangGraph stages: parse JD → discover candidates → match + score → send outreach → score replies → finalise shortlist
4. **Frontend** shows live pipeline progress via SSE and the final ranked shortlist
5. When candidates reply to the outreach email, the **Gmail IMAP listener** detects the reply and the AI continues the conversation automatically

---

## Architecture

```
Frontend (React · port 5173)
    │  HTTP
    ▼
NestJS API (port 3000)  ──── BullMQ ──── Redis (port 6379)
    │                              │
    │  SSE                         │  trigger
    ▼                              ▼
Frontend (live events)    Python Agent (port 8000)
                               │
                   ┌───────────┼───────────┐
                   │           │           │
               GitHub API   HN Algolia  Groq LLM
                               │
                           Resend API (outreach email)
                               │
                          Gmail IMAP (reply listener)
```

Both NestJS and Python share the same **PostgreSQL (Supabase)** instance.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| Bun | 1.0+ |
| Python | 3.11+ |
| Docker | any recent |

---

## Local setup

### 1. Clone and enter the repo

```bash
git clone https://github.com/channi23/sizuka.git
cd sizuka
```

### 2. Start Redis

```bash
docker compose up -d
```

### 3. Configure environment variables

**NestJS** — create `api/.env`:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
REDIS_URL=redis://localhost:6379
PYTHON_SERVICE_URL=http://localhost:8000
INTERNAL_API_SECRET=any-long-random-string
PORT=3000
```

**Python agent** — create `agent/.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
NESTJS_INTERNAL_URL=http://localhost:3000
INTERNAL_API_SECRET=same-secret-as-above
GROQ_API_KEY=gsk_...
RESEND_API_KEY=re_...
GITHUB_TOKEN=ghp_...
SENDER_EMAIL=onboarding@resend.dev
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App Passwords → Create → name it "Sizuka"

### 4. Push the database schema

```bash
cd api
bun install
bun run prisma:push
cd ..
```

### 5. Install all dependencies

```bash
# NestJS
cd api && bun install && cd ..

# Python
cd agent && pip install -r requirements.txt && cd ..

# Frontend
cd frontend && bun install && cd ..
```

### 6. Start all services

**Option A — one command (recommended):**

```bash
bash start.sh
```

**Option B — manually in separate terminals:**

```bash
# Terminal 1 — NestJS API
cd api && bun run start:dev

# Terminal 2 — Python agent
cd agent && uvicorn app.main:app --reload --port 8000

# Terminal 3 — Frontend
cd frontend && bun run dev
```

### 7. Open the app

- Frontend: http://localhost:5173
- Bull Board (queue monitor): http://localhost:3000/admin/queues

---

## Demo flow

Because Resend's free tier only delivers to the account owner's email, the pipeline redirects all outreach to `GMAIL_USER`. Subjects are prefixed `[Demo → CandidateName]` so the IMAP listener can route replies back to the correct candidate automatically.

1. Submit a job description on the dashboard
2. Watch the 6-stage pipeline run in real time
3. Check your Gmail — two outreach emails will arrive
4. Reply to one — the AI will respond within ~35 seconds (30 s poll + Groq latency)
5. The full conversation thread appears in the **Outreach** view

---

## Services at a glance

| Service | Port | Start command |
|---------|------|---------------|
| Redis | 6379 | `docker compose up -d` |
| NestJS API | 3000 | `cd api && bun run start:dev` |
| Python agent | 8000 | `cd agent && uvicorn app.main:app --reload --port 8000` |
| Frontend | 5173 | `cd frontend && bun run dev` |
| Bull Board | 3000/admin/queues | (part of NestJS) |

---

## Key environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Both | Supabase connection string (port 6543 for NestJS, 5432+asyncpg for Python) |
| `INTERNAL_API_SECRET` | Both | Shared secret for NestJS ↔ Python internal calls |
| `GROQ_API_KEY` | Python | Llama 3.3 70B for JD parsing, email gen, interest scoring |
| `RESEND_API_KEY` | Python | Email delivery |
| `GITHUB_TOKEN` | Python | GitHub user search (5000 req/hr vs 60 unauthenticated) |
| `GMAIL_USER` | Python | Gmail address for IMAP reply polling |
| `GMAIL_APP_PASSWORD` | Python | 16-character Gmail App Password |
