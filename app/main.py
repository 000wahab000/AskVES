import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, auth, community, admin, webhook
import app.services.db as db
from app.services.ai import ai_manager
from app.utils.logger import logger

# ── allowed origins ────────────────────────────────────────────────────────
# In production, set ALLOWED_ORIGINS in your .env to your Vercel domain.
# Example: ALLOWED_ORIGINS=https://askves.vercel.app,https://askves.in
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(title="AskVES API", version="1.0.0")

# ── optional rate-limiting middleware (requires slowapi) ───────────────────
try:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from app.routes.chat import limiter
    if limiter:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
except Exception:
    pass  # slowapi not installed or error — rate limiting simply disabled

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(admin.router)
app.include_router(webhook.router)


@app.on_event("startup")
async def startup_event():
    db.init_db()
    logger.info("=" * 50)
    logger.info("AskVES — FastAPI Mode")
    logger.info("=" * 50)
    logger.info(f"Available AI providers: {list(ai_manager.providers.keys())}")
    logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")
    logger.info("=" * 50)
