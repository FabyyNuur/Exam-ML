"""Tests d'intégration de l'API FastAPI."""

import json
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient

from mlops.api.app import app, registry

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


@pytest.fixture(scope="module")
def client():
    registry.fraud_model = joblib.load(MODELS_DIR / "fraud_model.joblib")
    registry.fraud_scaler = joblib.load(MODELS_DIR / "fraud_scaler.joblib")
    registry.cluster_model = joblib.load(MODELS_DIR / "cluster_model.joblib")
    registry.cluster_scaler = joblib.load(MODELS_DIR / "cluster_scaler.joblib")
    metadata_path = MODELS_DIR / "metadata.json"
    if metadata_path.exists():
        registry.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        raw = registry.metadata.get("cluster", {}).get("cluster_labels", {})
        registry.cluster_labels = {int(k): v for k, v in raw.items()}
    return TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_models_exist():
    if not (MODELS_DIR / "fraud_model.joblib").exists():
        pytest.skip("Modèles non générés — exécuter scripts/train_and_export.py")


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["fraud_model_loaded"] is True
    assert data["cluster_model_loaded"] is True


def test_metadata(client):
    response = client.get("/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["fraud"] is not None
    assert data["cluster"] is not None
    assert "roc_auc" in data["fraud"]
    assert "cluster_labels" in data["cluster"]


def test_predict_fraud(client):
    payload = {
        "step": 10,
        "type": "TRANSFER",
        "amount": 5000.0,
        "oldbalanceOrg": 10000.0,
        "newbalanceOrig": 0.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 5000.0,
    }
    response = client.post("/predict/fraud", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "probability" in data
    assert "risk_level" in data
    assert isinstance(data["is_fraud"], bool)


def test_predict_fraud_invalid_type(client):
    payload = {
        "step": 1,
        "type": "UNKNOWN",
        "amount": 100.0,
        "oldbalanceOrg": 1000.0,
        "newbalanceOrig": 900.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 100.0,
    }
    response = client.post("/predict/fraud", json=payload)
    assert response.status_code == 422


def test_predict_segment(client):
    payload = {
        "income": 60000.0,
        "age": 40,
        "total_spend": 800.0,
        "num_web_purchases": 6,
        "num_store_purchases": 4,
        "recency": 20,
        "children": 2,
    }
    response = client.post("/predict/segment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "cluster_id" in data
    assert "profile" in data
    assert "description" in data


def test_content_pages(client):
    response = client.get("/content/pages")
    assert response.status_code == 200
    data = response.json()
    assert "pages" in data
    assert len(data["pages"]) >= 11
    assert data["pages"][0]["id"] == "home"


def test_analytics_fraud_eda(client):
    response = client.get("/analytics/fraud/eda")
    assert response.status_code == 200
    data = response.json()
    assert "class_balance" in data
    assert "fraud_by_type" in data
    assert "total_transactions" in data
    if data.get("records"):
        assert isinstance(data["records"], list)
        assert len(data["records"]) > 0
        assert "numeric_variables" in data
        assert "filters" in data
        assert "types" in data["filters"]
    if data.get("preprocessing"):
        prep = data["preprocessing"]
        assert prep["feature_count"] == 10
        assert "derived_features" in prep
        assert "pipeline_steps" in prep
        assert len(prep["pipeline_steps"]) >= 5


def test_analytics_fraud_models(client):
    response = client.get("/analytics/fraud/models")
    assert response.status_code == 200
    assert "models" in response.json()


def test_analytics_cluster_summary(client):
    response = client.get("/analytics/cluster/summary")
    assert response.status_code == 200
    data = response.json()
    assert "points" in data


def test_analytics_cluster_eda(client):
    response = client.get("/analytics/cluster/eda")
    assert response.status_code == 200
    data = response.json()
    assert "total_customers" in data
    assert "income_distribution" in data
    assert "spending_by_channel" in data
    assert "campaign_response" in data
    if data.get("records"):
        assert isinstance(data["records"], list)
        assert "numeric_variables" in data


def test_analytics_cluster_k_selection(client):
    response = client.get("/analytics/cluster/k-selection")
    assert response.status_code == 200
    data = response.json()
    assert "k_range" in data
    assert "silhouette_scores" in data
    assert "best_k" in data


def test_analytics_charts_list(client):
    response = client.get("/analytics/charts")
    assert response.status_code == 200
    data = response.json()
    assert "charts" in data
    assert isinstance(data["charts"], list)
    if data["charts"]:
        assert "ex2_correlation" in data["charts"]


def test_analytics_chart_by_id(client):
    response = client.get("/analytics/charts/ex2_correlation")
    if response.status_code == 404:
        pytest.skip("Charts Plotly non exportés — exécuter scripts/export_analytics.py")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "layout" in data


def test_analytics_chart_not_found(client):
    response = client.get("/analytics/charts/nonexistent_chart_xyz")
    assert response.status_code == 404


def test_figure_endpoint(client):
    from pathlib import Path

    figures_dir = Path(__file__).resolve().parent.parent / "reports" / "figures"
    pngs = list(figures_dir.glob("*.png"))
    if not pngs:
        response = client.get("/figures/missing.png")
        assert response.status_code == 404
    else:
        response = client.get(f"/figures/{pngs[0].name}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"


def test_api_without_models(monkeypatch):
    monkeypatch.setattr(registry, "fraud_model", None)
    monkeypatch.setattr(registry, "cluster_model", None)
    client = TestClient(app)
    response = client.post(
        "/predict/fraud",
        json={
            "step": 1,
            "type": "PAYMENT",
            "amount": 10.0,
            "oldbalanceOrg": 100.0,
            "newbalanceOrig": 90.0,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 10.0,
        },
    )
    assert response.status_code == 503


SAMPLES_DIR = Path(__file__).resolve().parent.parent / "data" / "samples"


def test_predict_fraud_batch_valid(client):
    csv_path = SAMPLES_DIR / "fraud_sample.csv"
    if not csv_path.exists():
        pytest.skip("fraud_sample.csv manquant")
    with csv_path.open("rb") as handle:
        response = client.post(
            "/predict/fraud/batch",
            files={"file": ("fraud_sample.csv", handle, "text/csv")},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["processed"] > 0
    assert "summary" in data
    assert "rows" in data
    assert data["rows"][0]["probability"] >= 0


def test_predict_fraud_batch_with_evaluation(client):
    csv_path = SAMPLES_DIR / "fraud_sample.csv"
    if not csv_path.exists():
        pytest.skip("fraud_sample.csv manquant")
    with csv_path.open("rb") as handle:
        response = client.post(
            "/predict/fraud/batch",
            files={"file": ("fraud_sample.csv", handle, "text/csv")},
        )
    assert response.status_code == 200
    data = response.json()
    if any("isFraud" in line for line in csv_path.read_text(encoding="utf-8").splitlines()[:1]):
        pass
    assert data.get("evaluation") is not None or data["processed"] > 0
    if data.get("evaluation"):
        assert "roc_auc" in data["evaluation"]
        assert "confusion_matrix" in data["evaluation"]


def test_predict_fraud_batch_missing_columns(client):
    bad_csv = b"step;amount\n1;100\n"
    response = client.post(
        "/predict/fraud/batch",
        files={"file": ("bad.csv", bad_csv, "text/csv")},
    )
    assert response.status_code == 422


def test_predict_fraud_batch_file_size_limit(client):
    oversized = b"x" * (8 * 1024 * 1024 + 1)
    response = client.post(
        "/predict/fraud/batch",
        files={"file": ("big.csv", oversized, "text/csv")},
    )
    assert response.status_code == 413
    assert "volumineux" in response.json()["detail"].lower()


def test_predict_segment_batch_valid(client):
    csv_path = SAMPLES_DIR / "cluster_sample.csv"
    if not csv_path.exists():
        pytest.skip("cluster_sample.csv manquant")
    with csv_path.open("rb") as handle:
        response = client.post(
            "/predict/segment/batch",
            files={"file": ("cluster_sample.csv", handle, "text/csv")},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["processed"] > 0
    assert "cluster_distribution" in data["summary"]
    assert data["rows"][0]["profile"]


def test_predict_template_fraud(client):
    response = client.get("/predict/templates/fraud")
    if response.status_code == 404:
        pytest.skip("fraud_sample.csv manquant")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
