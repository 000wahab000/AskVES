import time

# In-memory session store: token -> {email, name, picture}
SESSIONS = {}
server_start_time = time.time()
metrics = {
    "total_queries": 0,
    "total_response_time": 0,
    "provider_usage": {}
}

chat_history = []
