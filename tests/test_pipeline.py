"""Tests du pipeline MLOps."""

from pathlib import Path

import pandas as pd
import pytest

from mlops.pipeline import (CLUSTER_REQUIRED_COLUMNS, FRAUD_REQUIRED_COLUMNS,
                            validate_schema)

ROOT = Path(__file__).resolve().parent.parent


def test_validate_fraud_schema():
    path = ROOT / "data" / "raw" / "detection_fraude.csv"
    if not path.exists():
        pytest.skip("detection_fraude.csv absent")
    df = validate_schema(path, FRAUD_REQUIRED_COLUMNS, "fraude")
    assert isinstance(df, pd.DataFrame)
    assert "isFraud" in df.columns


def test_validate_cluster_schema():
    path = ROOT / "data" / "raw" / "data_cluster.csv"
    df = validate_schema(path, CLUSTER_REQUIRED_COLUMNS, "clustering")
    assert isinstance(df, pd.DataFrame)
    assert "Income" in df.columns


def test_validate_schema_missing_columns(tmp_path):
    bad_csv = tmp_path / "bad.csv"
    bad_csv.write_text("a,b\n1,2\n", encoding="utf-8")
    with pytest.raises(ValueError, match="colonnes manquantes"):
        validate_schema(bad_csv, ["a", "c"], "test")
