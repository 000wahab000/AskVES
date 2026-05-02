# state.py - shared memory of the running server
# these variables are created once when the server starts
# and they stay alive the whole time the server is running
# any file can import from here to read or update these values

import time

# SESSIONS stores all the logged in users
# key = session token (sha256 hex), value = dict with email, name, picture, created_at
# when the server restarts this gets wiped so everyone has to log in again
SESSIONS = {}

# sessions expire after this many seconds (7 days)
SESSION_TTL = 60 * 60 * 24 * 7

def get_session(token):
    # looks up a session token and returns the user dict if it exists and hasn't expired
    # automatically removes the token from SESSIONS if it is too old
    s = SESSIONS.get(token)
    if s is None:
        return None
    if time.time() - s.get('created_at', 0) > SESSION_TTL:
        SESSIONS.pop(token, None)   # evict the stale session
        return None
    return s

# records the exact second the server started, used to calculate uptime on the health page
server_start_time = time.time()

# tracks how the bot is being used
# total_queries = how many questions were asked since startup
# total_response_time = total seconds spent waiting for AI answers (divide by queries to get average)
# provider_usage = which AI answered how many times eg {"Groq": 42, "Gemini": 7}
metrics = {
    "total_queries": 0,
    "total_response_time": 0,
    "provider_usage": {}
}
