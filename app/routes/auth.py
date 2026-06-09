from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
import os
from app.utils.logger import logger

router = APIRouter()


def get_supabase_client():
    """Return the Supabase client (already initialized in db.py)."""
    import app.services.db as db
    return db.supabase


async def get_current_user(authorization: str = Header(default="")):
    """
    Dependency: validates the Supabase JWT from the Authorization header.
    Usage: add `user=Depends(get_current_user)` to any protected route.
    """
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Auth service unavailable (Supabase not configured).")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token.")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return user_response.user
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Token validation failed.")


@router.get("/api/me")
async def get_me(user=Depends(get_current_user)):
    """Return the authenticated user's basic profile."""
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.user_metadata.get("full_name", user.email.split("@")[0]),
        "picture": user.user_metadata.get("avatar_url", ""),
    }
