"""Servir les figures PNG exportées par les notebooks."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from mlops.content.pages import FIGURES_DIR, ROOT

router = APIRouter(tags=["figures"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg"}

DATA_DIR = ROOT / "data" / "raw"
MODELS_DIR = ROOT / "models"
FRAUD_CSV = DATA_DIR / "detection_fraude.csv"
CLUSTER_CSV = DATA_DIR / "data_cluster.csv"


def _ensure_figure(filename: str) -> Path:
    path = FIGURES_DIR / filename
    if path.exists():
        return path

    chart_id = Path(filename).stem
    from src.charts.export import generate_report_figure

    if generate_report_figure(
        chart_id,
        path,
        fraud_path=FRAUD_CSV,
        cluster_path=CLUSTER_CSV,
        models_dir=MODELS_DIR,
    ):
        return path

    raise HTTPException(status_code=404, detail=f"Figure introuvable : {filename}")


@router.get("/figures/{filename}")
def get_figure(filename: str):
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Extension non autorisée")

    path = _ensure_figure(filename)
    media = "image/png" if suffix == ".png" else f"image/{suffix.lstrip('.')}"
    return FileResponse(path, media_type=media)
