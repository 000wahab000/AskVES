"""Starts the threaded HTTP server and loads campus data."""

import os
from http.server import ThreadingHTTPServer

from app.core.router import Handler
import app.services.db as db
from app.services.ai import ai_manager
from app.core.intents import warm_up


def start_server():
    """Bind to PORT (or 8000), load DB/synonyms, serve forever."""
    db.init_db()
    warm_up()

    print("=" * 50)
    print("AskVES Multi-AI Mode (High Speed)")
    print("=" * 50)
    print(f"Available providers: {list(ai_manager.providers.keys())}")
    print("Priority: Groq-8B (Multi-Key) → Gemini-Flash")
    print("=" * 50)

    port = int(os.environ.get("PORT", 8000))
    print(f"AskVES running at http://localhost:{port}")

    ThreadingHTTPServer(("", port), Handler).serve_forever()


if __name__ == "__main__":
    start_server()
