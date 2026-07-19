"""Prediction endpoints — save, list, and check prediction status."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.models import (
    ErrorResponse,
    PredictionCreate,
    PredictionResponse,
    PredictionStatusResponse,
)
from app.resolver import resolve_markets

logger = logging.getLogger(__name__)

router = APIRouter(tags=["predictions"])


@router.post(
    "/predictions",
    response_model=PredictionResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}},
    summary="Save a new prediction",
    description="Stores a prediction placed from the frontend Place Bet flow.",
)
async def create_prediction(body: PredictionCreate) -> dict[str, Any]:
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO predictions
                (wallet, fixture_id, match_name, market_type, market_label,
                 selection, question, odds, amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                body.wallet,
                body.fixture_id,
                body.match_name,
                body.market_type,
                body.market_label,
                body.selection,
                body.question,
                body.odds,
                body.amount,
            ),
        )
        conn.commit()
        pred_id = cur.lastrowid

        # Fetch the complete row back
        row = conn.execute(
            "SELECT * FROM predictions WHERE id = ?", (pred_id,)
        ).fetchone()
    finally:
        conn.close()

    logger.info(
        "Prediction #%d saved — %s | %s | %.2f USDC | wallet=%s",
        pred_id, body.question, body.selection, body.amount,
        body.wallet[:8] if body.wallet else "demo",
    )

    return _row_to_dict(row)


@router.get(
    "/predictions/{wallet}",
    response_model=list[PredictionResponse],
    summary="Get user prediction history",
    description="Returns all predictions for a given wallet address.",
)
async def list_predictions(wallet: str) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE wallet = ? ORDER BY created_at DESC",
            (wallet,),
        ).fetchall()
    finally:
        conn.close()

    return [_row_to_dict(r) for r in rows]


@router.get(
    "/predictions/{prediction_id}/status",
    response_model=PredictionStatusResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Check prediction status",
    description="Returns status (pending/won/lost) and optional result for a prediction.",
)
async def check_prediction_status(prediction_id: int) -> dict[str, Any]:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, fixture_id, selection, status, result FROM predictions WHERE id = ?",
            (prediction_id,),
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return {
        "id": row["id"],
        "fixture_id": row["fixture_id"],
        "selection": row["selection"],
        "status": row["status"],
        "result": row["result"],
    }


def _row_to_dict(row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a plain dict."""
    return {
        "id": row["id"],
        "wallet": row["wallet"],
        "fixture_id": row["fixture_id"],
        "match_name": row["match_name"],
        "market_type": row["market_type"],
        "market_label": row["market_label"],
        "selection": row["selection"],
        "question": row["question"],
        "odds": row["odds"],
        "amount": row["amount"],
        "status": row["status"],
        "result": row["result"],
        "created_at": row["created_at"],
        "resolved_at": row["resolved_at"] if "resolved_at" in row.keys() else None,
    }


@router.post(
    "/predictions/resolve",
    responses={502: {"model": ErrorResponse}},
    summary="Manually trigger the resolver agent",
    description="Runs the resolver immediately. Useful for testing. Same logic as the 60-second scheduler.",
)
async def trigger_resolver() -> dict[str, Any]:
    logger.info("Manual resolver trigger")
    try:
        resolve_markets()
    except Exception as exc:
        logger.exception("Manual resolver failed")
        raise HTTPException(status_code=502, detail=f"Resolver error: {exc}")
    return {"status": "ok", "message": "Resolver run completed"}
