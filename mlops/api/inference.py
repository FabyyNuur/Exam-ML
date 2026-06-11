"""Chargement des modèles et logique de prédiction."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from mlops.api.schemas import (
    CustomerRequest,
    CustomerResponse,
    FraudRequest,
    FraudResponse,
)
from src.constants import (
    CLUSTER_API_COLUMNS,
    CLUSTER_PROFILE_DESCRIPTIONS,
    DEFAULT_CLUSTER_LABELS,
    FRAUD_FEATURE_COLUMNS,
    FRAUD_THRESHOLD,
    RISK_HIGH_THRESHOLD,
    TYPE_MAP,
)


def _load_joblib(path: Path) -> Any | None:
    return joblib.load(path) if path.exists() else None


def _load_cluster_labels(models_dir: Path) -> dict[int, str]:
    metadata_path = models_dir / "metadata.json"
    if not metadata_path.exists():
        return DEFAULT_CLUSTER_LABELS.copy()

    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    raw = data.get("cluster", {}).get("cluster_labels", {})
    if not raw:
        return DEFAULT_CLUSTER_LABELS.copy()
    return {int(k): v for k, v in raw.items()}


def _load_metadata(models_dir: Path) -> dict:
    metadata_path = models_dir / "metadata.json"
    if not metadata_path.exists():
        return {}
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def _risk_level(probability: float) -> str:
    if probability >= RISK_HIGH_THRESHOLD:
        return "élevé"
    if probability >= FRAUD_THRESHOLD:
        return "moyen"
    return "faible"


def _build_fraud_features(request: FraudRequest) -> pd.DataFrame:
    error_orig = request.newbalanceOrig - (request.oldbalanceOrg - request.amount)
    error_dest = request.newbalanceDest - (request.oldbalanceDest + request.amount)
    orig_zeroed = int(request.oldbalanceOrg > 0 and request.newbalanceOrig == 0)

    return pd.DataFrame(
        [
            {
                "step": request.step,
                "amount": request.amount,
                "oldbalanceOrg": request.oldbalanceOrg,
                "newbalanceOrig": request.newbalanceOrig,
                "oldbalanceDest": request.oldbalanceDest,
                "newbalanceDest": request.newbalanceDest,
                "error_balance_orig": error_orig,
                "error_balance_dest": error_dest,
                "orig_zeroed": orig_zeroed,
                "type_encoded": TYPE_MAP[request.type],
            }
        ],
        columns=FRAUD_FEATURE_COLUMNS,
    )


def _build_cluster_features(request: CustomerRequest) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Income": request.income,
                "Age": request.age,
                "TotalSpend": request.total_spend,
                "NumWebPurchases": request.num_web_purchases,
                "NumStorePurchases": request.num_store_purchases,
                "Recency": request.recency,
                "Children": request.children,
            }
        ],
        columns=CLUSTER_API_COLUMNS,
    )


@dataclass
class ModelRegistry:
    """Registre des modèles joblib et métadonnées associées."""

    models_dir: Path
    fraud_model: Any | None = field(default=None, init=False)
    fraud_scaler: Any | None = field(default=None, init=False)
    cluster_model: Any | None = field(default=None, init=False)
    cluster_scaler: Any | None = field(default=None, init=False)
    cluster_labels: dict[int, str] = field(default_factory=dict, init=False)
    metadata: dict = field(default_factory=dict, init=False)

    def load(self) -> None:
        self.fraud_model = _load_joblib(self.models_dir / "fraud_model.joblib")
        self.fraud_scaler = _load_joblib(self.models_dir / "fraud_scaler.joblib")
        self.cluster_model = _load_joblib(self.models_dir / "cluster_model.joblib")
        self.cluster_scaler = _load_joblib(self.models_dir / "cluster_scaler.joblib")
        self.cluster_labels = _load_cluster_labels(self.models_dir)
        self.metadata = _load_metadata(self.models_dir)

    def predict_fraud(self, request: FraudRequest) -> FraudResponse:
        if self.fraud_model is None:
            raise RuntimeError("Modèle fraude non disponible")

        features = _build_fraud_features(request)
        if self.fraud_scaler is not None:
            features = pd.DataFrame(
                self.fraud_scaler.transform(features), columns=FRAUD_FEATURE_COLUMNS
            )

        proba = float(self.fraud_model.predict_proba(features)[0, 1])
        return FraudResponse(
            is_fraud=proba >= FRAUD_THRESHOLD,
            probability=round(proba, 4),
            risk_level=_risk_level(proba),
        )

    def predict_segment(self, request: CustomerRequest) -> CustomerResponse:
        if self.cluster_model is None:
            raise RuntimeError("Modèle clustering non disponible")

        features = _build_cluster_features(request)
        if self.cluster_scaler is not None:
            features = pd.DataFrame(
                self.cluster_scaler.transform(features), columns=CLUSTER_API_COLUMNS
            )

        cluster_id = int(self.cluster_model.predict(features)[0])
        profile = self.cluster_labels.get(cluster_id, f"Cluster {cluster_id}")
        description = CLUSTER_PROFILE_DESCRIPTIONS.get(profile, "Profil non défini")

        return CustomerResponse(
            cluster_id=cluster_id,
            profile=profile,
            description=description,
        )
