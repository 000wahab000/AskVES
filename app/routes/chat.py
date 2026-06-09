from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.core.intents import ask
from app.utils.logger import logger

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING = True
except ImportError:
    limiter = None
    RATE_LIMITING = False

router = APIRouter()


class QuestionBody(BaseModel):
    question: str


def _rate_limit(f):
    """Apply @limiter.limit only when slowapi is installed."""
    if RATE_LIMITING and limiter:
        return limiter.limit("10/minute")(f)
    return f


@router.post("/ask")
@_rate_limit
async def ask_question(request: Request, body: QuestionBody):
    """Main AI chat endpoint — rate limited to 10 requests/minute per IP."""
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        answer = ask(question)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service error.")


@router.get("/health")
async def health():
    """Health check — used by uptime monitors and Render keep-alive pings."""
    import time
    import os
    import app.services.db as db
    from app.services.ai import ai_manager
    from app.core.state import metrics, server_start_time

    return {
        "status": "ok",
        "providers_available": list(ai_manager.providers.keys()),
        "groq_key_set": bool(os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEYS")),
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "supabase_connected": db.supabase is not None,
        "admin_password_set": bool(os.getenv("ADMIN_PASSWORD")),
        "data_loaded": {
            "canteen": bool(db.canteen_data),
            "timetable": bool(db.timetable_data),
            "events": bool(db.events_data),
            "xerox": bool(db.xerox_data),
            "vending": bool(db.vending_data),
            "community": bool(db.community_data),
        },
        "uptime_seconds": round(time.time() - server_start_time),
        "total_queries": metrics["total_queries"],
    }
