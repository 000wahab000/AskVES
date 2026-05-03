"""Supabase-backed in-memory campus data with version bumps for cache."""

import json
import os
import threading

from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
except ImportError:
    supabase = None

canteen_data = {}
timetable_data = {}
xerox_data = {}
vending_data = {}
events_data = {}
community_data = {}

_data_versions = {k: 0 for k in ['canteen', 'timetable', 'xerox', 'vending', 'events', 'community']}
_lock = threading.Lock()


def init_db():
    """Load all campus_data rows into module globals."""
    global canteen_data, timetable_data, xerox_data, vending_data, events_data, community_data

    if supabase:
        print("🔄 Fetching campus data from Supabase...")
        try:
            response = supabase.table("campus_data").select("*").execute()
            for row in response.data:
                if row["id"] == "canteen":
                    canteen_data = row["data"]
                elif row["id"] == "timetable":
                    timetable_data = row["data"]
                elif row["id"] == "xerox":
                    xerox_data = row["data"]
                elif row["id"] == "vending":
                    vending_data = row["data"]
                elif row["id"] == "events":
                    events_data = row["data"]
                elif row["id"] == "community":
                    community_data = row["data"]

            print("✅ Supabase data loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load from Supabase: {e}")
    else:
        print("⚠️ Supabase not connected. Using empty data.")


def update_data(source, new_data):
    """Replace one source in memory and bump its version for JSON cache."""
    global canteen_data, timetable_data, xerox_data, vending_data, events_data, community_data
    with _lock:
        if source == 'canteen':
            canteen_data = new_data
        elif source == 'timetable':
            timetable_data = new_data
        elif source == 'xerox':
            xerox_data = new_data
        elif source == 'vending':
            vending_data = new_data
        elif source == 'events':
            events_data = new_data
        elif source == 'community':
            community_data = new_data
        _data_versions[source] = _data_versions.get(source, 0) + 1
