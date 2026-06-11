"""Export des analytics JSON pour le dashboard React."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler

from src.constants import CLUSTER_API_COLUMNS, FRAUD_FEATURE_COLUMNS, TYPE_MAP
from src.preprocessing import (
    clean_customer_data,
    engineer_customer_features,
    engineer_fraud_features,
    load_cluster_data,
    load_fraud_data,
)


def _prepare_fraud_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    df = engineer_fraud_features(df)
    df["type_encoded"] = df["type"].map(TYPE_MAP)
    df = df.dropna(subset=["type_encoded", "isFraud"])
    X = df[FRAUD_FEATURE_COLUMNS].astype(float)
    y = df["isFraud"].astype(int)
    return X, y


def _prepare_cluster_matrix(df: pd.DataFrame) -> pd.DataFrame:
    df = clean_customer_data(df)
    df = engineer_customer_features(df)
    return df[CLUSTER_API_COLUMNS].astype(float)


ROOT = Path(__file__).resolve().parent.parent
ANALYTICS_DIR = ROOT / "reports" / "analytics"

MODEL_DISPLAY_NAMES = {
    "logistic_regression": "RégLog",
    "random_forest": "RanForest",
    "xgboost": "XGBoost",
    "lightgbm": "LightGBM",
}


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Analytics exporté : {path}")


def export_fraud_eda(fraud_path: str | Path) -> dict:
    """Calcule les stats EDA fraude pour Recharts."""
    df = load_fraud_data(str(fraud_path))
    fraud_col = "isFraud" if "isFraud" in df.columns else "isfraud"
    total = len(df)
    fraud_count = int(df[fraud_col].sum())
    legit_count = total - fraud_count

    fraud_df = df[df[fraud_col] == 1]
    fraud_by_type = (
        fraud_df.groupby("type").size().reset_index(name="fraud")
        if "type" in fraud_df.columns
        else pd.DataFrame(columns=["type", "fraud"])
    )

    payload = {
        "class_balance": [
            {
                "label": "Légitime",
                "count": legit_count,
                "pct": round(100 * legit_count / total, 2),
            },
            {
                "label": "Fraude",
                "count": fraud_count,
                "pct": round(100 * fraud_count / total, 2),
            },
        ],
        "fraud_by_type": [
            {"type": row["type"], "fraud": int(row["fraud"])} for _, row in fraud_by_type.iterrows()
        ],
        "total_transactions": total,
    }
    _write_json(ANALYTICS_DIR / "fraud_eda.json", payload)
    return payload


def export_fraud_models(cv_results: dict) -> dict:
    """Exporte la comparaison des modèles (ROC-AUC CV) pour Recharts."""
    models = []
    for name, scores in cv_results.items():
        roc = round(scores["mean"] * 100, 1)
        models.append(
            {
                "name": MODEL_DISPLAY_NAMES.get(name, name),
                "key": name,
                "roc": roc,
                "precision": roc,
                "f1": roc,
                "rappel": roc,
            }
        )
    payload = {"models": models}
    _write_json(ANALYTICS_DIR / "fraud_models.json", payload)
    return payload


def export_cluster_eda(cluster_path: str | Path) -> dict:
    """Calcule les stats EDA segmentation pour Recharts."""
    df = load_cluster_data(str(cluster_path))
    total = len(df)

    income_bins = [
        (0, 25_000, "0–25k"),
        (25_000, 50_000, "25–50k"),
        (50_000, 75_000, "50–75k"),
        (75_000, 100_000, "75–100k"),
        (100_000, 150_000, "100–150k"),
        (150_000, float("inf"), "150k+"),
    ]
    income_distribution = []
    if "Income" in df.columns:
        for low, high, label in income_bins:
            mask = (df["Income"] >= low) & (df["Income"] < high)
            count = int(mask.sum())
            income_distribution.append(
                {
                    "range": label,
                    "count": count,
                    "pct": round(100 * count / total, 1) if total else 0,
                }
            )

    spend_cols = [c for c in df.columns if c.startswith("Mnt")]
    spending_by_channel = [
        {
            "channel": col.replace("Mnt", ""),
            "total": round(float(df[col].sum()), 0),
            "avg": round(float(df[col].mean()), 1),
        }
        for col in spend_cols
    ]

    campaign_response = []
    if "Response" in df.columns:
        counts = df["Response"].value_counts()
        for label, count in counts.items():
            campaign_response.append(
                {
                    "label": str(label),
                    "count": int(count),
                    "pct": round(100 * count / total, 1) if total else 0,
                }
            )

    payload = {
        "total_customers": total,
        "income_distribution": income_distribution,
        "spending_by_channel": spending_by_channel,
        "campaign_response": campaign_response,
    }
    _write_json(ANALYTICS_DIR / "cluster_eda.json", payload)
    return payload


def export_cluster_k_selection(
    cluster_path: str | Path,
    k_min: int = 2,
    k_max: int = 10,
    random_state: int = 42,
) -> dict:
    """Exporte les courbes Elbow / Silhouette / Davies-Bouldin pour Recharts."""
    df = load_cluster_data(str(cluster_path))
    X_df = _prepare_cluster_matrix(df)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    k_range = list(range(k_min, k_max + 1))
    inertias, silhouette_scores, db_scores = [], [], []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(X_scaled)
        inertias.append(round(float(km.inertia_), 1))
        silhouette_scores.append(round(float(silhouette_score(X_scaled, labels)), 4))
        db_scores.append(round(float(davies_bouldin_score(X_scaled, labels)), 4))

    best_k = k_range[int(np.argmax(silhouette_scores))]
    payload = {
        "k_range": k_range,
        "inertias": inertias,
        "silhouette_scores": silhouette_scores,
        "davies_bouldin_scores": db_scores,
        "best_k": best_k,
        "best_silhouette": max(silhouette_scores),
    }
    _write_json(ANALYTICS_DIR / "cluster_k_selection.json", payload)
    return payload


def export_cluster_summary(
    cluster_path: str | Path,
    cluster_labels: dict[int, str],
    k: int,
) -> dict:
    """Exporte un échantillon PCA 2D pour le scatter Recharts."""
    df = load_cluster_data(str(cluster_path))
    X_df = _prepare_cluster_matrix(df)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = model.fit_predict(X_scaled)

    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)

    rng = np.random.default_rng(42)
    indices = rng.choice(len(coords), size=min(200, len(coords)), replace=False)

    points = []
    for idx in indices:
        cid = int(labels[idx])
        profile = cluster_labels.get(cid, f"Cluster {cid}")
        points.append(
            {
                "x": round(float(coords[idx, 0]), 2),
                "y": round(float(coords[idx, 1]), 2),
                "cluster": profile,
                "cluster_id": cid,
            }
        )

    payload = {
        "points": points,
        "explained_variance": [round(float(v) * 100, 1) for v in pca.explained_variance_ratio_],
    }
    _write_json(ANALYTICS_DIR / "cluster_summary.json", payload)
    return payload


def export_all_analytics(
    fraud_path: str | Path,
    cluster_path: str | Path,
    cv_results: dict | None = None,
    cluster_labels: dict[int, str] | None = None,
    best_k: int = 2,
) -> None:
    """Exporte tous les fichiers analytics."""
    export_fraud_eda(fraud_path)
    if cv_results:
        export_fraud_models(cv_results)
    export_cluster_eda(cluster_path)
    export_cluster_k_selection(cluster_path)
    if cluster_labels is not None:
        export_cluster_summary(cluster_path, cluster_labels, best_k)
