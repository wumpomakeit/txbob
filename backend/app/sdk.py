"""Thin wrapper that provides a lazily-initialised singleton TxLINE client
with automatic JWT renewal on 401 responses."""

from __future__ import annotations

import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

# ── Load .env before importing txbob, so TxLINE can read credentials ──────────
# Search: backend/.env → repo-root/.env → dotenv auto-discovery
_root = Path(__file__).resolve().parent.parent.parent  # .../txbob
for env_path in (Path(__file__).resolve().parent.parent / ".env", _root / ".env"):
    if env_path.exists():
        load_dotenv(env_path)
        break
else:
    load_dotenv()  # fallback: walk up from CWD

from txbob import TxLINE  # noqa: E402  (import after env load)

logger = logging.getLogger(__name__)

_client: TxLINE | None = None
_session_renewed = False

_GUEST_SESSION_PATH = "/auth/guest/start"


def _renew_jwt() -> bool:
    """Call the TxLINE guest-session endpoint and update the client's JWT.

    Returns True on success, False on failure.
    """
    global _client
    if _client is None:
        return False

    api_url = os.getenv("TXLINE_API_URL", "")
    # Derive the auth base from the API URL: strip trailing /api
    auth_base = api_url.rstrip("/").replace("/api", "")
    session_url = f"{auth_base}{_GUEST_SESSION_PATH}"

    try:
        logger.info("Renewing TxLINE guest JWT via %s", session_url)
        resp = requests.post(session_url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            new_jwt = data.get("token") or data.get("jwt") or ""
            if new_jwt:
                _client.jwt = new_jwt
                _client.headers["Authorization"] = f"Bearer {new_jwt}"
                logger.info("JWT renewed successfully")
                return True
        logger.warning("JWT renewal returned HTTP %d", resp.status_code)
    except Exception:
        logger.exception("JWT renewal failed")
    return False


def _with_retry(request_fn, max_retries: int = 1):
    """Call *request_fn* once; if it returns a 401, renew JWT and retry."""
    result = request_fn()
    # Check if the result is a requests.Response with status 401
    if isinstance(result, requests.Response) and result.status_code == 401:
        if _renew_jwt():
            return request_fn()
    return result


class ResilientTxLINE(TxLINE):
    """TxLINE subclass that auto-renews the guest JWT on 401."""

    def _get(self, path: str, **kwargs):
        url = f"{self.base_url}{path}"
        resp = requests.get(url, headers=self.headers, **kwargs)
        if resp.status_code == 401 and _renew_jwt():
            resp = requests.get(url, headers=self.headers, **kwargs)
        return resp

    def get_fixtures(self, competition_id=None):
        url = f"/fixtures/snapshot"
        if competition_id:
            url += f"?competitionId={competition_id}"
        resp = self._get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_odds(self, fixture_id):
        url = f"/odds/snapshot/{fixture_id}"
        resp = self._get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_scores(self, fixture_id):
        url = f"/scores/snapshot/{fixture_id}"
        resp = self._get(url, timeout=30)
        resp.raise_for_status()
        return resp.json()


def get_client() -> ResilientTxLINE:
    """Return a thread-safe singleton ResilientTxLINE instance.

    The client reads its credentials from environment variables
    (TXLINE_API_URL, TXLINE_JWT, TXLINE_API_TOKEN) which are loaded on import.
    Automatically renews the guest JWT on 401 responses.
    """
    global _client
    if _client is None:
        _client = ResilientTxLINE()
    return _client
