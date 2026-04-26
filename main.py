import sys
import os

# Add the root directory to PYTHONPATH so the 'app' module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import start_server

if __name__ == "__main__":
    start_server()
