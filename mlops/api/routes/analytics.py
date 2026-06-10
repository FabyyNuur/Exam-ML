"""Analytics pré-calculés pour les graphiques Recharts."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from mlops.content.pages import ANALYTICS_DIR, METADATA_PATH

PLOTLY_DIR = ANALYTICS_DIR / "plotly"

router = APIRouter(tags=["analytics"])


def _load_json(filename: str) -> dict:
    path = ANALYTICS_DIR / filename
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Analytics introuvable : {filename}. Exécuter le pipeline d'entraînement.",
        )
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/analytics/fraud/eda")
def fraud_eda():
    return _load_json("fraud_eda.json")


@router.get("/analytics/fraud/models")
def fraud_models():
    return _load_json("fraud_models.json")


@router.get("/analytics/cluster/eda")
def cluster_eda():
    return _load_json("cluster_eda.json")


@router.get("/analytics/cluster/k-selection")
def cluster_k_selection():
    return _load_json("cluster_k_selection.json")


@router.get("/analytics/cluster/summary")
def cluster_summary():
    data = _load_json("cluster_summary.json")
    if METADATA_PATH.exists():
        meta = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        cluster = meta.get("cluster", {})
        data["metrics"] = {
            "silhouette": cluster.get("silhouette"),
            "davies_bouldin": cluster.get("davies_bouldin"),
            "best_k": cluster.get("best_k"),
            "cluster_labels": cluster.get("cluster_labels", {}),
        }
    return data


@router.get("/analytics/charts")
def list_charts():
    if not PLOTLY_DIR.exists():
        return {"charts": []}
    return {"charts": sorted(p.stem for p in PLOTLY_DIR.glob("*.json"))}


@router.get("/analytics/charts/{chart_id}")
def get_chart(chart_id: str):
    safe_id = chart_id.replace("..", "").replace("/", "")
    path = PLOTLY_DIR / f"{safe_id}.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Chart Plotly introuvable : {chart_id}. Exécuter le pipeline ou scripts/export_analytics.py.",
        )
    return json.loads(path.read_text(encoding="utf-8"))
