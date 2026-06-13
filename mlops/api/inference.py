"""Chargement des modèles et logique de prédiction."""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score

from mlops.api.schemas import (
    ConfusionMatrix,
    CustomerRequest,
    CustomerResponse,
    FraudBatchEvaluation,
    FraudBatchResponse,
    FraudBatchRow,
    FraudRequest,
    FraudResponse,
    MAX_UPLOAD_BYTES,
    SegmentBatchResponse,
    SegmentBatchRow,
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
from src.inference_prep import (
    FRAUD_REQUIRED_COLUMNS,
    load_cluster_from_bytes,
    load_fraud_from_bytes,
    prepare_cluster_inference,
    prepare_fraud_inference,
    validate_cluster_columns,
    validate_fraud_columns,
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

    def predict_fraud_batch(self, content: bytes) -> FraudBatchResponse:
        if self.fraud_model is None:
            raise RuntimeError("Modèle fraude non disponible")
        if len(content) > MAX_UPLOAD_BYTES:
            raise ValueError(
                f"Fichier trop volumineux (max {MAX_UPLOAD_BYTES // (1024 * 1024)} Mo)"
            )

        df = load_fraud_from_bytes(content)
        if df.empty:
            raise ValueError("Fichier CSV vide")

        total = len(df)

        missing = validate_fraud_columns(df)
        if missing:
            raise ValueError(
                f"Colonnes manquantes : {', '.join(missing)}. "
                f"Attendu : {', '.join(FRAUD_REQUIRED_COLUMNS)}"
            )

        X, y, row_indices, errors = prepare_fraud_inference(df)
        if X.empty:
            return FraudBatchResponse(
                total=total,
                processed=0,
                summary={
                    "fraud_count": 0,
                    "fraud_rate": 0.0,
                    "risk_distribution": {"faible": 0, "moyen": 0, "élevé": 0},
                },
                evaluation=None,
                rows=[],
                errors=errors or ["Aucune ligne valide"],
            )

        if self.fraud_scaler is not None:
            X_scaled = pd.DataFrame(self.fraud_scaler.transform(X), columns=FRAUD_FEATURE_COLUMNS)
        else:
            X_scaled = X

        probas = self.fraud_model.predict_proba(X_scaled)[:, 1]
        preds = probas >= FRAUD_THRESHOLD
        risk_levels = [_risk_level(float(p)) for p in probas]

        rows = [
            FraudBatchRow(
                row_index=int(row_indices[i]),
                is_fraud=bool(preds[i]),
                probability=round(float(probas[i]), 4),
                risk_level=risk_levels[i],
            )
            for i in range(len(X))
        ]

        risk_dist = Counter(risk_levels)
        fraud_count = int(preds.sum())
        summary = {
            "fraud_count": fraud_count,
            "fraud_rate": round(fraud_count / len(rows), 4) if rows else 0.0,
            "risk_distribution": {
                "faible": risk_dist.get("faible", 0),
                "moyen": risk_dist.get("moyen", 0),
                "élevé": risk_dist.get("élevé", 0),
            },
        }

        evaluation = None
        if y is not None and len(y) == len(preds):
            y_true = y.to_numpy()
            y_pred = preds.astype(int)
            tp = int(((y_true == 1) & (y_pred == 1)).sum())
            fp = int(((y_true == 0) & (y_pred == 1)).sum())
            tn = int(((y_true == 0) & (y_pred == 0)).sum())
            fn = int(((y_true == 1) & (y_pred == 0)).sum())
            evaluation = FraudBatchEvaluation(
                roc_auc=float(roc_auc_score(y_true, probas)) if len(np.unique(y_true)) > 1 else 0.0,
                precision=float(precision_score(y_true, y_pred, zero_division=0)),
                recall=float(recall_score(y_true, y_pred, zero_division=0)),
                f1=float(f1_score(y_true, y_pred, zero_division=0)),
                confusion_matrix=ConfusionMatrix(tp=tp, fp=fp, tn=tn, fn=fn),
            )

        return FraudBatchResponse(
            total=total,
            processed=len(rows),
            summary=summary,
            evaluation=evaluation,
            rows=rows,
            errors=errors,
        )

    def predict_segment_batch(self, content: bytes) -> SegmentBatchResponse:
        if self.cluster_model is None:
            raise RuntimeError("Modèle clustering non disponible")
        if len(content) > MAX_UPLOAD_BYTES:
            raise ValueError(
                f"Fichier trop volumineux (max {MAX_UPLOAD_BYTES // (1024 * 1024)} Mo)"
            )

        df = load_cluster_from_bytes(content)
        if df.empty:
            raise ValueError("Fichier CSV vide")

        total = len(df)

        missing = validate_cluster_columns(df)
        if missing:
            raise ValueError(f"Colonnes manquantes : {', '.join(missing)}")

        X, row_indices, errors = prepare_cluster_inference(df)
        if X.empty:
            return SegmentBatchResponse(
                total=total,
                processed=0,
                summary={"cluster_distribution": {}},
                rows=[],
                errors=errors or ["Aucune ligne valide"],
            )

        if self.cluster_scaler is not None:
            X_scaled = pd.DataFrame(self.cluster_scaler.transform(X), columns=CLUSTER_API_COLUMNS)
        else:
            X_scaled = X

        cluster_ids = self.cluster_model.predict(X_scaled)
        profiles = [self.cluster_labels.get(int(cid), f"Cluster {int(cid)}") for cid in cluster_ids]
        rows = [
            SegmentBatchRow(
                row_index=int(row_indices[i]),
                cluster_id=int(cluster_ids[i]),
                profile=profiles[i],
                description=CLUSTER_PROFILE_DESCRIPTIONS.get(profiles[i], "Profil non défini"),
            )
            for i in range(len(X))
        ]

        dist = Counter(profiles)
        return SegmentBatchResponse(
            total=total,
            processed=len(rows),
            summary={"cluster_distribution": dict(dist)},
            rows=rows,
            errors=errors,
        )
