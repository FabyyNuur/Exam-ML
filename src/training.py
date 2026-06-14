"""Entraînement et export des modèles fraude et segmentation."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score,
    davies_bouldin_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src.analytics_export import (
    export_all_analytics,
    export_cluster_eda,
    export_cluster_k_selection,
    export_cluster_summary,
    export_fraud_eda,
    export_fraud_models,
)
from src.charts.export import export_all_charts
from src.constants import CLUSTER_API_COLUMNS, FRAUD_THRESHOLD, TARGET_CLUSTER_K
from src.inference_prep import prepare_cluster_matrix, prepare_fraud_matrix
from src.models import (
    FRAUD_MODELS,
    cross_validate_models,
    get_fraud_model,
    log_model_mlflow,
    save_model,
)
from src.preprocessing import load_cluster_data, load_fraud_data

RANDOM_STATE = 42


def _assign_cluster_labels(centroids: pd.DataFrame) -> dict[int, str]:
    """Attribue des profils métier à partir des centroïdes."""
    labels = {}
    used = set()
    ranking_specs = [
        ("Premium", centroids["Income"] + centroids["TotalSpend"]),
        ("Digital", centroids["NumWebPurchases"]),
        ("Promo-sensible", centroids["NumStorePurchases"] - centroids["Recency"]),
        ("Dormant", centroids["Recency"]),
    ]
    for name, score in ranking_specs:
        for cluster_id in score.sort_values(ascending=False).index:
            cid = int(cluster_id)
            if cid not in used:
                labels[cid] = name
                used.add(cid)
                break
    for cid in centroids.index:
        if int(cid) not in labels:
            labels[int(cid)] = f"Cluster {int(cid)}"
    return labels


def train_fraud_model(
    fraud_path: str | Path,
    models_dir: str | Path,
    log_mlflow: bool = True,
) -> dict:
    """Entraîne le meilleur modèle fraude (XGBoost) et exporte joblib + scaler."""
    models_dir = Path(models_dir)
    models_dir.mkdir(parents=True, exist_ok=True)

    df = load_fraud_data(str(fraud_path))
    X, y = prepare_fraud_matrix(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    smote = SMOTE(random_state=RANDOM_STATE, sampling_strategy=0.1)
    X_resampled, y_resampled = smote.fit_resample(X_train_scaled, y_train)

    cv_results = cross_validate_models(FRAUD_MODELS, X_train_scaled, y_train)
    best_name = max(cv_results, key=lambda k: cv_results[k]["mean"])
    model = get_fraud_model(best_name)
    model.fit(X_resampled, y_resampled)

    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    y_pred = (y_proba >= FRAUD_THRESHOLD).astype(int)
    metrics = {
        "model_name": best_name,
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_proba)),
        "f1": float(f1_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "cv_roc_auc_mean": float(cv_results[best_name]["mean"]),
    }

    save_model(model, models_dir / "fraud_model.joblib")
    save_model(scaler, models_dir / "fraud_scaler.joblib")

    metadata_path = models_dir / "metadata.json"
    existing = {}
    if metadata_path.exists():
        existing = json.loads(metadata_path.read_text(encoding="utf-8"))
    existing["fraud"] = metrics
    metadata_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    if log_mlflow:
        log_model_mlflow(
            model,
            "fraud_detection",
            {"model": best_name, "smote_ratio": 0.1, "threshold": FRAUD_THRESHOLD},
            {k: v for k, v in metrics.items() if k != "model_name"},
        )

    export_fraud_eda(fraud_path)
    export_fraud_models(cv_results)
    return {**metrics, "_cv_results": cv_results}


def train_cluster_model(
    cluster_path: str | Path,
    models_dir: str | Path,
    log_mlflow: bool = True,
    k_min: int = 2,
    k_max: int = 10,
) -> dict:
    """Entraîne K-Means sur les features API et exporte joblib + scaler."""
    models_dir = Path(models_dir)
    models_dir.mkdir(parents=True, exist_ok=True)

    df = load_cluster_data(str(cluster_path))
    X_df = prepare_cluster_matrix(df)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    silhouette_peak_k, silhouette_at_peak = k_min, -1.0
    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        if sil > silhouette_at_peak:
            silhouette_peak_k, silhouette_at_peak = k, sil

    best_k = TARGET_CLUSTER_K
    model = KMeans(n_clusters=best_k, random_state=RANDOM_STATE, n_init=10)
    labels = model.fit_predict(X_scaled)
    best_silhouette = float(silhouette_score(X_scaled, labels))
    db_score = float(davies_bouldin_score(X_scaled, labels))

    centroids = pd.DataFrame(
        scaler.inverse_transform(model.cluster_centers_), columns=CLUSTER_API_COLUMNS
    )
    cluster_labels = _assign_cluster_labels(centroids)

    save_model(model, models_dir / "cluster_model.joblib")
    save_model(scaler, models_dir / "cluster_scaler.joblib")

    metrics = {
        "model_name": "kmeans",
        "best_k": best_k,
        "silhouette_peak_k": silhouette_peak_k,
        "silhouette_at_peak_k": float(silhouette_at_peak),
        "silhouette": best_silhouette,
        "davies_bouldin": db_score,
        "cluster_labels": cluster_labels,
    }

    metadata_path = models_dir / "metadata.json"
    existing = {}
    if metadata_path.exists():
        existing = json.loads(metadata_path.read_text(encoding="utf-8"))
    existing["cluster"] = metrics
    metadata_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    if log_mlflow:
        log_model_mlflow(
            model,
            "customer_segmentation",
            {"algorithm": "kmeans", "n_clusters": best_k},
            {"silhouette": best_silhouette, "davies_bouldin": db_score},
        )

    export_cluster_eda(cluster_path, models_dir=models_dir)
    export_cluster_k_selection(cluster_path, k_min=k_min, k_max=k_max)
    export_cluster_summary(cluster_path, cluster_labels, best_k)
    return metrics


def train_all(
    fraud_path: str | Path,
    cluster_path: str | Path,
    models_dir: str | Path,
    log_mlflow: bool = True,
) -> dict:
    """Entraîne et exporte les deux modèles."""
    models_dir = Path(models_dir)
    fraud_raw = train_fraud_model(fraud_path, models_dir, log_mlflow=log_mlflow)
    cluster_metrics = train_cluster_model(cluster_path, models_dir, log_mlflow=log_mlflow)

    cv_results = fraud_raw.pop("_cv_results", None)
    fraud_metrics = fraud_raw

    metadata_path = models_dir / "metadata.json"
    existing = {}
    if metadata_path.exists():
        existing = json.loads(metadata_path.read_text(encoding="utf-8"))
    existing["fraud"] = fraud_metrics
    existing["cluster"] = cluster_metrics
    metadata_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    export_all_analytics(
        fraud_path,
        cluster_path,
        cv_results=cv_results,
        cluster_labels=cluster_metrics.get("cluster_labels"),
        best_k=cluster_metrics.get("best_k", 2),
    )
    export_all_charts(fraud_path, cluster_path, models_dir)

    return {"fraud": fraud_metrics, "cluster": cluster_metrics}
