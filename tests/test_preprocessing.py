"""Tests unitaires du prétraitement."""

import pandas as pd
import pytest

from src.preprocessing import (clean_customer_data, engineer_customer_features,
                               engineer_fraud_features, load_cluster_data)
from src.constants import CLUSTER_API_COLUMNS, FRAUD_FEATURE_COLUMNS
from src.training import prepare_cluster_matrix, prepare_fraud_matrix


@pytest.fixture
def fraud_sample():
    return pd.DataFrame(
        {
            "step": [1, 2],
            "type": ["PAYMENT", "TRANSFER"],
            "amount": [100.0, 500.0],
            "nameOrig": ["C1", "C2"],
            "oldbalanceOrg": [1000.0, 2000.0],
            "newbalanceOrig": [900.0, 1500.0],
            "nameDest": ["D1", "D2"],
            "oldbalanceDest": [0.0, 100.0],
            "newbalanceDest": [100.0, 600.0],
            "isFraud": [0, 1],
            "isFlaggedFraud": [0, 0],
        }
    )


@pytest.fixture
def cluster_sample():
    return pd.DataFrame(
        {
            "Year_Birth": [1980, 1990],
            "Income": [50000, 80000],
            "Kidhome": [1, 0],
            "Teenhome": [0, 1],
            "Recency": [10, 50],
            "NumWebPurchases": [5, 2],
            "NumStorePurchases": [3, 8],
            "MntWines": [100, 200],
            "MntFruits": [50, 30],
            "MntMeatProducts": [80, 120],
            "Education": ["Graduation", "PhD"],
            "Marital_Status": ["Married", "Single"],
        }
    )


def test_engineer_fraud_features(fraud_sample):
    df = engineer_fraud_features(fraud_sample)
    assert "error_balance_orig" in df.columns
    assert "orig_zeroed" in df.columns


def test_prepare_fraud_matrix(fraud_sample):
    X, y = prepare_fraud_matrix(fraud_sample)
    assert list(X.columns) == FRAUD_FEATURE_COLUMNS
    assert len(y) == 2


def test_prepare_cluster_matrix(cluster_sample):
    X = prepare_cluster_matrix(cluster_sample)
    assert list(X.columns) == CLUSTER_API_COLUMNS
    assert X.shape[0] == 2


def test_load_cluster_data_real():
    path = "data/raw/data_cluster.csv"
    df = load_cluster_data(path)
    assert "Income" in df.columns
    assert len(df) > 100


def test_clean_customer_data_removes_outliers():
    df = pd.DataFrame(
        {"Income": [50000, 700000], "Kidhome": [0, 0], "Teenhome": [0, 0]}
    )
    cleaned = clean_customer_data(df)
    assert len(cleaned) == 1


def test_engineer_customer_features(cluster_sample):
    df = engineer_customer_features(cluster_sample)
    assert "Age" in df.columns
    assert "TotalSpend" in df.columns
