"""Composants HTML pour un affichage notebook cohérent (style dashboard moderne)."""

from __future__ import annotations

import html
from typing import Any

import pandas as pd
from IPython.display import HTML, display

from src.utils import COLORS

THEME = {
    "primary": COLORS["primary"],
    "secondary": COLORS["secondary"],
    "accent": COLORS["accent"],
    "neutral": COLORS["neutral"],
    "success": "#2E8B57",
    "warning": "#FFA500",
    "danger": "#DC3545",
    "bg": "#F8FAFC",
    "card": "#FFFFFF",
    "text": "#1E293B",
    "muted": "#64748B",
}

_BADGE_STYLES = {
    "stable": ("#E8F5E9", THEME["success"]),
    "success": ("#E8F5E9", THEME["success"]),
    "warning": ("#FFF3E0", THEME["warning"]),
    "drift": ("#FFEBEE", THEME["danger"]),
    "danger": ("#FFEBEE", THEME["danger"]),
    "info": ("#E3F2FD", THEME["primary"]),
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
    background: linear-gradient(135deg, {THEME["primary"]} 0%, #2C5282 100%);
    color: white;
    padding: 1.5rem 1.75rem;
    border-radius: 12px;
    margin: 0.5rem 0 1.25rem 0;
    box-shadow: 0 4px 14px rgba(70, 130, 180, 0.25);
}}
.ml-hero h1 {{ margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; }}
.ml-hero .ml-objective {{ opacity: 0.95; margin-bottom: 0.75rem; }}
.ml-hero ol {{ margin: 0; padding-left: 1.25rem; opacity: 0.9; font-size: 0.92rem; }}
.ml-section {{
    border-left: 4px solid {THEME["primary"]};
    padding: 0.5rem 0 0.5rem 1rem;
    margin: 1.5rem 0 1rem 0;
}}
.ml-section h2 {{ margin: 0; font-size: 1.2rem; color: {THEME["primary"]}; }}
.ml-section .ml-subtitle {{ color: {THEME["muted"]}; font-size: 0.9rem; margin-top: 0.25rem; }}
.ml-card {{
    background: {THEME["card"]};
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 1rem 1.15rem;
    margin: 0.75rem 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}}
.ml-card.insight {{ border-left: 4px solid {THEME["accent"]}; }}
.ml-card.info {{ border-left: 4px solid {THEME["primary"]}; }}
.ml-card.warning {{ border-left: 4px solid {THEME["warning"]}; }}
.ml-card.success {{ border-left: 4px solid {THEME["success"]}; }}
.ml-card .ml-label {{
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: {THEME["muted"]};
    margin-bottom: 0.35rem;
}}
.ml-metrics {{
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 0.75rem 0;
}}
.ml-metric {{
    flex: 1 1 140px;
    background: {THEME["card"]};
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 0.85rem 1rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}}
.ml-metric .ml-value {{
    font-size: 1.35rem;
    font-weight: 700;
    color: {THEME["primary"]};
}}
.ml-metric .ml-key {{
    font-size: 0.78rem;
    color: {THEME["muted"]};
    margin-top: 0.2rem;
}}
.ml-badge {{
    display: inline-block;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
}}
.ml-findings {{ margin: 0; padding-left: 1.25rem; }}
.ml-findings li {{ margin-bottom: 0.4rem; }}
.ml-arch {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin: 0.75rem 0;
}}
.ml-arch-step {{
    background: {THEME["bg"]};
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.85rem;
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
    padding: 0.55rem 0.75rem;
    text-align: left;
    border-bottom: 2px solid #E2E8F0;
}}
.ml-table td {{
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #F1F5F9;
}}
.ml-table tr:hover td {{ background: #F8FAFC; }}
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


def show_section(title: str, subtitle: str | None = None) -> None:
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
    tiles = "".join(
        f'<div class="ml-metric"><div class="ml-value">{_esc(v)}</div>'
        f'<div class="ml-key">{_esc(k)}</div></div>'
        for k, v in metrics.items()
    )
    display(HTML(f'<div class="ml-root ml-metrics">{tiles}</div>'))


def show_badge(label: str, status: str = "default") -> None:
    bg, color = _BADGE_STYLES.get(status, _BADGE_STYLES["default"])
    display(
        HTML(
            f'<span class="ml-badge" style="background:{bg};color:{color};">{_esc(label)}</span>'
        )
    )


def show_findings_list(items: list[str], title: str = "Points clés") -> None:
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


def show_table_html(df: pd.DataFrame, title: str | None = None) -> None:
    table_html = df.to_html(classes="ml-table", index=True, border=0, escape=True)
    title_html = f'<div class="ml-label">{_esc(title)}</div>' if title else ""
    display(HTML(f'<div class="ml-root ml-card">{title_html}{table_html}</div>'))


def show_classification_report(
    y_true, y_pred, model_name: str = "Modèle"
) -> dict[str, float]:
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
