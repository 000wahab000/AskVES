import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from app.utils.logger import logger

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    exit(1)

logger.info("Connecting to Supabase...")
supabase: Client = create_client(url, key)

files = [
    "canteen",
    "timetable",
    "xerox",
    "vending",
    "events",
    "community"
]

logger.info("Starting migration...")
for name in files:
    filepath = f"data/{name}.json"
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            data = json.load(f)
            
        try:
            # Upsert into supabase (insert or update)
            supabase.table("campus_data").upsert({
                "id": name,
                "data": data
            }).execute()
            logger.info(f"✅ Migrated {name}.json")
        except Exception as e:
            logger.error(f"❌ Failed to migrate {name}.json: {e}")
    else:
        logger.warning(f"⚠️ File {filepath} not found, skipping.")
        
logger.info("🚀 Migration complete!")
