"""Autonomous resolver agent — checks finished fixtures and resolves predictions.

Called by scheduler every 60 seconds.
"""

from __future__ import annotations

import logging
from typing import Any

from app.database import get_connection
from app.sdk import get_client

logger = logging.getLogger(__name__)

# ── mappings ──────────────────────────────────────────────────────────────────

# GameState int → label (matches routes/fixtures.py)
_GAMESTATE_FINISHED = 2   # Finished per TxLINE Devnet

# Market types we can resolve automatically
_RESOLVABLE = frozenset({
    "Match Winner",
    "Over/Under 2.5",
    "Both Teams to Score",
})

# Selection name → which side it maps to
_HOME_SET = frozenset({"Home", "home", "part1", "1"})
_AWAY_SET = frozenset({"Away", "away", "part2", "2"})
_DRAW_SET = frozenset({"Draw", "draw", "X", "x"})
_OVER_SET = frozenset({"Over", "over", "o"})
_UNDER_SET = frozenset({"Under", "under", "u"})
_YES_SET = frozenset({"Yes", "yes", "y", "true"})
_NO_SET = frozenset({"No", "no", "n", "false"})


def resolve_markets() -> None:
    """Main entry point — fetch finished fixtures, resolve pending predictions."""
    client = get_client()

    # 1. Fetch all fixtures
    try:
        raw = client.get_fixtures()
    except Exception as exc:
        logger.warning("Resolver: cannot fetch fixtures — %s", exc)
        return

    fixtures: list[dict[str, Any]] = []
    if isinstance(raw, list):
        fixtures = raw
    elif isinstance(raw, dict):
        fixtures = raw.get("data", raw.get("fixtures", []) or [])

    # 2. Filter to finished matches only
    finished = _filter_finished(fixtures)
    if not finished:
        logger.debug("Resolver: no finished fixtures to process")
        return

    logger.info("Resolver: processing %d finished fixture(s)", len(finished))

    # 3. For each finished fixture, resolve pending predictions
    conn = get_connection()
    try:
        for f in finished:
            fixture_id = _fixture_id(f)
            if not fixture_id:
                continue

            # Fetch scores
            scores = _fetch_scores(client, fixture_id)
            if scores is None:
                logger.debug("Resolver: no scores for fixture %s — skipping", fixture_id)
                continue

            home_score, away_score = _extract_scores(f, scores)
            logger.info(
                "Resolver: fixture %s result — %s %d - %d %s",
                fixture_id,
                f.get("Participant1", f.get("homeTeam", "?")),
                home_score,
                away_score,
                f.get("Participant2", f.get("awayTeam", "?")),
            )

            # Find pending predictions for this fixture
            rows = conn.execute(
                "SELECT * FROM predictions WHERE fixture_id = ? AND status = 'pending'",
                (fixture_id,),
            ).fetchall()

            if not rows:
                continue

            logger.info(
                "Resolver: fixture %s has %d pending prediction(s) to resolve",
                fixture_id, len(rows),
            )

            for row in rows:
                result = _resolve_prediction(dict(row), home_score, away_score)
                if result["action"] == "skip":
                    logger.debug(
                        "Resolver: pred #%s (%s / %s) — not resolvable",
                        row["id"], row["market_type"], row["selection"],
                    )
                    continue

                conn.execute(
                    "UPDATE predictions SET status = ?, result = ?, resolved_at = datetime('now') WHERE id = ?",
                    (result["status"], result["detail"], row["id"]),
                )
                conn.commit()
                logger.info(
                    "Resolver: pred #%s RESOLVED → %s (%s)",
                    row["id"], result["status"].upper(), result["detail"],
                )

                # Also mark the market as resolved
                conn.execute(
                    "INSERT OR IGNORE INTO markets (fixture_id, market_type, status, resolved_at, winner) "
                    "VALUES (?, ?, 'resolved', datetime('now'), ?)",
                    (fixture_id, row["market_type"], result["status"]),
                )
                conn.commit()
    finally:
        conn.close()


def _filter_finished(fixtures: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return only fixtures with GameState == 2 (Finished)."""
    out: list[dict[str, Any]] = []
    for f in fixtures:
        if not isinstance(f, dict):
            continue
        gs = f.get("GameState", f.get("status", f.get("gameState")))
        try:
            if int(gs) == _GAMESTATE_FINISHED:
                out.append(f)
        except (ValueError, TypeError):
            pass
    return out


def _fixture_id(f: dict[str, Any]) -> int | None:
    """Extract fixture ID from various possible keys."""
    fid = f.get("FixtureId", f.get("fixtureId", f.get("id")))
    try:
        return int(fid)
    except (ValueError, TypeError):
        return None


def _fetch_scores(client, fixture_id: int) -> dict[str, Any] | None:
    """Fetch scores snapshot; return None on error or empty."""
    try:
        raw = client.get_scores(fixture_id)
    except Exception as exc:
        logger.debug("Resolver: scores request failed for %s — %s", fixture_id, exc)
        return None

    if isinstance(raw, dict):
        # Check if empty / no data
        if not raw or raw.get("FixtureId") is None and not raw.get("LiveGame") and not raw.get("FullGames"):
            # Could be that scores endpoint returns something minimal for finished
            # Try to extract scores from whatever structure is there
            pass
        return raw
    return None


def _extract_scores(fixture: dict[str, Any], scores: dict[str, Any]) -> tuple[int, int]:
    """Extract (home_score, away_score) from scores response or fixture data.

    Tries multiple possible data shapes:
    1. LiveGame.Scoreboard.ScoreInfo[].Score
    2. FullGames[n].Scoreboard.ScoreInfo[].Score
    3. fixture fields: Score1/Score2, HomeScore/AwayScore
    4. scores top-level: homeScore/awayScore, score1/score2
    """

    def _try_scoreboard(sb: dict[str, Any]) -> tuple[int, int] | None:
        si = sb.get("ScoreInfo") or []
        if isinstance(si, list) and len(si) >= 2:
            s0 = _int_score(si[0])
            s1 = _int_score(si[1])
            if s0 is not None and s1 is not None:
                return s0, s1
        return None

    # Path A: LiveGame
    live = scores.get("LiveGame")
    if isinstance(live, dict):
        sb = live.get("Scoreboard")
        if isinstance(sb, dict):
            r = _try_scoreboard(sb)
            if r:
                return r

    # Path B: FullGames (finished matches)
    full = scores.get("FullGames")
    if isinstance(full, list):
        # Use the last game (final result)
        for game in reversed(full):
            if isinstance(game, dict):
                sb = game.get("Scoreboard")
                if isinstance(sb, dict):
                    r = _try_scoreboard(sb)
                    if r:
                        return r

    # Path C: Top-level score fields in scores response
    for hk, ak in (
        ("homeScore", "awayScore"),
        ("HomeScore", "AwayScore"),
        ("score1", "score2"),
        ("Score1", "Score2"),
        ("home_score", "away_score"),
    ):
        hs = scores.get(hk)
        aw = scores.get(ak)
        if hs is not None and aw is not None:
            try:
                return int(hs), int(aw)
            except (ValueError, TypeError):
                pass

    # Path D: Fixture object itself may carry final scores
    for hk, ak in (
        ("Score1", "Score2"),
        ("HomeScore", "AwayScore"),
        ("homeScore", "awayScore"),
        ("score1", "score2"),
    ):
        hs = fixture.get(hk)
        aw = fixture.get(ak)
        if hs is not None and aw is not None:
            try:
                return int(hs), int(aw)
            except (ValueError, TypeError):
                pass

    # Fallback: 0-0 (shouldn't happen for finished matches with scores)
    logger.warning(
        "Resolver: could not extract scores for fixture %s — assuming 0-0",
        _fixture_id(fixture),
    )
    return 0, 0


def _int_score(item: Any) -> int | None:
    """Extract integer score from a ScoreInfo dict or raw value."""
    if isinstance(item, dict):
        s = item.get("Score", item.get("score", item.get("Value")))
        try:
            return int(s)
        except (ValueError, TypeError):
            return None
    try:
        return int(item)
    except (ValueError, TypeError):
        return None


def _resolve_prediction(
    pred: dict[str, Any], home_score: int, away_score: int
) -> dict[str, Any]:
    """Determine whether a prediction won or lost.

    Returns {"action": "skip"} for markets we cannot auto-resolve.
    Returns {"status": "won"|"lost", "detail": "..."} for resolved markets.
    """
    mt = (pred.get("market_type") or "").strip()
    sel = (pred.get("selection") or "").strip()

    if mt not in _RESOLVABLE:
        # Micro-markets (goal_scorer, yellow_card, penalty, added_time)
        # cannot be resolved from scores snapshot — leave pending
        return {"action": "skip"}

    total = home_score + away_score

    # ── Match Winner (1X2) ──
    if mt == "Match Winner":
        if sel in _HOME_SET:
            if home_score > away_score:
                return {"status": "won", "detail": f"{home_score}-{away_score} (Home wins)"}
            return {"status": "lost", "detail": f"{home_score}-{away_score} (Home did not win)"}

        if sel in _AWAY_SET:
            if away_score > home_score:
                return {"status": "won", "detail": f"{home_score}-{away_score} (Away wins)"}
            return {"status": "lost", "detail": f"{home_score}-{away_score} (Away did not win)"}

        if sel in _DRAW_SET:
            if home_score == away_score:
                return {"status": "won", "detail": f"{home_score}-{away_score} (Draw)"}
            return {"status": "lost", "detail": f"{home_score}-{away_score} (Not a draw)"}

        # Unknown selection → skip
        return {"action": "skip"}

    # ── Over/Under 2.5 ──
    if mt == "Over/Under 2.5":
        if sel in _OVER_SET:
            if total > 2.5:
                return {"status": "won", "detail": f"Total {total} goals → Over 2.5"}
            return {"status": "lost", "detail": f"Total {total} goals → Under 2.5"}

        if sel in _UNDER_SET:
            if total <= 2.5:
                return {"status": "won", "detail": f"Total {total} goals → Under 2.5"}
            return {"status": "lost", "detail": f"Total {total} goals → Over 2.5"}

        return {"action": "skip"}

    # ── Both Teams to Score ──
    if mt == "Both Teams to Score":
        both_scored = home_score > 0 and away_score > 0
        if sel in _YES_SET:
            if both_scored:
                return {"status": "won", "detail": f"{home_score}-{away_score} (Both scored)"}
            return {"status": "lost", "detail": f"{home_score}-{away_score} (Not both scored)"}

        if sel in _NO_SET:
            if not both_scored:
                return {"status": "won", "detail": f"{home_score}-{away_score} (Not both scored)"}
            return {"status": "lost", "detail": f"{home_score}-{away_score} (Both scored)"}

        return {"action": "skip"}

    return {"action": "skip"}
