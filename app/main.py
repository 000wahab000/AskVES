# main.py - this is where the whole program starts from
# when you run the project this file runs first
# it loads all the data, sets up the AI, and then starts the web server

import os
from http.server import HTTPServer   # this is the built in python web server, no need to install anything extra
from app.core.router import Handler  # the router handles all the incoming requests from browser or whatsapp
import app.services.db as db         # the database stuff
from app.services.ai import ai_manager  # the AI stuff
from app.core.intents import warm_up    # pre-builds the synonym map after data is loaded

def start_server():
    # step 1: load all campus data from supabase into memory
    db.init_db()

    # step 2: build the synonym map NOW while the timetable data is freshly loaded
    # if we skip this it builds lazily on the first question, which might arrive before
    # the DB fetch is done on platforms like Railway that send a health-check immediately
    warm_up()

    # print some info so you know the server started correctly
    print("="*50)
    print("AskVES Multi-AI Mode (High Speed)")
    print("="*50)
    print(f"Available providers: {list(ai_manager.providers.keys())}")  # shows which AI is ready (groq / gemini)
    print("Priority: Groq-8B (Multi-Key) → Gemini-Flash")
    print("="*50)

    # read port from environment (render/railway sets this) or default to 8000 for local
    port = int(os.environ.get("PORT", 8000))
    print(f"AskVES running at http://localhost:{port}")

    # start the server and keep it running forever until you stop it with ctrl+c
    HTTPServer(("", port), Handler).serve_forever()

# this block only runs if you start this file directly
# if another file imports this, this block is skipped
if __name__ == "__main__":
    start_server()
