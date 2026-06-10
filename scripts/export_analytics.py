#!/usr/bin/env python3
"""Exporte les analytics JSON pour le dashboard React."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.analytics_export import export_all_analytics  # noqa: E402
from src.charts.export import export_all_charts  # noqa: E402
from src.models import FRAUD_MODELS, cross_validate_models  # noqa: E402
from src.analytics_export import _prepare_fraud_matrix  # noqa: E402
from src.preprocessing import load_fraud_data  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402
import json  # noqa: E402


def main() -> None:
    fraud_path = ROOT / "data" / "raw" / "detection_fraude.csv"
    cluster_path = ROOT / "data" / "raw" / "data_cluster.csv"
    metadata_path = ROOT / "models" / "metadata.json"

    cv_results = None
    cluster_labels = {0: "Digital", 1: "Premium"}
    best_k = 2

    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        cluster_labels = meta.get("cluster", {}).get("cluster_labels", cluster_labels)
        best_k = meta.get("cluster", {}).get("best_k", 2)
        if isinstance(cluster_labels, dict):
            cluster_labels = {int(k): v for k, v in cluster_labels.items()}

    if fraud_path.exists() and "--with-cv" in sys.argv:
        df = load_fraud_data(str(fraud_path))
        X, y = _prepare_fraud_matrix(df)
        X_train, _, y_train, _ = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_train)
        cv_results = cross_validate_models(FRAUD_MODELS, X_scaled, y_train)

    models_dir = ROOT / "models"
    export_all_analytics(
        fraud_path if fraud_path.exists() else cluster_path,
        cluster_path if cluster_path.exists() else fraud_path,
        cv_results=cv_results,
        cluster_labels=cluster_labels,
        best_k=best_k,
    )
    if fraud_path.exists() and cluster_path.exists():
        export_all_charts(fraud_path, cluster_path, models_dir)
    print("Analytics exportés dans reports/analytics/")


if __name__ == "__main__":
    main()
