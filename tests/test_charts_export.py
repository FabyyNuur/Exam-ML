"""Vérifie que les exports Plotly restent légers (< 500 Ko)."""

import json
from pathlib import Path

import pytest

MAX_JSON_BYTES = 500_000

PLOTLY_DIR = Path(__file__).resolve().parent.parent / "reports" / "analytics" / "plotly"


@pytest.fixture(scope="module", autouse=True)
def ensure_plotly_exports_exist():
    if not PLOTLY_DIR.exists() or not list(PLOTLY_DIR.glob("*.json")):
        pytest.skip("Exports Plotly absents — exécuter scripts/export_analytics.py")


def test_plotly_json_files_under_size_limit():
    oversized: list[str] = []
    for path in sorted(PLOTLY_DIR.glob("*.json")):
        size = path.stat().st_size
        if size > MAX_JSON_BYTES:
            oversized.append(f"{path.name} ({size // 1024} Ko)")
    assert not oversized, "JSON Plotly trop volumineux : " + ", ".join(oversized)


def test_plotly_json_files_are_valid():
    for path in sorted(PLOTLY_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        assert "data" in payload or "layout" in payload, f"{path.name} n'est pas une figure Plotly"


def test_export_png_from_plotly_json(tmp_path, monkeypatch):
    from src.charts import export as charts_export

    def fake_save(fig, path, width=1000, height=600):
        Path(path).write_bytes(b"png")

    monkeypatch.setattr(charts_export, "save_figure", fake_save)

    out = tmp_path / "ex1_class_distribution.png"
    ok = charts_export.export_png_from_plotly_json("ex1_class_distribution", out)
    assert ok is True
    assert out.is_file()


def test_generate_report_figure_falls_back_when_builder_missing(tmp_path, monkeypatch):
    from src.charts import export as charts_export

    def fake_save(fig, path, width=1000, height=600):
        Path(path).write_bytes(b"png")

    monkeypatch.setattr(charts_export, "save_figure", fake_save)
    monkeypatch.setattr(
        charts_export,
        "_report_figure_builders",
        lambda fraud_path, cluster_path, models_dir: {},
    )

    out = tmp_path / "ex1_class_distribution.png"
    ok = charts_export.generate_report_figure(
        "ex1_class_distribution",
        out,
        tmp_path / "missing.csv",
        tmp_path / "missing_cluster.csv",
        tmp_path / "models",
    )
    assert ok is True
    assert out.is_file()
