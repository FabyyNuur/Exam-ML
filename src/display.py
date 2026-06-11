"""Composants HTML pour un affichage notebook cohérent (style dashboard moderne)."""

from __future__ import annotations

import html
from typing import Any, Optional

import pandas as pd
from IPython.display import HTML, display

from src.constants import COLORS

THEME = {
    "primary": COLORS["primary"],
    "secondary": COLORS["secondary"],
    "accent": COLORS["accent"],
    "neutral": COLORS["neutral"],
    "success": COLORS["success"],
    "warning": COLORS["warning"],
    "bg": "#F8FAFC",
    "card": "#FFFFFF",
    "text": "#1E293B",
    "muted": "#64748B",
}

_BADGE_STYLES = {
    "stable": ("#ECFDF5", THEME["success"]),
    "success": ("#ECFDF5", THEME["success"]),
    "warning": ("#FFFBEB", THEME["warning"]),
    "drift": ("#FEF2F2", THEME["secondary"]),
    "danger": ("#FEF2F2", THEME["secondary"]),
    "info": ("#EFF6FF", THEME["primary"]),
    "default": ("#F1F5F9", THEME["neutral"]),
}

_THEME_INITIALIZED = False

_CSS = f"""
<style>
.ml-root {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: {THEME["text"]};
    line-height: 1.55;
}}
.ml-hero {{
    background: linear-gradient(135deg, {THEME["primary"]} 0%, #1E3A5F 100%);
    color: white;
    padding: 1.75rem 2rem;
    border-radius: 14px;
    margin: 0.5rem 0 1.5rem 0;
    box-shadow: 0 8px 24px rgba(30, 58, 95, 0.22);
    position: relative;
    overflow: hidden;
}}
.ml-hero::before {{
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12) 0%, transparent 55%);
    pointer-events: none;
}}
.ml-hero h1 {{
    margin: 0 0 0.6rem 0;
    font-size: 1.65rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    position: relative;
}}
.ml-hero .ml-objective {{
    opacity: 0.95;
    margin-bottom: 0.85rem;
    font-size: 0.95rem;
    position: relative;
}}
.ml-hero ol {{
    margin: 0;
    padding-left: 1.25rem;
    opacity: 0.92;
    font-size: 0.9rem;
    position: relative;
}}
.ml-hero li {{ margin-bottom: 0.25rem; }}
.ml-section {{
    margin: 1.75rem 0 1rem 0;
    padding: 0.5rem 0 0.5rem 1rem;
    border-left: 4px solid {THEME["primary"]};
    background: none;
}}
.ml-section h2 {{
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: {THEME["primary"]};
    letter-spacing: -0.01em;
}}
.ml-section .ml-subtitle {{
    color: {THEME["muted"]};
    font-size: 0.88rem;
    margin-top: 0.2rem;
}}
.ml-card {{
    background: {THEME["card"]};
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 1.1rem 1.25rem;
    margin: 0.85rem 0;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}}
.ml-card.insight {{ border-left: 4px solid {THEME["accent"]}; }}
.ml-card.info {{ border-left: 4px solid {THEME["primary"]}; }}
.ml-card.warning {{ border-left: 4px solid {THEME["warning"]}; }}
.ml-card.success {{ border-left: 4px solid {THEME["success"]}; }}
.ml-card .ml-label {{
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: {THEME["muted"]};
    margin-bottom: 0.4rem;
}}
.ml-metrics {{
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
    margin: 0.85rem 0;
}}
.ml-metric {{
    flex: 1 1 150px;
    background: {THEME["card"]};
    border: 1px solid #E2E8F0;
    border-top: 3px solid {THEME["primary"]};
    border-radius: 12px;
    padding: 1rem 1.1rem;
    text-align: center;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}}
.ml-metric:hover {{
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}}
.ml-metric .ml-value {{
    font-size: 1.45rem;
    font-weight: 700;
    color: {THEME["primary"]};
    letter-spacing: -0.02em;
}}
.ml-metric .ml-key {{
    font-size: 0.76rem;
    font-weight: 500;
    color: {THEME["muted"]};
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}}
.ml-badge {{
    display: inline-block;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
}}
.ml-findings {{ margin: 0; padding-left: 1.25rem; }}
.ml-findings li {{ margin-bottom: 0.45rem; }}
.ml-arch {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin: 0.75rem 0;
}}
.ml-arch-step {{
    background: {THEME["bg"]};
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 0.55rem 0.9rem;
    font-size: 0.84rem;
    font-weight: 500;
}}
.ml-arch-arrow {{ color: {THEME["muted"]}; font-weight: bold; }}
.ml-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
    margin: 0.5rem 0;
}}
.ml-table th {{
    background: {THEME["bg"]};
    color: {THEME["primary"]};
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 2px solid #E2E8F0;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}}
.ml-table td {{
    padding: 0.55rem 0.8rem;
    border-bottom: 1px solid #F1F5F9;
}}
.ml-table tr:nth-child(even) td {{ background: #FAFBFC; }}
.ml-table tr:hover td {{ background: #F1F5F9; }}
.ml-chart-card {{
    background: {THEME["card"]};
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 0.75rem;
    margin: 1rem 0 1.25rem 0;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
    overflow: hidden;
}}
.ml-chart-inner {{
    border-radius: 8px;
    overflow: hidden;
}}
.ml-chart-inner .plotly-graph-div {{
    margin: 0 auto;
}}
</style>
"""


def _esc(text: Any) -> str:
    return html.escape(str(text))


def init_notebook_theme() -> None:
    """Injecte le CSS global (une fois par session)."""
    global _THEME_INITIALIZED
    if not _THEME_INITIALIZED:
        display(HTML(_CSS))
        _THEME_INITIALIZED = True


def show_hero(title: str, objective: str, plan_items: list[str]) -> None:
    init_notebook_theme()
    items = "".join(f"<li>{_esc(item)}</li>" for item in plan_items)
    display(
        HTML(
            f"""
    <div class="ml-root ml-hero">
        <h1>{_esc(title)}</h1>
        <div class="ml-objective"><strong>Objectif :</strong> {_esc(objective)}</div>
        <ol>{items}</ol>
    </div>
    """
        )
    )


def show_section(title: str, subtitle: Optional[str] = None) -> None:
    init_notebook_theme()
    sub = f'<div class="ml-subtitle">{_esc(subtitle)}</div>' if subtitle else ""
    display(
        HTML(
            f"""
    <div class="ml-root ml-section">
        <h2>{_esc(title)}</h2>
        {sub}
    </div>
    """
        )
    )


def _show_card(text: str, label: str, css_class: str) -> None:
    init_notebook_theme()
    display(
        HTML(
            f"""
    <div class="ml-root ml-card {css_class}">
        <div class="ml-label">{_esc(label)}</div>
        <div>{text}</div>
    </div>
    """
        )
    )


def show_insight(text: str) -> None:
    _show_card(_esc(text), "Interprétation", "insight")


def show_info(text: str) -> None:
    _show_card(_esc(text), "Information", "info")


def show_warning(text: str) -> None:
    _show_card(_esc(text), "Attention", "warning")


def show_success(text: str) -> None:
    _show_card(_esc(text), "Résultat", "success")


def show_metrics_row(metrics: dict[str, Any]) -> None:
    init_notebook_theme()
    tiles = "".join(
        f'<div class="ml-metric"><div class="ml-value">{_esc(v)}</div>'
        f'<div class="ml-key">{_esc(k)}</div></div>'
        for k, v in metrics.items()
    )
    display(HTML(f'<div class="ml-root ml-metrics">{tiles}</div>'))


def show_badge(label: str, status: str = "default") -> None:
    init_notebook_theme()
    bg, color = _BADGE_STYLES.get(status, _BADGE_STYLES["default"])
    display(
        HTML(f'<span class="ml-badge" style="background:{bg};color:{color};">{_esc(label)}</span>')
    )


def show_findings_list(items: list[str], title: str = "Points clés") -> None:
    init_notebook_theme()
    lis = "".join(f"<li>{_esc(item)}</li>" for item in items)
    display(
        HTML(
            f"""
    <div class="ml-root ml-card insight">
        <div class="ml-label">{_esc(title)}</div>
        <ul class="ml-findings">{lis}</ul>
    </div>
    """
        )
    )


def show_architecture_card(title: str, steps: list[str]) -> None:
    init_notebook_theme()
    parts = []
    for i, step in enumerate(steps):
        if i > 0:
            parts.append('<span class="ml-arch-arrow">→</span>')
        parts.append(f'<span class="ml-arch-step">{_esc(step)}</span>')
    flow = "".join(parts)
    display(
        HTML(
            f"""
    <div class="ml-root ml-card info">
        <div class="ml-label">{_esc(title)}</div>
        <div class="ml-arch">{flow}</div>
    </div>
    """
        )
    )


def show_table_html(df: pd.DataFrame, title: Optional[str] = None) -> None:
    init_notebook_theme()
    table_html = df.to_html(classes="ml-table", index=True, border=0, escape=True)
    title_html = f'<div class="ml-label">{_esc(title)}</div>' if title else ""
    display(HTML(f'<div class="ml-root ml-card">{title_html}{table_html}</div>'))


def show_classification_report(y_true, y_pred, model_name: str = "Modèle") -> dict[str, float]:
    """Affiche un rapport de classification en tableau HTML."""
    from sklearn.metrics import classification_report

    report = classification_report(
        y_true, y_pred, target_names=["Normal", "Fraude"], output_dict=True
    )
    rows = []
    for label in ["Normal", "Fraude"]:
        r = report[label]
        rows.append(
            {
                "Classe": label,
                "Precision": f"{r['precision']:.3f}",
                "Recall": f"{r['recall']:.3f}",
                "F1": f"{r['f1-score']:.3f}",
                "Support": int(r["support"]),
            }
        )
    df = pd.DataFrame(rows)
    show_section(model_name)
    show_table_html(df, title="Rapport de classification")
    return report
