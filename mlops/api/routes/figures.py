"""Servir les figures PNG exportées par les notebooks."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from mlops.content.pages import FIGURES_DIR

router = APIRouter(tags=["figures"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg"}


@router.get("/figures/{filename}")
def get_figure(filename: str):
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Extension non autorisée")

    path = FIGURES_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Figure introuvable : {filename}")

    media = "image/png" if suffix == ".png" else f"image/{suffix.lstrip('.')}"
    return FileResponse(path, media_type=media)
