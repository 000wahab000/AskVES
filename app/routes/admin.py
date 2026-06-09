from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
import os, time, json
import app.services.db as db
from app.core.state import metrics, server_start_time
from app.utils.logger import logger

router = APIRouter(prefix="/api/admin")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")


def _require_admin(authorization: str = Header(default="")):
    """Simple bearer-token check against ADMIN_PASSWORD env var."""
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin password not configured.")
    if authorization != f"Bearer {ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Unauthorized.")


@router.get("/stats", dependencies=[])
async def get_stats(authorization: str = Header(default="")):
    """Return server usage metrics (admin only)."""
    _require_admin(authorization)
    uptime = time.time() - server_start_time
    avg_time = (
        metrics["total_response_time"] / metrics["total_queries"]
        if metrics["total_queries"] > 0
        else 0
    )
    return {
        "uptime_seconds": uptime,
        "total_queries": metrics["total_queries"],
        "avg_response_time": avg_time,
        "provider_usage": metrics["provider_usage"],
    }


@router.get("/data")
async def get_data(source: str, authorization: str = Header(default="")):
    """Return campus data for a given source key (admin only)."""
    _require_admin(authorization)
    allowed = ["canteen", "timetable", "xerox", "vending", "events", "community"]
    if source not in allowed:
        raise HTTPException(status_code=400, detail=f"Unknown source '{source}'.")
    try:
        with open(f"data/{source}.json", "rb") as f:
            content = f.read()
        return json.loads(content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"data/{source}.json not found.")


class UpdateBody(BaseModel):
    data: dict


@router.post("/data")
async def update_data(source: str, body: UpdateBody, authorization: str = Header(default="")):
    """Update campus data for a given source key (admin only)."""
    _require_admin(authorization)
    allowed = ["canteen", "timetable", "xerox", "vending", "events"]
    if source not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot update source '{source}'.")

    try:
        if db.supabase:
            db.supabase.table("campus_data").upsert({"id": source, "data": body.data}).execute()
        else:
            with open(f"data/{source}.json", "w") as f:
                json.dump(body.data, f, indent=4)
        db.update_data(source, body.data)
        return {"success": True}
    except Exception as e:
        logger.error(f"Admin update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
