"""Upload data/*.json rows into Supabase campus_data."""

import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    exit(1)

print("Connecting to Supabase...")
supabase: Client = create_client(url, key)

files = [
    "canteen",
    "timetable",
    "xerox",
    "vending",
    "events",
    "community"
]

print("Starting migration...")
for name in files:
    filepath = f"data/{name}.json"
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            data = json.load(f)
            
        try:
            supabase.table("campus_data").upsert({
                "id": name,
                "data": data
            }).execute()
            print(f"✅ Migrated {name}.json")
        except Exception as e:
            print(f"❌ Failed to migrate {name}.json: {e}")
    else:
        print(f"⚠️ File {filepath} not found, skipping.")
        
print("🚀 Migration complete!")
