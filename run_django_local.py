import runpy
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / ".pydeps"))

runpy.run_path(str(BASE_DIR / "manage.py"), run_name="__main__")
