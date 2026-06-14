#!/usr/bin/env python3
"""Exporte les analytics JSON pour le dashboard React."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.analytics_export import export_all_analytics  # noqa: E402
from src.charts.export import (
    export_all_charts,
    export_plotly_chart,
    export_report_figures,
)  # noqa: E402
from src.charts.fraud import build_nn_training  # noqa: E402
from src.constants import DEFAULT_CLUSTER_LABELS, TARGET_CLUSTER_K  # noqa: E402
from src.models import FRAUD_MODELS, cross_validate_models  # noqa: E402
from src.analytics_export import _prepare_fraud_matrix  # noqa: E402
from src.preprocessing import load_fraud_data  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402
import json  # noqa: E402


def _ensure_kaleido_chrome() -> None:
    """Télécharge Chrome pour Kaleido v1+ si absent (Render, CI, Docker)."""
    try:
        from kaleido import get_chrome_sync

        get_chrome_sync()
    except Exception as exc:
        print(f"Chrome/Kaleido indisponible — export PNG peut échouer : {exc}")


def main() -> None:
    _ensure_kaleido_chrome()
    fraud_path = ROOT / "data" / "raw" / "detection_fraude.csv"
    cluster_path = ROOT / "data" / "raw" / "data_cluster.csv"
    metadata_path = ROOT / "models" / "metadata.json"

    cv_results = None
    cluster_labels = dict(DEFAULT_CLUSTER_LABELS)
    best_k = TARGET_CLUSTER_K

    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        cluster_labels = meta.get("cluster", {}).get("cluster_labels", cluster_labels)
        best_k = meta.get("cluster", {}).get("best_k", TARGET_CLUSTER_K)
        if isinstance(cluster_labels, dict):
            cluster_labels = {int(k): v for k, v in cluster_labels.items()}

    if fraud_path.exists() and "--with-cv" in sys.argv:
        df = load_fraud_data(str(fraud_path))
        X, y = _prepare_fraud_matrix(df)
        X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_train)
        cv_results = cross_validate_models(FRAUD_MODELS, X_scaled, y_train)

    if not fraud_path.is_file() and not cluster_path.is_file():
        print(
            "Aucun CSV raw disponible — conservation des analytics déjà présents "
            "dans reports/analytics/."
        )
        return

    models_dir = ROOT / "models"
    export_all_analytics(
        fraud_path,
        cluster_path,
        cv_results=cv_results,
        cluster_labels=cluster_labels,
        best_k=best_k,
    )
    if fraud_path.is_file() and cluster_path.is_file():
        export_all_charts(fraud_path, cluster_path, models_dir)
    elif fraud_path.is_file():
        print("Charts Plotly partiels : data_cluster.csv absent")
    elif cluster_path.is_file():
        print("Charts Plotly partiels : detection_fraude.csv absent")
        export_plotly_chart(build_nn_training(), "ex1_nn_training")

    if fraud_path.is_file() or cluster_path.is_file():
        export_report_figures(fraud_path, cluster_path, models_dir)
        print("Figures PNG exportées dans reports/figures/")
    print("Analytics exportés dans reports/analytics/")


if __name__ == "__main__":
    main()
