"""Background scheduler that runs the resolver agent every 60 seconds."""

from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger(__name__)

_interval_sec: float = 60.0
_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _run_loop() -> None:
    """Continuously call resolve_markets() at the configured interval."""
    # Defer import so we don't import the SDK until the loop actually starts
    # (and env is already loaded).
    from app.resolver import resolve_markets

    logger.info(
        "Resolver scheduler started — running every %.0f seconds",
        _interval_sec,
    )

    while not _stop_event.is_set():
        try:
            resolve_markets()
        except Exception:
            logger.exception("Resolver: unhandled error during resolve_markets()")

        # Sleep in 1-second chunks so we can stop promptly
        slept = 0.0
        while slept < _interval_sec and not _stop_event.is_set():
            time.sleep(1)
            slept += 1

    logger.info("Resolver scheduler stopped")


def start(interval_sec: float = 60.0) -> None:
    """Start the resolver background thread."""
    global _interval_sec, _thread

    if _thread is not None and _thread.is_alive():
        logger.warning("Resolver scheduler is already running")
        return

    _interval_sec = interval_sec
    _stop_event.clear()
    _thread = threading.Thread(target=_run_loop, daemon=True, name="resolver-scheduler")
    _thread.start()


def stop() -> None:
    """Signal the scheduler to stop and wait for the thread to finish."""
    if _thread is None:
        return
    logger.info("Stopping resolver scheduler...")
    _stop_event.set()
    _thread.join(timeout=10)
    logger.info("Resolver scheduler thread joined")
