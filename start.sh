#!/usr/bin/env bash
# Starts all Sizuka services: Redis, NestJS API, Python agent, and React frontend.
# Each service runs in its own terminal tab via osascript (macOS).
# On Linux, replace osascript blocks with gnome-terminal or xterm equivalents.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colour helpers ────────────────────────────────────────────────────────────
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }

# ── Prerequisite checks ───────────────────────────────────────────────────────
check() {
  if ! command -v "$1" &>/dev/null; then
    red "Missing: $1 — please install it before running this script."
    exit 1
  fi
}

check docker
check bun
check python3
check uvicorn

# ── .env checks ───────────────────────────────────────────────────────────────
if [[ ! -f "$ROOT/api/.env" ]]; then
  red "Missing api/.env — copy .env.example and fill in your credentials."
  exit 1
fi
if [[ ! -f "$ROOT/agent/.env" ]]; then
  red "Missing agent/.env — copy .env.example and fill in your credentials."
  exit 1
fi

# ── Redis ─────────────────────────────────────────────────────────────────────
green "▶ Starting Redis..."
docker compose -f "$ROOT/docker-compose.yml" up -d
sleep 1

# ── Open service terminals (macOS) ────────────────────────────────────────────
open_tab() {
  local title="$1"
  local cmd="$2"
  osascript <<EOF
tell application "Terminal"
  activate
  set newTab to do script "printf '\\\\033]0;${title}\\\\007'; ${cmd}"
end tell
EOF
}

green "▶ Opening NestJS API (port 3000)..."
open_tab "Sizuka · API" "cd '$ROOT/api' && bun run start:dev"

sleep 2

green "▶ Opening Python agent (port 8000)..."
open_tab "Sizuka · Agent" "cd '$ROOT/agent' && uvicorn app.main:app --reload --port 8000"

sleep 2

green "▶ Opening React frontend (port 5173)..."
open_tab "Sizuka · Frontend" "cd '$ROOT/frontend' && bun run dev"

# ── Wait for API to be ready, then open browser ───────────────────────────────
yellow "Waiting for services to start..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/api/jobs &>/dev/null; then
    break
  fi
  sleep 2
done

green "▶ Opening http://localhost:5173"
open http://localhost:5173

green ""
green "All services running:"
green "  Frontend  →  http://localhost:5173"
green "  API       →  http://localhost:3000"
green "  Agent     →  http://localhost:8000"
green "  Bull Board →  http://localhost:3000/admin/queues"
green ""
green "Stop everything: docker compose stop (Redis) + close the terminal tabs."
