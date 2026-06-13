"""Routes de prédiction unitaire et batch."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from mlops.api.inference import ModelRegistry
from mlops.api.schemas import (
    CustomerRequest,
    CustomerResponse,
    FraudBatchResponse,
    FraudRequest,
    FraudResponse,
    SegmentBatchResponse,
)

SAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "data" / "samples"


def _read_upload(file: UploadFile) -> bytes:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="Seuls les fichiers .csv sont acceptés")
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Fichier CSV vide")
    return content


def register_predict_routes(app_router: APIRouter, registry: ModelRegistry) -> None:
    @app_router.post("/predict/fraud", response_model=FraudResponse)
    def predict_fraud(request: FraudRequest):
        try:
            return registry.predict_fraud(request)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    @app_router.post("/predict/segment", response_model=CustomerResponse)
    def predict_segment(request: CustomerRequest):
        try:
            return registry.predict_segment(request)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    @app_router.post("/predict/fraud/batch", response_model=FraudBatchResponse)
    async def predict_fraud_batch(file: UploadFile = File(...)):
        content = _read_upload(file)
        try:
            return registry.predict_fraud_batch(content)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except ValueError as exc:
            msg = str(exc)
            status = 413 if "Limite" in msg or "volumineux" in msg else 422
            raise HTTPException(status_code=status, detail=msg) from exc

    @app_router.post("/predict/segment/batch", response_model=SegmentBatchResponse)
    async def predict_segment_batch(file: UploadFile = File(...)):
        content = _read_upload(file)
        try:
            return registry.predict_segment_batch(content)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except ValueError as exc:
            msg = str(exc)
            status = 413 if "Limite" in msg or "volumineux" in msg else 422
            raise HTTPException(status_code=status, detail=msg) from exc

    @app_router.get("/predict/templates/{kind}")
    def predict_template(kind: str):
        mapping = {
            "fraud": SAMPLES_DIR / "fraud_sample.csv",
            "segment": SAMPLES_DIR / "cluster_sample.csv",
        }
        path = mapping.get(kind)
        if path is None or not path.exists():
            raise HTTPException(status_code=404, detail="Modèle CSV introuvable")
        return FileResponse(
            path,
            media_type="text/csv",
            filename=path.name,
        )
