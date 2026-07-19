from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str


# ---------- Fixtures ----------

class FixtureTeam(BaseModel):
    id: int
    name: str


class FixtureItem(BaseModel):
    id: int
    homeTeam: Optional[FixtureTeam] = None
    awayTeam: Optional[FixtureTeam] = None
    startTime: Optional[str] = None
    status: Optional[str] = None
    competitionId: Optional[int] = None
    competition: Optional[str] = None


class FixturesResponse(BaseModel):
    """Top-level wrapper returned by GET /api/fixtures."""
    data: list[FixtureItem] = []


# ---------- Odds ----------

class OddOption(BaseModel):
    name: Optional[str] = None
    odds: Optional[float] = None
    probability: Optional[str] = None


class OddsMarket(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    period: Optional[str] = None
    line: Optional[str] = None
    inRunning: Optional[bool] = None
    selections: list[OddOption] = []


class OddsSnapshot(BaseModel):
    fixtureId: int
    markets: list[OddsMarket] = []


# ---------- Matches ----------

class MatchItem(BaseModel):
    id: int
    homeTeam: Optional[str] = None
    awayTeam: Optional[str] = None
    startTime: Optional[str] = None
    status: Optional[str] = None
    competitionId: Optional[int] = None
    competition: Optional[str] = None


class MatchesResponse(BaseModel):
    data: list[MatchItem] = []


# ---------- Predictions ----------

class PredictionCreate(BaseModel):
    """Request body for creating a new prediction."""
    wallet: str = ""
    fixture_id: int
    match_name: str = ""
    market_type: str = ""
    market_label: str = ""
    selection: str = ""
    question: str = ""
    odds: float = 0.0
    amount: float = 0.0


class PredictionResponse(BaseModel):
    """Response for a single prediction."""
    id: int
    wallet: str
    fixture_id: int
    match_name: str
    market_type: str
    market_label: str
    selection: str
    question: str
    odds: float
    amount: float
    status: str
    result: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None


class PredictionStatusResponse(BaseModel):
    """Lightweight status check response."""
    id: int
    fixture_id: int
    selection: str
    status: str
    result: Optional[str] = None
