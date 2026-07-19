from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import fixtures, odds, predictions
from app.database import init_db
from app.scheduler import start as start_scheduler, stop as stop_scheduler


def _load_env() -> None:
    """Load .env from the backend folder or the repository root."""
    backend_dir = Path(__file__).resolve().parent.parent  # .../txbob/backend
    root_dir = backend_dir.parent                         # .../txbob

    for candidate in (backend_dir / ".env", root_dir / ".env"):
        if candidate.exists():
            load_dotenv(candidate)
            return

    # Fallback: let dotenv search upwards automatically
    load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    _load_env()
    init_db()
    start_scheduler()  # start background resolver agent
    # Add the sibling sdk-python directory to sys.path so we can import txbob
    root_dir = Path(__file__).resolve().parent.parent.parent  # .../txbob
    sdk_path = str(root_dir / "sdk-python")
    if sdk_path not in sys.path:
        sys.path.insert(0, sdk_path)
    yield
    stop_scheduler()


app = FastAPI(
    title="txBOB API",
    description="Backend API for txBOB — World Cup fixtures, odds, and match statuses.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Railway frontend domain and local development
_railway_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
_cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
]
if _railway_url:
    _cors_origins.append(f"https://{_railway_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(fixtures.router, prefix="/api")
app.include_router(odds.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")


@app.get("/health")
async def health_check():
    """Simple health-check endpoint."""
    return {"status": "ok"}
