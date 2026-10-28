#!/usr/bin/env bash

# Veritas Clinical - Full-Stack Launcher (Django + React)
echo "=========================================================="
echo " Starting Veritas Clinical System"
echo " 1. Django REST Framework Backend (http://127.0.0.1:8000)"
echo " 2. React Vite Frontend          (http://localhost:3000)"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate virtualenv and start Django backend
source "$ROOT_DIR/venv/bin/activate"
python "$ROOT_DIR/manage.py runserver" 127.0.0.1:8000 &
DJANGO_PID=$!

echo "Django backend started with PID $DJANGO_PID."

# Cleanup on exit
trap "echo 'Shutting down services...'; kill $DJANGO_PID; exit" SIGINT SIGTERM EXIT

# Start React Frontend
cd "$ROOT_DIR/frontend"
npm run dev -- --port 3000
