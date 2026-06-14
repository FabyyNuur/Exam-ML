"""Export des analytics JSON pour le dashboard React."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src.constants import (
    CLUSTER_API_COLUMNS,
    DEFAULT_CLUSTER_LABELS,
    FRAUD_FEATURE_COLUMNS,
    TARGET_CLUSTER_K,
    TYPE_MAP,
)
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
    """Calcule les stats EDA fraude pour Recharts + explorateur interactif."""
    df_raw = load_fraud_data(str(fraud_path))
    fraud_col = "isFraud" if "isFraud" in df_raw.columns else "isfraud"
    total = len(df_raw)
    fraud_count = int(df_raw[fraud_col].sum())
    legit_count = total - fraud_count

    df = engineer_fraud_features(df_raw)
    df["is_fraud"] = df[fraud_col].astype(int)

    fraud_df = df[df["is_fraud"] == 1]
    fraud_by_type = (
        fraud_df.groupby("type").size().reset_index(name="fraud")
        if "type" in fraud_df.columns
        else pd.DataFrame(columns=["type", "fraud"])
    )

    legit_df = df[df["is_fraud"] == 0]
    rng = np.random.default_rng(42)
    legit_sample_size = min(5000, len(legit_df))
    legit_indices = (
        rng.choice(legit_df.index.to_numpy(), size=legit_sample_size, replace=False)
        if legit_sample_size > 0
        else np.array([], dtype=int)
    )
    sample_df = pd.concat([fraud_df, df.loc[legit_indices]]).reset_index(drop=True)

    records = []
    for _, row in sample_df.iterrows():
        records.append(
            {
                "amount": round(float(row["amount"]), 2),
                "step": int(row["step"]),
                "oldbalance_org": round(float(row["oldbalanceOrg"]), 2),
                "newbalance_orig": round(float(row["newbalanceOrig"]), 2),
                "oldbalance_dest": round(float(row["oldbalanceDest"]), 2),
                "newbalance_dest": round(float(row["newbalanceDest"]), 2),
                "error_balance_orig": round(float(row["error_balance_orig"]), 2),
                "error_balance_dest": round(float(row["error_balance_dest"]), 2),
                "orig_zeroed": int(row["orig_zeroed"]),
                "type": str(row["type"]),
                "is_fraud": int(row["is_fraud"]),
            }
        )

    def _mean_for(group: pd.DataFrame, col: str) -> float:
        return round(float(group[col].mean()), 2) if len(group) else 0.0

    def _pct_zeroed(group: pd.DataFrame) -> float:
        return round(100 * float(group["orig_zeroed"].mean()), 2) if len(group) else 0.0

    derived_features = [
        {
            "name": "error_balance_orig",
            "label": "Erreur solde émetteur",
            "fraud_mean": _mean_for(fraud_df, "error_balance_orig"),
            "legit_mean": _mean_for(legit_df, "error_balance_orig"),
            "description": "newbalanceOrig − (oldbalanceOrg − amount)",
        },
        {
            "name": "error_balance_dest",
            "label": "Erreur solde destinataire",
            "fraud_mean": _mean_for(fraud_df, "error_balance_dest"),
            "legit_mean": _mean_for(legit_df, "error_balance_dest"),
            "description": "newbalanceDest − (oldbalanceDest + amount)",
        },
        {
            "name": "orig_zeroed",
            "label": "Compte émetteur vidé",
            "fraud_mean": _pct_zeroed(fraud_df),
            "legit_mean": _pct_zeroed(legit_df),
            "description": "% de transactions où oldbalanceOrg > 0 et newbalanceOrig = 0",
        },
        {
            "name": "amount",
            "label": "Montant",
            "fraud_mean": _mean_for(fraud_df, "amount"),
            "legit_mean": _mean_for(legit_df, "amount"),
            "description": "Montant de la transaction",
        },
    ]

    types = sorted(df["type"].dropna().unique().tolist()) if "type" in df.columns else []

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
        "records": records,
        "numeric_variables": [
            {"key": "amount", "label": "Montant (€)"},
            {"key": "step", "label": "Step (temps)"},
            {"key": "oldbalance_org", "label": "Solde émetteur (avant)"},
            {"key": "newbalance_orig", "label": "Solde émetteur (après)"},
            {"key": "oldbalance_dest", "label": "Solde destinataire (avant)"},
            {"key": "newbalance_dest", "label": "Solde destinataire (après)"},
            {"key": "error_balance_orig", "label": "Erreur solde émetteur"},
            {"key": "error_balance_dest", "label": "Erreur solde destinataire"},
        ],
        "filters": {
            "types": types,
            "is_fraud": [
                {"value": "all", "label": "Toutes classes"},
                {"value": "1", "label": "Fraude uniquement"},
                {"value": "0", "label": "Légitime uniquement"},
            ],
            "orig_zeroed": [
                {"value": "all", "label": "Tous comptes"},
                {"value": "1", "label": "Compte émetteur vidé"},
                {"value": "0", "label": "Compte non vidé"},
            ],
        },
        "preprocessing": {
            "feature_count": len(FRAUD_FEATURE_COLUMNS),
            "type_encoding": {k: v for k, v in TYPE_MAP.items()},
            "derived_features": derived_features,
            "pipeline_steps": [
                "Feature engineering (error_balance_orig, error_balance_dest, orig_zeroed)",
                "Encodage ordinal du type (PAYMENT=0 … CASH_IN=4)",
                "Standardisation StandardScaler sur les 10 features",
                "Split train/test 80/20 stratifié sur isFraud",
                "SMOTE sur le train uniquement (sampling_strategy=0.1)",
            ],
            "amount_fraud_mean": _mean_for(fraud_df, "amount"),
            "amount_legit_mean": _mean_for(legit_df, "amount"),
        },
    }
    _write_json(ANALYTICS_DIR / "fraud_eda.json", payload)
    return payload


FRAUD_SMOTE_FALLBACK = {
    "metrics": [
        {"label": "Normal avant SMOTE", "count": 837_946},
        {"label": "Fraude avant SMOTE", "count": 914},
        {"label": "Normal après SMOTE", "count": 837_946},
        {"label": "Fraude après SMOTE", "count": 83_794},
    ],
    "sampling_strategy": 0.1,
    "insight": (
        "SMOTE porte la classe fraude à 10 % du volume normal pour stabiliser l'apprentissage."
    ),
}


def export_fraud_smote(fraud_path: str | Path | None = None) -> dict:
    """Exporte les effectifs avant/après SMOTE (notebook ex1)."""
    if fraud_path is not None and Path(fraud_path).is_file():
        df = load_fraud_data(str(fraud_path))
        X, y = _prepare_fraud_matrix(df)
        X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        smote = SMOTE(random_state=42, sampling_strategy=0.1)
        _, y_resampled = smote.fit_resample(X_train_scaled, y_train)
        before = y_train.value_counts().to_dict()
        after = pd.Series(y_resampled).value_counts().to_dict()
        payload = {
            "metrics": [
                {"label": "Normal avant SMOTE", "count": int(before.get(0, 0))},
                {"label": "Fraude avant SMOTE", "count": int(before.get(1, 0))},
                {"label": "Normal après SMOTE", "count": int(after.get(0, 0))},
                {"label": "Fraude après SMOTE", "count": int(after.get(1, 0))},
            ],
            "sampling_strategy": 0.1,
            "insight": FRAUD_SMOTE_FALLBACK["insight"],
        }
    else:
        payload = dict(FRAUD_SMOTE_FALLBACK)

    _write_json(ANALYTICS_DIR / "fraud_smote.json", payload)
    return payload


def export_fraud_models(cv_results: dict) -> dict:
    """Exporte la comparaison des modèles (ROC-AUC CV) pour Recharts."""
    models = []
    for name, scores in cv_results.items():
        roc = round(scores["mean"] * 100, 1)
        cv_std = round(scores["std"] * 100, 1)
        models.append(
            {
                "name": MODEL_DISPLAY_NAMES.get(name, name),
                "key": name,
                "roc": roc,
                "cv_std": cv_std,
            }
        )
    payload = {"models": models}
    _write_json(ANALYTICS_DIR / "fraud_models.json", payload)
    return payload


def _cluster_labels_from_metadata(models_dir: Path) -> tuple[int, dict[int, str]]:
    """Charge k optimal et libellés clusters depuis metadata.json."""
    metadata_path = models_dir / "metadata.json"
    best_k = TARGET_CLUSTER_K
    cluster_labels: dict[int, str] = dict(DEFAULT_CLUSTER_LABELS)
    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        cluster_meta = meta.get("cluster", {})
        best_k = int(cluster_meta.get("best_k", TARGET_CLUSTER_K))
        raw = cluster_meta.get("cluster_labels", cluster_labels)
        cluster_labels = {int(k): v for k, v in raw.items()}
    return best_k, cluster_labels


def export_cluster_eda(
    cluster_path: str | Path,
    models_dir: str | Path | None = None,
) -> dict:
    """Calcule les stats EDA segmentation pour Recharts + explorateur interactif."""
    models_path = Path(models_dir) if models_dir else ROOT / "models"
    df_raw = load_cluster_data(str(cluster_path))
    df_clean = clean_customer_data(df_raw)
    df = engineer_customer_features(df_clean)
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

    best_k, cluster_labels = _cluster_labels_from_metadata(models_path)
    X_df = _prepare_cluster_matrix(df_raw)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)
    km = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    cluster_ids = km.fit_predict(X_scaled)

    spend_key_map = {
        "MntWines": "wines",
        "MntFruits": "fruits",
        "MntMeatProducts": "meat",
        "MntFishProducts": "fish",
        "MntSweetProducts": "sweet",
        "MntGoldProds": "gold",
    }
    records = []
    for idx in range(len(df)):
        row = df.iloc[idx]
        rec: dict = {
            "age": int(row["Age"]) if "Age" in row else 0,
            "income": round(float(row["Income"]), 0),
            "total_spend": round(float(row.get("TotalSpend", 0)), 0),
            "children": int(row.get("Children", 0)),
            "recency": int(row.get("Recency", 0)),
            "web_purchases": int(row.get("NumWebPurchases", 0)),
            "store_purchases": int(row.get("NumStorePurchases", 0)),
            "response": int(row["Response"]) if "Response" in row else 0,
            "education": str(row.get("Education", "Inconnu")),
            "marital_status": str(row.get("Marital_Status", "Inconnu")),
            "cluster": cluster_labels.get(int(cluster_ids[idx]), f"Cluster {cluster_ids[idx]}"),
        }
        for col, key in spend_key_map.items():
            if col in row:
                rec[key] = round(float(row[col]), 0)
        records.append(rec)

    educations = sorted({r["education"] for r in records if r["education"]})
    marital = sorted({r["marital_status"] for r in records if r["marital_status"]})
    clusters = sorted({r["cluster"] for r in records})

    payload = {
        "total_customers": total,
        "income_distribution": income_distribution,
        "spending_by_channel": spending_by_channel,
        "campaign_response": campaign_response,
        "records": records,
        "numeric_variables": [
            {"key": "age", "label": "Âge"},
            {"key": "income", "label": "Revenu (€)"},
            {"key": "total_spend", "label": "Dépenses totales (€)"},
            {"key": "recency", "label": "Récence (jours)"},
            {"key": "web_purchases", "label": "Achats web"},
            {"key": "store_purchases", "label": "Achats magasin"},
            {"key": "children", "label": "Enfants"},
            {"key": "wines", "label": "Dépenses vins (€)"},
            {"key": "meat", "label": "Dépenses viandes (€)"},
            {"key": "fish", "label": "Dépenses poissons (€)"},
        ],
        "filters": {
            "education": educations,
            "marital_status": marital,
            "clusters": clusters,
            "response": [
                {"value": "all", "label": "Toutes réponses"},
                {"value": "1", "label": "Accepté campagne"},
                {"value": "0", "label": "Refusé campagne"},
            ],
        },
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
    """Exporte tous les fichiers analytics (ignore les jeux de données absents)."""
    fraud_path = Path(fraud_path)
    cluster_path = Path(cluster_path)

    if fraud_path.is_file():
        export_fraud_eda(fraud_path)
        export_fraud_smote(fraud_path)
        if cv_results:
            export_fraud_models(cv_results)
    else:
        print(f"Analytics fraude ignorés : {fraud_path} absent")
        export_fraud_smote()

    if cluster_path.is_file():
        export_cluster_eda(cluster_path, models_dir=ROOT / "models")
        export_cluster_k_selection(cluster_path)
        if cluster_labels is not None:
            export_cluster_summary(cluster_path, cluster_labels, best_k)
    else:
        print(f"Analytics cluster ignorés : {cluster_path} absent")
