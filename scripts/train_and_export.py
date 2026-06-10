#!/usr/bin/env python3
"""Script CLI pour entraîner et exporter les modèles dans models/."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from mlops.pipeline import main  # noqa: E402

if __name__ == "__main__":
    main()
