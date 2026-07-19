#!/bin/bash
# Kill any existing uvicorn on port 8000
pkill -f "uvicorn app.main" 2>/dev/null
sleep 1

# Start the server using the backend venv
cd /Users/rizal/txbob/backend
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
echo "Server restarted on port 8000"
