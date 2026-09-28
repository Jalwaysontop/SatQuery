"""
Side-effect-only import: makes the existing, untouched `ml/change_detection`
code importable from the backend without moving or copying any of it.
Import this module before importing anything from `change_detection`.

Two paths are needed because that package is internally inconsistent about
how its own modules import each other (pre-existing, not something this
backend changes): `pipeline.py` uses the qualified
`from change_detection.imaging import ...`, while `vqa.py` uses
the bare `from imaging import ...`. The former needs `ml/` on
sys.path; the latter needs the package directory itself on sys.path.
"""
import sys

from app.config import REPO_ROOT

_ML_ROOT = REPO_ROOT / "ml"
_ML_PACKAGE_DIR = _ML_ROOT / "change_detection"

for _path in (str(_ML_ROOT), str(_ML_PACKAGE_DIR)):
    if _path not in sys.path:
        sys.path.insert(0, _path)
