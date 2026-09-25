import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(os.getenv("OMNISTOCK_DATABASE", PROJECT_ROOT / "backend" / "omnistock.sqlite3"))
SECRET_KEY = os.getenv("OMNISTOCK_SECRET_KEY", "change-this-secret-before-production")
TOKEN_TTL_SECONDS = int(os.getenv("OMNISTOCK_TOKEN_TTL_SECONDS", "28800"))
