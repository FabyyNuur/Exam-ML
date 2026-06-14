"""Export des figures Plotly en JSON pour le dashboard React et PNG pour les rapports PDF."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

import plotly.graph_objects as go

from src.utils import apply_plotly_theme, save_figure

ROOT = Path(__file__).resolve().parent.parent.parent
ANALYTICS_DIR = ROOT / "reports" / "analytics"
PLOTLY_DIR = ANALYTICS_DIR / "plotly"
FIGURES_DIR = ROOT / "reports" / "figures"


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
    fraud_charts = fraud.all_charts(fraud_path, models_dir)
    for chart_id, builder in fraud_charts.items():
        try:
            export_plotly_chart(builder(), chart_id)
        except Exception as exc:
            print(f"Chart {chart_id} ignoré : {exc}")
            fig = go.Figure()
            fig.update_layout(title=f"{chart_id} — données indisponibles", height=400)
            export_plotly_chart(fig, chart_id)
        exported.append(chart_id)

    if "ex1_nn_training" not in exported:
        try:
            export_plotly_chart(fraud.build_nn_training(), "ex1_nn_training")
            exported.append("ex1_nn_training")
        except Exception as exc:
            print(f"Chart ex1_nn_training ignoré : {exc}")
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


def _placeholder_figure(chart_id: str, reason: str = "") -> go.Figure:
    fig = go.Figure()
    subtitle = f" — {reason}" if reason else ""
    fig.update_layout(
        title=f"{chart_id}{subtitle}",
        height=450,
        width=1000,
        annotations=[
            dict(
                text="Figure non disponible (données ou modèle manquant)",
                xref="paper",
                yref="paper",
                x=0.5,
                y=0.5,
                showarrow=False,
                font=dict(size=14, color="#64748B"),
            )
        ],
    )
    return fig


def _figure_dimensions(fig: go.Figure) -> tuple[int, int]:
    width = fig.layout.width
    height = fig.layout.height
    return int(width or 1000), int(height or 600)


def export_png_from_plotly_json(chart_id: str, output_path: str | Path) -> bool:
    """Exporte un PNG depuis le JSON Plotly pré-généré (fallback Render sans CSV fraude)."""
    try:
        payload = load_plotly_chart(chart_id)
    except FileNotFoundError:
        return False
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig = go.Figure(payload)
    width, height = _figure_dimensions(fig)
    save_figure(fig, str(output_path), width=width, height=height)
    return output_path.is_file()


def _export_missing_fraud_figures_from_json(
    out_dir: Path,
    builders: dict[str, Callable[[], go.Figure]],
    exported: list[str],
) -> None:
    """Complète les PNG ex1_* manquants à partir des JSON versionnés."""
    for chart_id in list_plotly_charts():
        if not chart_id.startswith("ex1_") or chart_id in builders:
            continue
        png_path = out_dir / f"{chart_id}.png"
        if png_path.exists():
            continue
        if export_png_from_plotly_json(chart_id, png_path):
            print(f"Figure PNG (JSON) exportée : {png_path}")
            exported.append(chart_id)


def _report_figure_builders(
    fraud_path: Path,
    cluster_path: Path,
    models_dir: Path,
) -> dict[str, Callable[[], go.Figure]]:
    from src.charts import fraud, segmentation

    builders: dict[str, Callable[[], go.Figure]] = {}
    if fraud_path.is_file():
        builders.update(fraud.all_charts(fraud_path, models_dir))
    if cluster_path.is_file():
        builders.update(segmentation.all_charts(cluster_path, models_dir))
    if "ex1_nn_training" not in builders:
        builders["ex1_nn_training"] = fraud.build_nn_training
    return builders


def generate_report_figure(
    chart_id: str,
    output_path: str | Path,
    fraud_path: str | Path,
    cluster_path: str | Path,
    models_dir: str | Path,
) -> bool:
    """Génère un PNG à la demande (rapports PDF /figures/*)."""
    output_path = Path(output_path)
    builders = _report_figure_builders(Path(fraud_path), Path(cluster_path), Path(models_dir))
    builder = builders.get(chart_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if builder is not None:
        try:
            fig = builder()
            width, height = _figure_dimensions(fig)
            save_figure(fig, str(output_path), width=width, height=height)
        except Exception as exc:
            fig = _placeholder_figure(chart_id, str(exc)[:80])
            save_figure(fig, str(output_path), width=1000, height=450)
        if output_path.is_file():
            return True
    return export_png_from_plotly_json(chart_id, output_path)


def export_report_figures(
    fraud_path: str | Path,
    cluster_path: str | Path,
    models_dir: str | Path,
    figures_dir: str | Path | None = None,
) -> list[str]:
    """Exporte les PNG référencés par les rapports PDF (/figures/*)."""
    out_dir = Path(figures_dir) if figures_dir else FIGURES_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    builders = _report_figure_builders(Path(fraud_path), Path(cluster_path), Path(models_dir))

    exported: list[str] = []
    for chart_id, builder in builders.items():
        png_path = out_dir / f"{chart_id}.png"
        try:
            fig = builder()
            width, height = _figure_dimensions(fig)
            save_figure(fig, str(png_path), width=width, height=height)
            print(f"Figure PNG exportée : {png_path}")
            exported.append(chart_id)
        except Exception as exc:
            print(f"Figure {chart_id} ignorée : {exc}")
            fig = _placeholder_figure(chart_id, str(exc)[:80])
            save_figure(fig, str(png_path), width=1000, height=450)
            exported.append(chart_id)

    if not Path(fraud_path).is_file():
        _export_missing_fraud_figures_from_json(out_dir, builders, exported)
    return exported
