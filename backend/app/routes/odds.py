from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import ErrorResponse, MatchItem, MatchesResponse, OddsSnapshot
from app.sdk import get_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["odds", "matches"])

# Status integer → label mapping (upstream uses integers)
_STATUS_MAP: dict[int, str] = {
    0: "NotStarted",
    1: "Live",
    2: "Finished",
    3: "Postponed",
    4: "Cancelled",
}


def _to_str(value: Any) -> str | None:
    """Convert any upstream value to a string or None."""
    if value is None:
        return None
    return str(value)


def _status_label(value: Any) -> str:
    """Map an upstream status value to a human-readable label."""
    if isinstance(value, int):
        return _STATUS_MAP.get(value, f"Unknown({value})")
    if isinstance(value, str) and value.isdigit():
        return _STATUS_MAP.get(int(value), f"Unknown({value})")
    return str(value) if value else "NotStarted"


# ── Odds ──────────────────────────────────────────────────────────────────────

# Map TxLINE SuperOddsType to friendly market names
_ODDS_TYPE_LABELS: dict[str, str] = {
    "1X2_PARTICIPANT_RESULT": "1X2 Full Time",
    "OVERUNDER": "Over/Under Goals",
    "OVERUNDER_PARTICIPANT_GOALS": "Over/Under Goals",
    "ASIAN_HANDICAP": "Asian Handicap",
    "ASIANHANDICAP_PARTICIPANT_GOALS": "Asian Handicap",
    "BTTS": "Both Teams to Score",
    "CORRECT_SCORE": "Correct Score",
    "FIRST_GOAL_SCORER": "First Goal Scorer",
    "LAST_GOAL_SCORER": "Last Goal Scorer",
    "ANYTIME_GOAL_SCORER": "Anytime Goal Scorer",
    "OVERUNDER_CARDS": "Over/Under Cards",
    "OVERUNDER_CORNERS": "Over/Under Corners",
    "MATCH_RESULT_BOTH_HALVES": "HT/FT",
}

# Map generic PriceName values to more descriptive labels
_PRICE_NAME_LABELS: dict[str, str] = {
    "part1": "Home",
    "part2": "Away",
    "draw": "Draw",
    "over": "Over",
    "under": "Under",
    "yes": "Yes",
    "no": "No",
}

def _price_to_decimal(raw_price: Any) -> float | None:
    """TxLINE prices are integers, divide by 1000 to get decimal odds."""
    try:
        return float(int(raw_price)) / 1000.0
    except (ValueError, TypeError):
        return None

def _friendly_market_name(raw: dict[str, Any]) -> str:
    """Build a human-readable market name from SuperOddsType + MarketParameters."""
    odds_type = raw.get("SuperOddsType") or "Market"
    label = _ODDS_TYPE_LABELS.get(odds_type, odds_type)

    params = raw.get("MarketParameters")
    period = raw.get("MarketPeriod")

    parts: list[str] = [label]
    if params and not params.startswith("line="):
        parts.append(params)
    if period:
        parts.append(f"({period})")

    return " — ".join(parts)

def _friendly_selection_name(name: str) -> str:
    """Human-readable selection name."""
    return _PRICE_NAME_LABELS.get(name, name.capitalize()) if name else "—"

@router.get(
    "/odds/{fixture_id}",
    response_model=OddsSnapshot,
    responses={502: {"model": ErrorResponse}},
    summary="Get odds for a fixture",
    description="Returns the latest odds snapshot for the given fixture ID.",
)
async def get_odds(fixture_id: int) -> dict[str, Any]:
    client = get_client()
    try:
        raw = client.get_odds(fixture_id)
    except Exception as exc:
        logger.exception("Failed to fetch odds for fixture %d", fixture_id)
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}")

    # TxLINE returns a list of market objects with:
    #   SuperOddsType, MarketParameters, MarketPeriod, PriceNames, Prices, Pct
    raw_list: list[dict[str, Any]]
    if isinstance(raw, list):
        raw_list = raw
    elif isinstance(raw, dict):
        raw_list = raw.get("markets", raw.get("data", [])) if isinstance(raw.get("markets", raw.get("data")), list) else []
    else:
        raw_list = []

    markets: list[dict[str, Any]] = []
    for row in raw_list:
        if not isinstance(row, dict):
            continue

        name = _friendly_market_name(row)
        price_names: list[str] = row.get("PriceNames") or []
        raw_prices: list = row.get("Prices") or []
        pcts: list[str] = row.get("Pct") or []

        selections: list[dict[str, Any]] = []
        for idx, pn in enumerate(price_names):
            price = _price_to_decimal(raw_prices[idx]) if idx < len(raw_prices) else None
            pct = pcts[idx] if idx < len(pcts) else None
            selections.append({
                "name": _friendly_selection_name(str(pn)),
                "odds": price,
                "probability": pct if pct and pct != "NA" else None,
            })

        line = row.get("MarketParameters")
        markets.append({
            "name": name,
            "type": row.get("SuperOddsType"),
            "period": row.get("MarketPeriod"),
            "line": line.replace("line=", "") if line and line.startswith("line=") else None,
            "inRunning": row.get("InRunning", False),
            "selections": selections,
        })

    return {
        "fixtureId": fixture_id,
        "markets": markets,
    }


# ── Matches ───────────────────────────────────────────────────────────────────

@router.get(
    "/matches",
    response_model=MatchesResponse,
    responses={502: {"model": ErrorResponse}},
    summary="List all matches with status",
    description="Returns all available matches across all competitions including live status and scores.",
)
async def list_matches() -> dict[str, Any]:
    client = get_client()
    try:
        raw = client.get_fixtures()  # no competition_id → return all
    except Exception as exc:
        logger.exception("Failed to fetch matches from upstream")
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}")

    fixtures: list[dict[str, Any]] = []
    if isinstance(raw, list):
        fixtures = raw
    elif isinstance(raw, dict):
        fixtures = raw.get("data", raw.get("fixtures", []) or [])

    items: list[MatchItem] = []
    for f in fixtures:
        if isinstance(f, dict):
            fixture_id = f.get("FixtureId", f.get("fixtureId", f.get("id", 0)))
            p1 = f.get("Participant1") or {}
            p2 = f.get("Participant2") or {}

            home_name = (
                p1.get("Name") if isinstance(p1, dict)
                else (p1 if isinstance(p1, str) else None)
            )
            away_name = (
                p2.get("Name") if isinstance(p2, dict)
                else (p2 if isinstance(p2, str) else None)
            )

            # Normalise startTime to string (upstream sends epoch millis as int)
            raw_start = f.get("StartTime", f.get("startTime", f.get("start_time")))
            start_time = _to_str(raw_start)

            # Normalise status to string label (upstream sends integer codes)
            raw_status = f.get("GameState", f.get("status"))
            status = _status_label(raw_status)

            # Competition info
            competition_id = f.get("CompetitionId")
            competition = f.get("Competition")

            items.append(
                MatchItem(
                    id=fixture_id,
                    homeTeam=home_name,
                    awayTeam=away_name,
                    startTime=start_time,
                    status=status,
                    competitionId=competition_id,
                    competition=competition,
                )
            )

    return {"data": [item.model_dump() for item in items]}
