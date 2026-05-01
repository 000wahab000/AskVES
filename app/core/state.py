# state.py - shared memory of the running server
# these variables are created once when the server starts
# and they stay alive the whole time the server is running
# any file can import from here to read or update these values

import time

# SESSIONS stores all the logged in users
# when someone logs in with google, their info gets saved here with a random token as the key
# when the server restarts this gets wiped so everyone has to log in again
SESSIONS = {}

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

# this is reserved for future multi-turn chat support, not used yet
chat_history = []
