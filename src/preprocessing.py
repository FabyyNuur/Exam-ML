"""Fonctions de prétraitement partagées entre les deux exercices."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer


# ─── Exercice 1 : Détection de fraude ────────────────────────────────────────

def load_fraud_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep=";")
    if df.shape[1] == 1:
        df = pd.read_csv(path)
    return df


def engineer_fraud_features(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering spécifique aux transactions financières."""
    df = df.copy()
    # Erreur de solde émetteur / destinataire
    df["error_balance_orig"] = df["newbalanceOrig"] - (df["oldbalanceOrg"] - df["amount"])
    df["error_balance_dest"] = df["newbalanceDest"] - (df["oldbalanceDest"] + df["amount"])
    # Indicateur de compte vidé
    df["orig_zeroed"] = ((df["oldbalanceOrg"] > 0) & (df["newbalanceOrig"] == 0)).astype(int)
    return df


def encode_transaction_type(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = pd.get_dummies(df, columns=["type"], drop_first=True)
    return df


# ─── Exercice 2 : Segmentation client ───────────────────────────────────────

def load_cluster_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t", on_bad_lines="skip")
    if df.shape[1] == 1:
        df = pd.read_csv(path, sep=";", on_bad_lines="skip")
    return df


def clean_customer_data(df: pd.DataFrame) -> pd.DataFrame:
    """Nettoyage des données clients : outliers, modalités aberrantes, manquants."""
    df = df.copy()

    # Supprimer les outliers Income (> 600 000 ou valeurs aberrantes)
    if "Income" in df.columns:
        df = df[df["Income"] < 600_000]

    # Corriger les modalités aberrantes de Marital_Status
    if "Marital_Status" in df.columns:
        replace_map = {"Alone": "Single", "Absurd": np.nan, "YOLO": np.nan}
        df["Marital_Status"] = df["Marital_Status"].replace(replace_map)

    # Imputer les valeurs manquantes numériques par la médiane
    num_cols = df.select_dtypes(include=np.number).columns
    imputer = SimpleImputer(strategy="median")
    df[num_cols] = imputer.fit_transform(df[num_cols])

    return df


def engineer_customer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Features dérivées utiles pour la segmentation."""
    df = df.copy()
    if "Year_Birth" in df.columns:
        df["Age"] = 2024 - df["Year_Birth"]
    if all(c in df.columns for c in ["Kidhome", "Teenhome"]):
        df["Children"] = df["Kidhome"] + df["Teenhome"]
    spend_cols = [c for c in df.columns if c.startswith("Mnt")]
    if spend_cols:
        df["TotalSpend"] = df[spend_cols].sum(axis=1)
    purchase_cols = [c for c in df.columns if "Purchases" in c]
    if purchase_cols:
        df["TotalPurchases"] = df[purchase_cols].sum(axis=1)
    return df


def encode_categorical(df: pd.DataFrame, cat_cols: list) -> pd.DataFrame:
    df = df.copy()
    for col in cat_cols:
        if col in df.columns:
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))
    return df


def scale_features(X: pd.DataFrame) -> tuple[np.ndarray, StandardScaler]:
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, scaler
