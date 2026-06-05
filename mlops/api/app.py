"""API FastAPI pour les deux modèles : détection de fraude et segmentation client."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import joblib
from pathlib import Path

app = FastAPI(
    title="ML API — Fraude & Segmentation",
    description="API de prédiction pour la détection de fraude et la segmentation client",
    version="1.0.0",
)

MODELS_DIR = Path(__file__).parent.parent.parent / "models"


def load_model_safe(path: Path):
    if not path.exists():
        return None
    return joblib.load(path)


fraud_model = load_model_safe(MODELS_DIR / "fraud_model.joblib")
fraud_scaler = load_model_safe(MODELS_DIR / "fraud_scaler.joblib")
cluster_model = load_model_safe(MODELS_DIR / "cluster_model.joblib")
cluster_scaler = load_model_safe(MODELS_DIR / "cluster_scaler.joblib")

CLUSTER_LABELS = {0: "Premium", 1: "Digital", 2: "Promo-sensible", 3: "Dormant"}


class FraudRequest(BaseModel):
    step: int = Field(..., ge=1, description="Unité temporelle")
    type: str = Field(..., description="Type de transaction")
    amount: float = Field(..., ge=0, description="Montant")
    oldbalanceOrg: float = Field(..., ge=0)
    newbalanceOrig: float = Field(..., ge=0)
    oldbalanceDest: float = Field(..., ge=0)
    newbalanceDest: float = Field(..., ge=0)


class FraudResponse(BaseModel):
    is_fraud: bool
    probability: float
    risk_level: str


class CustomerRequest(BaseModel):
    income: float = Field(..., ge=0)
    age: int = Field(..., ge=18, le=100)
    total_spend: float = Field(..., ge=0)
    num_web_purchases: int = Field(..., ge=0)
    num_store_purchases: int = Field(..., ge=0)
    recency: int = Field(..., ge=0)
    children: int = Field(..., ge=0)


class CustomerResponse(BaseModel):
    cluster_id: int
    profile: str
    description: str


@app.get("/")
def root():
    return {"status": "ok", "endpoints": ["/predict/fraud", "/predict/segment", "/health"]}


@app.get("/health")
def health():
    return {
        "fraud_model_loaded": fraud_model is not None,
        "cluster_model_loaded": cluster_model is not None,
    }


@app.post("/predict/fraud", response_model=FraudResponse)
def predict_fraud(request: FraudRequest):
    if fraud_model is None:
        raise HTTPException(status_code=503, detail="Modèle fraude non disponible")

    type_map = {"PAYMENT": 0, "TRANSFER": 1, "CASH_OUT": 2, "DEBIT": 3, "CASH_IN": 4}
    type_encoded = type_map.get(request.type, -1)
    if type_encoded == -1:
        raise HTTPException(status_code=422, detail=f"Type inconnu : {request.type}")

    error_orig = request.newbalanceOrig - (request.oldbalanceOrg - request.amount)
    error_dest = request.newbalanceDest - (request.oldbalanceDest + request.amount)
    orig_zeroed = int(request.oldbalanceOrg > 0 and request.newbalanceOrig == 0)

    features = np.array([[
        request.step, request.amount, request.oldbalanceOrg, request.newbalanceOrig,
        request.oldbalanceDest, request.newbalanceDest,
        error_orig, error_dest, orig_zeroed, type_encoded,
    ]])

    if fraud_scaler:
        features = fraud_scaler.transform(features)

    proba = float(fraud_model.predict_proba(features)[0, 1])
    is_fraud = proba >= 0.3
    risk = "élevé" if proba >= 0.7 else "moyen" if proba >= 0.3 else "faible"

    return FraudResponse(is_fraud=is_fraud, probability=round(proba, 4), risk_level=risk)


@app.post("/predict/segment", response_model=CustomerResponse)
def predict_segment(request: CustomerRequest):
    if cluster_model is None:
        raise HTTPException(status_code=503, detail="Modèle clustering non disponible")

    features = np.array([[
        request.income, request.age, request.total_spend,
        request.num_web_purchases, request.num_store_purchases,
        request.recency, request.children,
    ]])

    if cluster_scaler:
        features = cluster_scaler.transform(features)

    cluster_id = int(cluster_model.predict(features)[0])
    profile = CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}")
    descriptions = {
        "Premium": "Client à haute valeur, dépenses élevées, revenu supérieur.",
        "Digital": "Acheteur web fréquent, sensible aux offres en ligne.",
        "Promo-sensible": "Réagit fortement aux promotions et deals.",
        "Dormant": "Client peu actif, nécessite une campagne de réactivation.",
    }

    return CustomerResponse(
        cluster_id=cluster_id,
        profile=profile,
        description=descriptions.get(profile, "Profil non défini"),
    )
