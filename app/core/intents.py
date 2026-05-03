"""Build retrieval context from campus data and call the AI."""

import json
import os
import re
import time
import traceback

import app.services.db as db
from app.core.state import record_query
from app.services.ai import ai_manager
from app.utils.helpers import get_current_slot
from app.utils.prompt_limits import clamp_json_text, select_community_facts_for_chat

SYNONYM_MAP = None


def init_synonyms():
    """Build word-boundary triggers from static groups + timetable teachers/subjects."""
    raw_map = {
        "xerox": ["printer", "photocopy", "print", "printout"],
        "food": ["canteen", "lunch", "breakfast", "snack", "eat", "hungry", "menu", "khanna"],
        "teacher": ["professor", "faculty", "timetable", "sir", "ma'am", "teach", "padane wale"],
    }

    for code, details in db.timetable_data.get("teachers", {}).items():
        full_name = details.get("name", "")
        subject = details.get("subject", "")

        clean_parts = [
            p.lower()
            for p in full_name.replace(".", "").split()
            if p.lower() not in ["mr", "ms", "mrs", "dr"]
        ]

        ignore_words = {
            "engineering", "fundamentals", "basic", "and", "of",
            "course", "universal", "human", "i", "ii",
        }

        subject_parts = [
            s.lower().strip(',.')
            for s in subject.split()
            if s.lower().strip(',.') not in ignore_words and len(s) > 2
        ]

        triggers = [code.lower()] + clean_parts + subject_parts
        expanded_info = [full_name, code, subject]

        for trigger in triggers:
            if not trigger or len(trigger) < 2:
                continue
            raw_map.setdefault(trigger, [])
            for info in expanded_info:
                if info and info not in raw_map[trigger]:
                    raw_map[trigger].append(info)

    compiled_map = {}
    for key, synonyms in raw_map.items():
        compiled_map[re.compile(rf'\b{re.escape(key)}\b')] = synonyms

    return compiled_map


def expand_query(question):
    """Append synonym hints when triggers match."""
    global SYNONYM_MAP
    if SYNONYM_MAP is None:
        SYNONYM_MAP = init_synonyms()

    lower_q = question.lower()
    expanded_terms = set()

    for pattern, synonyms in SYNONYM_MAP.items():
        if pattern.search(lower_q):
            expanded_terms.update(synonyms)

    max_hints = int(os.getenv("MAX_SYNONYM_HINT_TERMS", "36"))
    if len(expanded_terms) > max_hints:
        expanded_terms = set(sorted(expanded_terms)[:max_hints])

    if expanded_terms:
        return (
            question
            + "\n[System Note: Consider these hidden keywords for retrieval: "
            + ", ".join(expanded_terms)
            + "]"
        )
    return question


def warm_up():
    """Pre-build synonym map after DB load."""
    global SYNONYM_MAP
    SYNONYM_MAP = init_synonyms()
    print(f"✓ Synonym map pre-built ({len(SYNONYM_MAP)} patterns)")


JSON_CACHE = {}


def get_json_str(data_dict, name):
    """Memoized compact JSON string; invalidates on update_data/version."""
    source_name = name.split('_')[0]
    version = db._data_versions.get(source_name, 0)
    cache_key = (id(data_dict), version)
    if JSON_CACHE.get(name, {}).get('key') != cache_key:
        JSON_CACHE[name] = {
            'key': cache_key,
            'str': json.dumps(data_dict, separators=(',', ':'))
        }
    return JSON_CACHE[name]['str']


def ask(question):
    """Resolve question with relevant campus JSON context and LLM."""
    expanded_question = expand_query(question)

    day, slot = get_current_slot()

    q_lower = expanded_question.lower()

    cap_canteen = int(os.getenv("JSON_CAP_CANTEEN", "14000"))
    cap_tt = int(os.getenv("JSON_CAP_TIMETABLE_DAY", "22000"))
    cap_xerox = int(os.getenv("JSON_CAP_XEROX", "10000"))
    cap_vending = int(os.getenv("JSON_CAP_VENDING", "10000"))
    cap_events = int(os.getenv("JSON_CAP_EVENTS", "12000"))

    context_parts = []

    if any(w in q_lower for w in [
        'canteen', 'food', 'eat', 'lunch', 'menu', 'cheap', 'price', 'meal', 'snack', 'breakfast',
    ]):
        raw = get_json_str(db.canteen_data, 'canteen')
        context_parts.append(f"CANTEEN:{clamp_json_text(raw, cap_canteen)}")

    if any(w in q_lower for w in [
        'teacher', 'professor', 'sir', 'ma\'am', 'maam', 'faculty', 'timetable',
        'class', 'room', 'slot', 'lecture', 'mj', 'mugdha',
    ]):
        tt_today = db.timetable_data.get('timetable', {}).get(day, {})
        raw = get_json_str(tt_today, 'timetable_' + day)
        context_parts.append(f"TIMETABLE_TODAY:{clamp_json_text(raw, cap_tt)}")

    if any(w in q_lower for w in ['xerox', 'print', 'photocopy', 'copy', 'printout']):
        raw = get_json_str(db.xerox_data, 'xerox')
        context_parts.append(f"XEROX:{clamp_json_text(raw, cap_xerox)}")

    if any(w in q_lower for w in ['vend', 'vending', 'machine', 'chips', 'cold drink', 'snack', 'drinks']):
        raw = get_json_str(db.vending_data, 'vending')
        context_parts.append(f"VENDING:{clamp_json_text(raw, cap_vending)}")

    if any(w in q_lower for w in ['event', 'workshop', 'seminar', 'fest', 'competition', 'happening', 'week']):
        raw = get_json_str(db.events_data, 'events')
        context_parts.append(f"EVENTS:{clamp_json_text(raw, cap_events)}")

    facts = db.community_data.get('facts')
    if facts:
        subset = select_community_facts_for_chat(facts, q_lower)
        if subset:
            context_parts.append(
                "COMMUNITY FACTS:" + json.dumps(subset, separators=(',', ':'))
            )

    if not context_parts:
        context_parts.append(
            "You can answer general campus questions. If info not found, suggest admin office or notice board."
        )

    context = "\n".join(context_parts)

    system_prompt = f"""You are AskVES, a helpful AI assistant for VESIT college students (NOT Affiliated with VESIT). Be concise.
Today is {day}, current slot: {slot} (None = break or outside hours).
{context}
For teacher queries: find their code, check today's timetable for current slot, return room and division.
If info not found: suggest admin office or notice board."""

    current_message = {"role": "user", "content": expanded_question}
    messages = [{"role": "system", "content": system_prompt}, current_message]

    try:
        start_time = time.time()
        answer, provider = ai_manager.generate(messages)
        record_query(provider, time.time() - start_time)

        print(f"✓ Response generated by: {provider}")
        return answer

    except Exception as e:
        print(f"✗ All AI providers failed: {str(e)}")
        print(f"✗ Traceback: {traceback.format_exc()}")
        print(f"✗ Available providers at time of error: {list(ai_manager.providers.keys())}")
        return "Sorry, I'm having trouble right now. Try again in a minute! 🙏"
