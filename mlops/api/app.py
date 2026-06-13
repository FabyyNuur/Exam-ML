"""API FastAPI — détection de fraude et segmentation client."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mlops.api.inference import ModelRegistry
from mlops.api.routes import analytics, content, figures, predict
from mlops.api.schemas import HealthResponse, MetadataResponse

MODELS_DIR = Path(__file__).parent.parent.parent / "models"
registry = ModelRegistry(models_dir=MODELS_DIR)

_DEFAULT_CORS = "http://localhost:5173,http://127.0.0.1:5173"


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", _DEFAULT_CORS)
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry.load()
    yield


app = FastAPI(
    title="ML API — Fraude & Segmentation",
    description="API de prédiction pour la détection de fraude et la segmentation client",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(figures.router)
app.include_router(content.router)
app.include_router(analytics.router)
predict.register_predict_routes(app, registry)


@app.get("/api")
def api_root():
    return {
        "status": "ok",
        "endpoints": [
            "/health",
            "/metadata",
            "/predict/fraud",
            "/predict/fraud/batch",
            "/predict/segment",
            "/predict/segment/batch",
            "/predict/templates/{kind}",
            "/figures/{filename}",
            "/content/pages",
            "/analytics/fraud/eda",
            "/analytics/fraud/models",
            "/analytics/cluster/eda",
            "/analytics/cluster/k-selection",
            "/analytics/cluster/summary",
            "/analytics/charts",
            "/analytics/charts/{chart_id}",
        ],
    }


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        fraud_model_loaded=registry.fraud_model is not None,
        cluster_model_loaded=registry.cluster_model is not None,
    )


@app.get("/metadata", response_model=MetadataResponse)
def metadata():
    return MetadataResponse(
        fraud=registry.metadata.get("fraud"),
        cluster=registry.metadata.get("cluster"),
    )
