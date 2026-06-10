#!/usr/bin/env python3
"""Génère des modèles légers pour la CI (sans données volumineuses)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.models import save_model  # noqa: E402

MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

rng = np.random.default_rng(42)
X_fraud = rng.normal(size=(200, 10))
y_fraud = (rng.random(200) > 0.95).astype(int)
fraud_scaler = StandardScaler().fit(X_fraud)
fraud_model = XGBClassifier(n_estimators=10, max_depth=3, eval_metric="logloss")
fraud_model.fit(fraud_scaler.transform(X_fraud), y_fraud)

X_cluster = rng.normal(size=(100, 7))
cluster_scaler = StandardScaler().fit(X_cluster)
cluster_model = KMeans(n_clusters=2, random_state=42, n_init=10).fit(
    cluster_scaler.transform(X_cluster)
)

save_model(fraud_model, MODELS_DIR / "fraud_model.joblib")
save_model(fraud_scaler, MODELS_DIR / "fraud_scaler.joblib")
save_model(cluster_model, MODELS_DIR / "cluster_model.joblib")
save_model(cluster_scaler, MODELS_DIR / "cluster_scaler.joblib")

metadata = {
    "fraud": {
        "model_name": "xgboost",
        "roc_auc": 0.99,
        "f1": 0.5,
        "precision": 0.4,
        "recall": 0.9,
    },
    "cluster": {
        "model_name": "kmeans",
        "best_k": 2,
        "silhouette": 0.3,
        "davies_bouldin": 1.2,
        "cluster_labels": {"0": "Digital", "1": "Premium"},
    },
}
(MODELS_DIR / "metadata.json").write_text(
    json.dumps(metadata, indent=2), encoding="utf-8"
)
print("Modèles CI créés dans models/")
