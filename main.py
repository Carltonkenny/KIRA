"""Root entrypoint proxy for Render & cloud deployment environments."""
import sys
import os

# Add backend directory to sys.path so all internal imports (config, database, etc.) resolve
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app

__all__ = ["app"]
