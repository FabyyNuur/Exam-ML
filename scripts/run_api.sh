#!/usr/bin/env bash
# Lance l'API avec le venv du projet (numpy<2, scipy/xgboost compatibles).
# Évite les conflits NumPy 2.x de l'environnement conda (base).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pick_python() {
  for cmd in "${PYTHON:-}" python3.12 python3.11 python3.10 python3; do
    [[ -n "$cmd" ]] && command -v "$cmd" >/dev/null 2>&1 && echo "$cmd" && return
  done
  echo "python3"
}

PYTHON_BIN="$(pick_python)"

if [[ ! -d .venv ]]; then
  echo "→ Création de .venv avec ${PYTHON_BIN}…"
  "${PYTHON_BIN}" -m venv .venv
  .venv/bin/pip install -U pip
  .venv/bin/pip install -r requirements.txt
fi

if ! .venv/bin/python -c "import numpy; assert numpy.__version__.startswith('1.')" 2>/dev/null; then
  echo "→ Réinstallation des dépendances (numpy<2 requis)…"
  .venv/bin/pip install -r requirements.txt
fi

exec .venv/bin/uvicorn mlops.api.app:app --reload --port "${PORT:-8000}" "$@"
