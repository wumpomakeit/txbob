# txBOB Backend — FastAPI + TxLINE oracle
FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install the Python SDK
COPY sdk-python/ ./sdk-python/
RUN pip install -e ./sdk-python/

# Copy the backend code
COPY backend/ ./backend/

# Set working directory to backend so 'app' imports resolve
WORKDIR /app/backend

# Railway injects $PORT dynamically — use shell form to expand it
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
