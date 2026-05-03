"""Cap prompt payload size so latency does not grow with DB/community size."""

import json
import os
import re


def clamp_json_text(s: str, max_chars: int) -> str:
    """Truncate a JSON string with a stable suffix."""
    if max_chars <= 0 or len(s) <= max_chars:
        return s
    head = max(max_chars - 16, 0)
    return s[:head] + "...[truncated]"


def dump_compact_limited(obj, max_chars: int) -> str:
    """Compact JSON then clamp to max_chars."""
    return clamp_json_text(json.dumps(obj, separators=(',', ':')), max_chars)


def _community_broad_intent(q_lower: str) -> bool:
    """True when the user is likely asking about student posts / community."""
    keys = (
        "community", "discuss", "discussion", "post", "board",
        "contribute", "crowdsource", "student post",
    )
    return any(k in q_lower for k in keys)


def select_community_facts_for_chat(facts, question_lower: str):
    """Return recent + (optionally) keyword-scored facts, kept under char budget."""
    if not facts:
        return []

    broad = _community_broad_intent(question_lower)
    max_items = int(os.getenv("COMMUNITY_CHAT_MAX_FACTS", "36" if broad else "10"))
    max_chars = int(os.getenv("COMMUNITY_CHAT_MAX_JSON_CHARS", "12000" if broad else "4200"))

    words = set(re.findall(r"[a-z0-9']{3,}", question_lower))
    chosen = []
    seen = set()

    if words:
        ranked = []
        for f in facts:
            blob = f"{f.get('info', '')} {f.get('name', '')}".lower()
            score = sum(1 for w in words if w in blob)
            ranked.append((score, f.get("timestamp", ""), id(f), f))
        ranked.sort(key=lambda x: (-x[0], x[1], x[2]))
        for score, _ts, _iid, f in ranked:
            if score <= 0:
                continue
            if id(f) in seen:
                continue
            chosen.append(f)
            seen.add(id(f))
            if len(chosen) >= max_items:
                break

    if len(chosen) < min(6, max_items):
        for f in reversed(facts):
            if id(f) in seen:
                continue
            chosen.append(f)
            seen.add(id(f))
            if len(chosen) >= max_items:
                break

    if not chosen:
        chosen = facts[-max_items:]

    while len(chosen) > 0:
        raw = json.dumps(chosen, separators=(',', ':'))
        if len(raw) <= max_chars:
            return chosen
        chosen = chosen[:-1]

    if facts:
        return facts[-1:]
    return []


def moderation_facts_json(facts) -> str:
    """JSON slice for /api/flag moderator prompt (never full unbounded list)."""
    if not facts:
        return "[]"

    max_items = int(os.getenv("MODERATION_MAX_FACTS", "45"))
    max_chars = int(os.getenv("MODERATION_MAX_JSON_CHARS", "10000"))
    chunk = facts[-max_items:]

    while len(chunk) > 0:
        raw = json.dumps(chunk, separators=(',', ':'))
        if len(raw) <= max_chars:
            return raw
        chunk = chunk[1:]

    if facts:
        return dump_compact_limited(facts[-1], max_chars)
    return "[]"
