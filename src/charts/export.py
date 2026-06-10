"""Export des figures Plotly en JSON pour le dashboard React."""

from __future__ import annotations

import json
from pathlib import Path

import plotly.graph_objects as go

from src.utils import apply_plotly_theme

ROOT = Path(__file__).resolve().parent.parent.parent
ANALYTICS_DIR = ROOT / "reports" / "analytics"
PLOTLY_DIR = ANALYTICS_DIR / "plotly"


def export_plotly_chart(fig: go.Figure, chart_id: str) -> None:
    """Sérialise une figure Plotly thématisée en JSON."""
    from src.charts.sampling import PLOTLY_JSON_WARN_BYTES

    PLOTLY_DIR.mkdir(parents=True, exist_ok=True)
    fig = apply_plotly_theme(fig)
    path = PLOTLY_DIR / f"{chart_id}.json"
    payload = fig.to_json()
    path.write_text(payload, encoding="utf-8")
    size = len(payload.encode("utf-8"))
    if size > PLOTLY_JSON_WARN_BYTES:
        print(f"ATTENTION: Chart {chart_id} JSON = {size // 1024} Ko — vérifier l'échantillonnage")
    print(f"Chart Plotly exporté : {path}")


def list_plotly_charts() -> list[str]:
    if not PLOTLY_DIR.exists():
        return []
    return sorted(p.stem for p in PLOTLY_DIR.glob("*.json"))


def load_plotly_chart(chart_id: str) -> dict:
    path = PLOTLY_DIR / f"{chart_id}.json"
    if not path.exists():
        raise FileNotFoundError(chart_id)
    return json.loads(path.read_text(encoding="utf-8"))


def export_all_charts(
    fraud_path: str | Path,
    cluster_path: str | Path,
    models_dir: str | Path,
) -> list[str]:
    """Génère tous les charts Plotly fraude + segmentation."""
    import plotly.graph_objects as go

    from src.charts import fraud, segmentation

    exported: list[str] = []
    for chart_id, builder in fraud.all_charts(fraud_path, models_dir).items():
        try:
            export_plotly_chart(builder(), chart_id)
        except Exception as exc:
            print(f"Chart {chart_id} ignoré : {exc}")
            fig = go.Figure()
            fig.update_layout(title=f"{chart_id} — données indisponibles", height=400)
            export_plotly_chart(fig, chart_id)
        exported.append(chart_id)
    for chart_id, builder in segmentation.all_charts(cluster_path, models_dir).items():
        try:
            export_plotly_chart(builder(), chart_id)
        except Exception as exc:
            print(f"Chart {chart_id} ignoré : {exc}")
            fig = go.Figure()
            fig.update_layout(title=f"{chart_id} — données indisponibles", height=400)
            export_plotly_chart(fig, chart_id)
        exported.append(chart_id)
    return exported
