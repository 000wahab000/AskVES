import os
from http.server import HTTPServer
from app.core.router import Handler
import app.services.db as db
from app.services.ai import ai_manager

def start_server():
    db.init_db()
    print("="*50)
    print("AskVES Multi-AI Mode (High Speed)")
    print("="*50)
    print(f"Available providers: {list(ai_manager.providers.keys())}")
    print("Priority: Groq-8B (Multi-Key) → Gemini-Flash")
    print("="*50)
    port = int(os.environ.get("PORT", 8000))
    print(f"AskVES running at http://localhost:{port}")
    HTTPServer(("", port), Handler).serve_forever()

if __name__ == "__main__":
    start_server()
