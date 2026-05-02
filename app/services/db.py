# db.py - the data layer of the project
# this file connects to supabase (the cloud database) and loads all campus data into memory
# every other file reads the data from here, they dont connect to supabase themselves

import os, json, threading
from dotenv import load_dotenv   # reads the .env file so we can access the keys we stored there

load_dotenv()

# try to connect to supabase using the url and key from the .env file
# if the supabase package is not installed or the keys are missing, supabase will just be None
# and the app will run with empty data showing a warning
try:
    from supabase import create_client, Client
    supabase_url = os.environ.get("SUPABASE_URL")   # your supabase project url
    supabase_key = os.environ.get("SUPABASE_KEY")   # your supabase anon/service key
    supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
except ImportError:
    supabase = None   # supabase package not installed, thats fine

# these are the in-memory stores for all campus data
# they start empty and get filled when init_db() runs at startup
# intents.py reads from these to build the AI context
canteen_data   = {}   # food menu and prices
timetable_data = {}   # teacher info and daily room/slot schedule
xerox_data     = {}   # xerox shop info
vending_data   = {}   # vending machine locations and items
events_data    = {}   # upcoming events and workshops
community_data = {}   # student submitted facts and discussion posts

# version counters: bumped by update_data() each time a source changes
# intents.py uses these (paired with id()) to reliably detect cache invalidation
# avoids the Python id() GC reuse bug where a freed object's address gets reused
_data_versions = {k: 0 for k in ['canteen', 'timetable', 'xerox', 'vending', 'events', 'community']}

# protects all writes to the shared data dicts
# currently the server is single-threaded so this is a no-op overhead,
# but it makes the code safe if we ever switch to ThreadingHTTPServer
_lock = threading.Lock()

def init_db():
    # this runs once when the server starts (called from main.py)
    # it fetches all rows from the supabase campus_data table and puts each one into the right variable above
    # the supabase table has two columns: id (the data name) and data (the actual json content)

    # global means we are updating the variables above, not creating new local ones
    global canteen_data, timetable_data, xerox_data, vending_data, events_data, community_data

    if supabase:
        print("🔄 Fetching campus data from Supabase...")
        try:
            # fetch all rows from the table
            response = supabase.table("campus_data").select("*").execute()

            # loop through each row and assign it to the right variable
            for row in response.data:
                if row["id"] == "canteen":    canteen_data   = row["data"]
                elif row["id"] == "timetable": timetable_data = row["data"]
                elif row["id"] == "xerox":     xerox_data     = row["data"]
                elif row["id"] == "vending":   vending_data   = row["data"]
                elif row["id"] == "events":    events_data    = row["data"]
                elif row["id"] == "community": community_data = row["data"]

            print("✅ Supabase data loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load from Supabase: {e}")
    else:
        print("⚠️ Supabase not connected. Using empty data.")

def update_data(source, new_data):
    # this runs after the admin saves new data through the admin panel
    # it updates the in-memory variable immediately so the AI sees the new data
    # without needing a server restart
    global canteen_data, timetable_data, xerox_data, vending_data, events_data, community_data
    with _lock:   # hold the lock for the duration of the write
        if source == 'canteen':    canteen_data   = new_data
        elif source == 'timetable': timetable_data = new_data
        elif source == 'xerox':     xerox_data     = new_data
        elif source == 'vending':   vending_data   = new_data
        elif source == 'events':    events_data    = new_data
        elif source == 'community': community_data = new_data
        # bump the version so intents.py JSON cache knows to re-serialize this source
        _data_versions[source] = _data_versions.get(source, 0) + 1
