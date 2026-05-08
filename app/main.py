import os
from http.server import HTTPServer
from app.core.router import Handler
import app.services.db as db
from app.services.ai import ai_manager
from app.utils.logger import logger

def start_server():
    db.init_db()
    logger.info("="*50)
    logger.info("AskVES Multi-AI Mode (High Speed)")
    logger.info("="*50)
    logger.info(f"Available providers: {list(ai_manager.providers.keys())}")
    logger.info("Priority: Groq-8B (Multi-Key) → Gemini-Flash")
    logger.info("="*50)
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"AskVES running at http://localhost:{port}")
    HTTPServer(("", port), Handler).serve_forever()

if __name__ == "__main__":
    start_server()
