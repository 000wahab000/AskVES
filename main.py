"""CLI entrypoint: ensures package root on path and starts the server."""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import start_server

if __name__ == "__main__":
    start_server()
