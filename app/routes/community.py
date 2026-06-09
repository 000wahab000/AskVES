from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
import app.services.db as db
from app.services.ai import ai_manager
from app.routes.auth import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/api")


class PostBody(BaseModel):
    info: str


class FlagBody(BaseModel):
    message: str


class UpvoteBody(BaseModel):
    id: str


@router.get("/community")
async def get_community():
    """Return all community posts/facts."""
    return db.community_data.get("facts", [])


@router.post("/discuss")
async def post_discussion(body: PostBody, user=Depends(get_current_user)):
    """Create a new community post. Requires authentication."""
    info = body.info.strip()
    if len(info) < 5:
        raise HTTPException(status_code=400, detail="Please write something meaningful!")

    new_post = {
        "id": str(uuid.uuid4())[:8],
        "email": user.email,
        "name": user.user_metadata.get("full_name", user.email.split("@")[0]),
        "picture": user.user_metadata.get("avatar_url", ""),
        "info": info,
        "flags": 0,
        "upvotes": 0,
        "timestamp": datetime.now().isoformat(),
    }

    if "facts" not in db.community_data:
        db.community_data["facts"] = []
    db.community_data["facts"].append(new_post)

    _persist_community()
    return {"success": True, "post": new_post}


@router.post("/flag")
async def flag_post(body: FlagBody):
    """Flag an AI response and auto-moderate using AI."""
    chat_msg = body.message
    if db.community_data.get("facts"):
        mod_prompt = f"""You are an auto-moderator for AskVES.
A user flagged the following bot message as FAKE or INCORRECT:
"{chat_msg}"
Here are the crowdsourced facts we have:
{json.dumps(db.community_data['facts'])}
Does any specific community fact seem directly responsible for generating that flagged message?
If yes, reply with ONLY the 'id' string of that fact (e.g. 5a1b3c99). If none seem relevant, reply with exactly NONE."""

        try:
            ans, _ = ai_manager.generate([{"role": "system", "content": mod_prompt}])
            ans = ans.strip()
            for fact in db.community_data["facts"]:
                if fact["id"] in ans:
                    fact["flags"] = fact.get("flags", 0) + 1
                    if fact["flags"] >= 2:
                        db.community_data["facts"].remove(fact)
                        logger.warning(f"🚩 Auto-Deleted fact {fact['id']} due to 2+ flags!")
                    else:
                        logger.warning(f"🚩 Fact {fact['id']} flagged. Total flags: {fact['flags']}")
                    _persist_community()
                    break
        except Exception as e:
            logger.error(f"Moderator AI failed: {e}")

    return {"success": True}


@router.post("/upvote")
async def upvote_post(body: UpvoteBody):
    """Increment the upvote count for a community post."""
    for fact in db.community_data.get("facts", []):
        if fact["id"] == body.id:
            fact["upvotes"] = fact.get("upvotes", 0) + 1
            break
    _persist_community()
    return {"success": True}


# ── helpers ────────────────────────────────────────────────────────────────


def _persist_community():
    """Save community data to Supabase or local JSON file."""
    try:
        if db.supabase:
            db.supabase.table("campus_data").upsert(
                {"id": "community", "data": db.community_data}
            ).execute()
        else:
            with open("data/community.json", "w") as f:
                json.dump(db.community_data, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to persist community data: {e}")
