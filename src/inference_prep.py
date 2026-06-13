"""Préparation des features pour entraînement et inférence batch."""

from __future__ import annotations

import io
from typing import Optional

import pandas as pd

from src.constants import CLUSTER_API_COLUMNS, FRAUD_FEATURE_COLUMNS, TYPE_MAP
from src.preprocessing import (
    clean_customer_data,
    engineer_customer_features,
    engineer_fraud_features,
)

FRAUD_REQUIRED_COLUMNS = [
    "step",
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
]

CLUSTER_SOURCE_HINTS = [
    "Year_Birth",
    "Age",
    "Income",
    "Kidhome",
    "Teenhome",
    "Recency",
    "NumWebPurchases",
    "NumStorePurchases",
]


def _load_csv_from_bytes(content: bytes, sep_primary: str, sep_fallback: str | None = None) -> pd.DataFrame:
    last_error: Exception | None = None
    for encoding in ("utf-8", "latin-1"):
        try:
            buf = io.BytesIO(content)
            df = pd.read_csv(buf, sep=sep_primary, encoding=encoding)
            if df.shape[1] == 1 and sep_fallback:
                buf = io.BytesIO(content)
                df = pd.read_csv(buf, sep=sep_fallback, encoding=encoding)
            if df.shape[1] == 1 and sep_primary != ",":
                buf = io.BytesIO(content)
                df = pd.read_csv(buf, encoding=encoding)
            return df
        except UnicodeDecodeError as exc:
            last_error = exc
            continue
    raise ValueError("Encodage non supporté — utilisez UTF-8 ou Latin-1") from last_error


def load_fraud_from_bytes(content: bytes) -> pd.DataFrame:
    return _load_csv_from_bytes(content, sep_primary=";", sep_fallback=",")


def load_cluster_from_bytes(content: bytes) -> pd.DataFrame:
    last_error: Exception | None = None
    for encoding in ("utf-8", "latin-1"):
        best_df: pd.DataFrame | None = None
        for sep in ("\t", ";", ","):
            try:
                buf = io.BytesIO(content)
                df = pd.read_csv(buf, sep=sep, encoding=encoding, on_bad_lines="skip")
                if best_df is None or df.shape[1] > best_df.shape[1]:
                    best_df = df
            except UnicodeDecodeError as exc:
                last_error = exc
                break
            except pd.errors.ParserError:
                continue
        if best_df is not None and best_df.shape[1] > 1:
            return best_df
    raise ValueError("Encodage ou format CSV non supporté") from last_error


def validate_fraud_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in FRAUD_REQUIRED_COLUMNS if c not in df.columns]


def validate_cluster_columns(df: pd.DataFrame) -> list[str]:
    df = df.copy()
    if "Age" not in df.columns and "Year_Birth" not in df.columns:
        return ["Year_Birth ou Age"]
    spend_cols = [c for c in df.columns if c.startswith("Mnt")]
    if not spend_cols and "TotalSpend" not in df.columns:
        return ["colonnes Mnt* ou TotalSpend"]
    missing = []
    for col in ("Income", "Recency", "NumWebPurchases", "NumStorePurchases"):
        if col not in df.columns:
            missing.append(col)
    if "Children" not in df.columns and not (
        "Kidhome" in df.columns and "Teenhome" in df.columns
    ):
        missing.append("Children ou Kidhome+Teenhome")
    return missing


def prepare_fraud_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Prépare X/y fraude avec encodage aligné sur l'API FastAPI (entraînement)."""
    X, y, _, _ = _prepare_fraud_features(df, require_label=True)
    if y is None:
        raise ValueError("Colonne isFraud requise pour l'entraînement")
    return X, y


def prepare_cluster_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Prépare les features segmentation alignées sur l'API /predict/segment."""
    df = clean_customer_data(df)
    df = engineer_customer_features(df)
    missing = [c for c in CLUSTER_API_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes pour le clustering : {missing}")
    return df[CLUSTER_API_COLUMNS].astype(float)


def prepare_fraud_inference(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, Optional[pd.Series], list[int], list[str]]:
    """Prépare X pour inférence batch ; y optionnel si isFraud présent."""
    return _prepare_fraud_features(df, require_label=False)


def prepare_cluster_inference(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, list[int], list[str]]:
    """Prépare X pour inférence batch segmentation."""
    errors: list[str] = []
    row_indices: list[int] = list(range(len(df)))

    try:
        X = prepare_cluster_matrix(df)
    except ValueError as exc:
        raise ValueError(str(exc)) from exc

    if len(X) < len(df):
        dropped = len(df) - len(X)
        errors.append(f"{dropped} ligne(s) supprimée(s) lors du nettoyage (outliers Income)")

    row_indices = list(X.index)
    return X, row_indices, errors


def _prepare_fraud_features(
    df: pd.DataFrame,
    require_label: bool,
) -> tuple[pd.DataFrame, Optional[pd.Series], list[int], list[str]]:
    errors: list[str] = []
    work = engineer_fraud_features(df.copy())
    work["type_encoded"] = work["type"].map(TYPE_MAP)

    invalid_type = work["type_encoded"].isna()
    for idx in work.index[invalid_type]:
        errors.append(f"Ligne {int(idx) + 2}: type invalide « {work.at[idx, 'type']} »")

    work = work[~invalid_type].copy()
    if work.empty:
        return (
            pd.DataFrame(columns=FRAUD_FEATURE_COLUMNS),
            None,
            [],
            errors or ["Aucune ligne valide après validation"],
        )

    y: Optional[pd.Series] = None
    if "isFraud" in work.columns:
        if require_label:
            work = work.dropna(subset=["isFraud"])
        y = work["isFraud"].astype(int)
    elif require_label:
        raise ValueError("Colonne isFraud requise pour l'entraînement")

    X = work[FRAUD_FEATURE_COLUMNS].astype(float)
    row_indices = list(work.index)
    return X, y, row_indices, errors
