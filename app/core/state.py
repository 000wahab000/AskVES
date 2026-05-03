"""In-memory server state: sessions, metrics."""

import threading
import time

SESSIONS = {}
SESSION_TTL = 60 * 60 * 24 * 7

server_start_time = time.time()

metrics = {
    "total_queries": 0,
    "total_response_time": 0,
    "provider_usage": {}
}

_metrics_lock = threading.Lock()


def get_session(token):
    """Return user dict if session exists and TTL ok; drop expired."""
    s = SESSIONS.get(token)
    if s is None:
        return None
    if time.time() - s.get('created_at', 0) > SESSION_TTL:
        SESSIONS.pop(token, None)
        return None
    return s


def record_query(provider, elapsed_seconds):
    """Atomic metrics update for concurrent requests."""
    with _metrics_lock:
        metrics["total_queries"] += 1
        metrics["total_response_time"] += elapsed_seconds
        metrics["provider_usage"][provider] = metrics["provider_usage"].get(provider, 0) + 1
