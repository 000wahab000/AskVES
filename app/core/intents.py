# intents.py - the brain of the project
#
# this file decides what data the AI should look at before answering a students question
# it has two main parts:
#   part 1 - the synonym system: if a student says "khanna" it knows to look at canteen data
#   part 2 - the context builder: picks only the relevant data block and gives it to the AI

import re, json, time, traceback
import app.services.db as db              # all campus data lives here
from app.services.ai import ai_manager   # the AI manager that talks to groq or gemini
from app.utils.helpers import get_current_slot  # tells us what class period is happening right now
from app.core.state import metrics       # tracks how many questions were asked and how fast

# the synonym map is built once and stored here so we dont rebuild it on every question
SYNONYM_MAP = None


def init_synonyms():
    # this function builds a lookup table that maps trigger words to related terms
    # so when a student types "hungry" the AI knows to look at canteen data
    # and when a student types "mj" the AI knows to look for Mugdha Joshi in the timetable

    # step 1: start with some hard coded common groups
    # the key is the trigger word, the value is a list of related terms
    raw_map = {
        "xerox":   ["printer", "photocopy", "print", "printout"],
        "food":    ["canteen", "lunch", "breakfast", "snack", "eat", "hungry", "menu", "khanna"],
        "teacher": ["professor", "faculty", "timetable", "sir", "ma'am", "teach", "padane wale"],
    }

    # step 2: automatically add triggers for every teacher in the timetable database
    # so even if an admin adds a new teacher, the bot can find them without any code changes
    for code, details in db.timetable_data.get("teachers", {}).items():
        full_name = details.get("name", "")    # eg "Ms. Mugdha Joshi"
        subject   = details.get("subject", "")  # eg "Computer Networks"

        # clean the teachers name - remove titles like Mr Ms Dr and dots
        # so "Ms. Mugdha Joshi" becomes ["mugdha", "joshi"]
        clean_parts = [p.lower() for p in full_name.replace(".", "").split()
                       if p.lower() not in ["mr", "ms", "mrs", "dr"]]

        # words that are too generic to be useful as search triggers, we skip these
        ignore_words = {"engineering", "fundamentals", "basic", "and", "of",
                        "course", "universal", "human", "i", "ii"}

        # break down the subject name into keywords
        # so "Computer Networks" becomes ["computer", "networks"]
        # we skip short words and generic words from ignore_words
        subject_parts = [s.lower().strip(',.') for s in subject.split()
                         if s.lower().strip(',.') not in ignore_words and len(s) > 2]

        # combine the teacher code + name parts + subject words as triggers
        # eg for MJ: ["mj", "mugdha", "joshi", "computer", "networks"]
        triggers = [code.lower()] + clean_parts + subject_parts

        # what to show the AI when any of these triggers match
        # we give it the full name, the short code, and the subject
        expanded_info = [full_name, code, subject]

        # step 3: add each trigger and its info into the raw_map
        for trigger in triggers:
            if not trigger or len(trigger) < 2: continue  # skip empty or single-char triggers

            if trigger not in raw_map:
                raw_map[trigger] = []  # create a new empty list for this trigger

            for info in expanded_info:
                if info and info not in raw_map[trigger]:
                    raw_map[trigger].append(info)  # avoid duplicates

    # step 4: compile each trigger string into a regex pattern for fast searching
    # compiling once here is much better than compiling on every single question
    # the \b around the pattern means it only matches whole words
    # so "mj" wont accidentally match inside a word like "mjpeg"
    compiled_map = {}
    for key, synonyms in raw_map.items():
        compiled_map[re.compile(rf'\b{re.escape(key)}\b')] = synonyms

    return compiled_map   # returns {compiled_regex: [list of related terms]}


def expand_query(question):
    # takes the students raw question and adds hidden keyword hints to it
    # example: "where can i get khanna?" becomes the same question plus a note saying
    # "consider these hidden keywords: canteen, lunch, menu..."
    # this helps the AI understand slang and alternate words

    global SYNONYM_MAP
    if SYNONYM_MAP is None:
        SYNONYM_MAP = init_synonyms()  # build it on first call, then reuse forever

    lower_q = question.lower()
    expanded_terms = set()  # use a set so duplicates are automatically removed

    # check every trigger pattern against the question
    for pattern, synonyms in SYNONYM_MAP.items():
        if pattern.search(lower_q):
            expanded_terms.update(synonyms)  # add all related terms if this trigger matched

    if expanded_terms:
        # attach the synonym hint at the end so the AI sees it as extra context
        return question + f"\n[System Note: Consider these hidden keywords for retrieval: {', '.join(expanded_terms)}]"

    # no triggers matched, return the question as-is
    return question


def warm_up():
    # call this after db.init_db() to pre-build the synonym map using the loaded timetable data
    # without this, the map is built lazily on the very first question, which may arrive before
    # the DB data is fully in memory (eg a warmup ping from Railway right after deploy)
    global SYNONYM_MAP
    SYNONYM_MAP = init_synonyms()
    print(f"✓ Synonym map pre-built ({len(SYNONYM_MAP)} patterns)")


# JSON_CACHE stores already-serialized versions of each data dictionary
# when the same data hasnt changed, we reuse the string instead of re-serializing it every time
# this matters because json.dumps on a large timetable JSON can be slow
JSON_CACHE = {}

def get_json_str(data_dict, name):
    # converts a data dictionary to a JSON string, with caching
    # cache key = (id(data_dict), db_version)
    #   id()        changes when update_data() replaces the dict with a new object
    #   db_version  changes every time update_data() is called, catching the edge case
    #               where Python's GC frees the old dict and reuses the same memory address
    #               for a new dict (making id() look unchanged when the data actually changed)
    source_name = name.split('_')[0]   # 'timetable_MONDAY' -> 'timetable'
    version = db._data_versions.get(source_name, 0)
    cache_key = (id(data_dict), version)
    if JSON_CACHE.get(name, {}).get('key') != cache_key:
        JSON_CACHE[name] = {
            'key': cache_key,
            'str': json.dumps(data_dict, separators=(',', ':'))  # compact format, no extra spaces
        }
    return JSON_CACHE[name]['str']


def ask(question):
    # this is the main function, called whenever a student sends a question
    # it builds a context block from the relevant campus data and sends it to the AI

    # keep the original question (useful for logging if needed later)
    raw_question = question

    # add synonym hints to the question before processing
    expanded_question = expand_query(question)

    # find out what day and class period it is right now
    # this is used so the AI can answer "whos in room 301 right now" type questions
    day, slot = get_current_slot()

    q_lower = expanded_question.lower()

    # this list will hold the relevant data blocks we inject into the AI
    context_parts = []

    # check the question for food-related words and attach canteen data if found
    if any(w in q_lower for w in ['canteen', 'food', 'eat', 'lunch', 'menu', 'cheap', 'price', 'meal', 'snack', 'breakfast']):
        context_parts.append(f"CANTEEN:{get_json_str(db.canteen_data, 'canteen')}")

    # check for teacher/class related words and attach todays timetable
    if any(w in q_lower for w in ['teacher', 'professor', 'sir', 'ma\'am', 'maam', 'faculty', 'timetable', 'class', 'room', 'slot', 'lecture', 'mj', 'mugdha']):
        tt_today = db.timetable_data.get('timetable', {}).get(day, {})  # only todays schedule
        context_parts.append(f"TIMETABLE_TODAY:{get_json_str(tt_today, 'timetable_' + day)}")

    # check for printing/xerox related words
    if any(w in q_lower for w in ['xerox', 'print', 'photocopy', 'copy', 'printout']):
        context_parts.append(f"XEROX:{get_json_str(db.xerox_data, 'xerox')}")

    # check for vending machine related words
    if any(w in q_lower for w in ['vend', 'vending', 'machine', 'chips', 'cold drink', 'snack', 'drinks']):
        context_parts.append(f"VENDING:{get_json_str(db.vending_data, 'vending')}")

    # check for event related words
    if any(w in q_lower for w in ['event', 'workshop', 'seminar', 'fest', 'competition', 'happening', 'week']):
        context_parts.append(f"EVENTS:{get_json_str(db.events_data, 'events')}")

    # always include student submitted community facts if any exist
    if db.community_data.get('facts'):
        context_parts.append(f"COMMUNITY FACTS:{get_json_str(db.community_data['facts'], 'community')}")

    # if none of the keyword checks matched, give a general instruction instead
    if not context_parts:
        context_parts.append("You can answer general campus questions. If info not found, suggest admin office or notice board.")

    # join all selected data blocks into one string to give to the AI
    context = "\n".join(context_parts)

    # build the system prompt - this is the instruction the AI reads before answering
    # it tells the AI who it is, what day/slot it is, and what data it can use
    system_prompt = f"""You are AskVES, a helpful AI assistant for VESIT college students (NOT Affiliated with VESIT). Be concise.
Today is {day}, current slot: {slot} (None = break or outside hours).
{context}
For teacher queries: find their code, check today's timetable for current slot, return room and division.
If info not found: suggest admin office or notice board."""

    # format the messages the way the AI expects them
    current_message = {"role": "user", "content": expanded_question}
    messages = [{"role": "system", "content": system_prompt}, current_message]

    # send to the AI and track how long it took
    try:
        start_time = time.time()
        answer, provider = ai_manager.generate(messages)   # this is where the AI call happens

        # update the stats that show on the admin dashboard
        metrics["total_queries"] += 1
        metrics["total_response_time"] += (time.time() - start_time)
        metrics["provider_usage"][provider] = metrics["provider_usage"].get(provider, 0) + 1

        print(f"✓ Response generated by: {provider}")
        return answer

    except Exception as e:
        # all AI providers failed, print details so we know what went wrong
        error_msg = str(e)
        print(f"✗ All AI providers failed: {error_msg}")
        print(f"✗ Traceback: {traceback.format_exc()}")
        print(f"✗ Available providers at time of error: {list(ai_manager.providers.keys())}")
        return "Sorry, I'm having trouble right now. Try again in a minute! 🙏"