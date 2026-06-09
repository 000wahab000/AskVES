import sys
import os
import uvicorn

# Add the root directory to PYTHONPATH so the 'app' module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
