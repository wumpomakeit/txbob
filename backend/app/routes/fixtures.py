from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import ErrorResponse
from app.sdk import get_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["fixtures"])

# Status integer → label mapping (upstream uses integers)
_STATUS_MAP: dict[int, str] = {
    0: "NotStarted",
    1: "Live",
    2: "Finished",
    3: "Postponed",
    4: "Cancelled",
}


def _status_label(value: Any) -> str:
    """Map an upstream status value to a human-readable label."""
    if isinstance(value, int):
        return _STATUS_MAP.get(value, f"Unknown({value})")
    if isinstance(value, str) and value.isdigit():
        return _STATUS_MAP.get(int(value), f"Unknown({value})")
    # Already a string label
    return str(value) if value else "NotStarted"


@router.get(
    "/fixtures",
    responses={502: {"model": ErrorResponse}},
    summary="List all fixtures",
    description="Returns all available fixtures across all competitions (World Cup, Friendlies, etc.).",
)
async def list_fixtures() -> dict[str, Any]:
    client = get_client()
    try:
        raw = client.get_fixtures()  # no competition_id → return all
    except Exception as exc:
        logger.exception("Failed to fetch fixtures from upstream")
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}")

    # Normalise upstream response to a list of fixture dicts.
    # Upstream keys: FixtureId, Participant1 (str), Participant2 (str),
    # StartTime (epoch ms int), GameState (int).
    fixtures: list[dict[str, Any]] = []
    if isinstance(raw, list):
        fixtures = raw
    elif isinstance(raw, dict):
        fixtures = raw.get("data", raw.get("fixtures", []) or [])

    items: list[dict[str, Any]] = []
    for f in fixtures:
        if isinstance(f, dict):
            fixture_id = f.get("FixtureId", f.get("fixtureId", f.get("id", 0)))

            # Participant1 / Participant2 are plain strings like "Spain"
            p1 = f.get("Participant1")
            p2 = f.get("Participant2")
            home_name = str(p1) if p1 else "TBD"
            away_name = str(p2) if p2 else "TBD"

            # Normalise startTime (upstream sends epoch millis as int)
            start_time = f.get("StartTime", f.get("startTime", f.get("start_time")))

            # Normalise status to string label (upstream sends integer codes)
            raw_status = f.get("GameState", f.get("status"))
            status = _status_label(raw_status)

            # Competition info (upstream sends CompetitionId as int, Competition as str)
            competition_id = f.get("CompetitionId")
            competition = f.get("Competition")

            items.append({
                "id": fixture_id,
                "homeTeam": home_name,
                "awayTeam": away_name,
                "startTime": start_time,
                "status": status,
                "competitionId": competition_id,
                "competition": competition,
            })

    return {"data": items}
