"""Utilitaires partagés : métriques, visualisations Plotly, helpers."""

from __future__ import annotations

from typing import Optional, Tuple

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
)

from src.constants import COLORS

_AXIS_STYLE = dict(
    showgrid=True,
    gridcolor="#E2E8F0",
    gridwidth=1,
    linecolor="#CBD5E1",
    linewidth=1,
    zeroline=False,
    ticks="outside",
    tickcolor="#CBD5E1",
    title_font=dict(size=12, color="#475569"),
    tickfont=dict(size=11, color="#64748B"),
)


def _is_subplot_figure(fig: go.Figure) -> bool:
    return bool(getattr(fig, "_grid_ref", None))


def apply_plotly_theme(fig: go.Figure) -> go.Figure:
    """Applique un thème Plotly uniforme (dashboard moderne)."""
    fig.update_layout(
        template="plotly_white",
        font=dict(
            family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            size=13,
            color="#1E293B",
        ),
        title=dict(
            font=dict(size=16, color="#1E293B"),
            x=0.02,
            xanchor="left",
        ),
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#F8FAFC",
        margin=dict(l=64, r=32, t=72, b=56),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            bgcolor="rgba(255,255,255,0.85)",
            bordercolor="#E2E8F0",
            borderwidth=1,
            font=dict(size=12),
        ),
        hoverlabel=dict(
            bgcolor="#FFFFFF",
            bordercolor="#E2E8F0",
            font=dict(size=12, color="#1E293B"),
        ),
        hovermode="x unified",
        bargap=0.28,
        bargroupgap=0.12,
        colorway=[
            COLORS["primary"],
            COLORS["secondary"],
            COLORS["accent"],
            COLORS["neutral"],
            COLORS["success"],
            COLORS["warning"],
        ],
    )
    fig.update_xaxes(**_AXIS_STYLE)
    fig.update_yaxes(**_AXIS_STYLE)
    return fig


def save_figure(fig: go.Figure, path: str, width: int = 1000, height: int = 600) -> go.Figure:
    """Exporte la figure en PNG (nécessite kaleido) ou HTML en secours."""
    fig = apply_plotly_theme(fig)
    try:
        fig.write_image(path, width=width, height=height, scale=2)
    except Exception:
        fig.write_html(path.replace(".png", ".html"))
    return fig


def show_figure(
    fig: go.Figure,
    path: Optional[str] = None,
    width: int = 1000,
    height: int = 600,
) -> None:
    """Affiche une figure Plotly thématisée dans une carte HTML et l'enregistre optionnellement."""
    from IPython.display import HTML, display

    from src.display import init_notebook_theme

    init_notebook_theme()
    fig = apply_plotly_theme(fig)
    if not fig.layout.width:
        fig.update_layout(width=width, height=height)

    chart_html = fig.to_html(
        full_html=False,
        include_plotlyjs="cdn",
        config={"displayModeBar": True, "responsive": True, "displaylogo": False},
    )
    display(
        HTML(
            f"""
    <div class="ml-root ml-chart-card">
        <div class="ml-chart-inner">{chart_html}</div>
    </div>
    """
        )
    )
    if path:
        save_figure(fig, path, width=width, height=height)
    # Ne pas retourner fig : Jupyter ré-afficherait la figure une 2e fois


def plot_class_distribution(
    y,
    title: str = "Distribution des classes",
    fig: Optional[go.Figure] = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    counts = pd.Series(y).value_counts().sort_index()
    labels = counts.index.astype(str)
    text = [f"{v:,} ({v / len(y) * 100:.1f}%)" for v in counts.values]

    trace = go.Bar(
        x=labels,
        y=counts.values,
        marker=dict(
            color=[COLORS["primary"], COLORS["secondary"]][: len(counts)],
            line=dict(width=0),
        ),
        text=text,
        textposition="outside",
        textfont=dict(size=11, color="#475569"),
        name=title,
    )

    if fig is None:
        fig = go.Figure(trace)
        fig.update_layout(title=title, xaxis_title="Classe", yaxis_title="Nombre d'observations")
        return fig

    if _is_subplot_figure(fig):
        fig.add_trace(trace, row=row, col=col)
        fig.update_xaxes(title_text="Classe", row=row, col=col)
        fig.update_yaxes(title_text="Nombre d'observations", row=row, col=col)
    else:
        fig.add_trace(trace)
    return fig


def plot_confusion_matrix(
    y_true,
    y_pred,
    labels=None,
    fig: Optional[go.Figure] = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    cm = confusion_matrix(y_true, y_pred)
    tick_labels = labels or ["Négatif", "Positif"]
    trace = go.Heatmap(
        z=cm,
        x=tick_labels,
        y=tick_labels,
        colorscale=[
            [0, "#EFF6FF"],
            [0.5, "#93C5FD"],
            [1, COLORS["primary"]],
        ],
        showscale=False,
        text=cm,
        texttemplate="%{text}",
        textfont=dict(size=14, color="#1E293B"),
        hovertemplate="Réel=%{y}<br>Prédit=%{x}<br>Count=%{z}<extra></extra>",
    )

    if fig is None:
        fig = go.Figure(trace)
        fig.update_layout(
            title="Matrice de confusion",
            xaxis_title="Prédit",
            yaxis_title="Réel",
        )
        return fig

    if _is_subplot_figure(fig):
        fig.add_trace(trace, row=row, col=col)
        fig.update_xaxes(title_text="Prédit", row=row, col=col)
        fig.update_yaxes(title_text="Réel", row=row, col=col)
    else:
        fig.add_trace(trace)
    return fig


def plot_roc_curve(
    y_true,
    y_score,
    model_name: str = "Modèle",
    fig: Optional[go.Figure] = None,
    row: int = 1,
    col: int = 1,
    add_diagonal: Optional[bool] = None,
    max_roc_points: Optional[int] = 200,
) -> Tuple[go.Figure, float]:
    fpr, tpr, _ = roc_curve(y_true, y_score)
    auc = roc_auc_score(y_true, y_score)
    if max_roc_points is not None:
        from src.charts.sampling import subsample_curve

        fpr, tpr = subsample_curve(fpr, tpr, max_roc_points)
    if add_diagonal is None:
        add_diagonal = fig is None

    trace = go.Scatter(
        x=fpr,
        y=tpr,
        mode="lines",
        name=f"{model_name} (AUC = {auc:.3f})",
        line=dict(color=COLORS["primary"], width=2.5),
    )
    diagonal = go.Scatter(
        x=[0, 1],
        y=[0, 1],
        mode="lines",
        line=dict(color=COLORS["neutral"], dash="dash", width=1.5),
        name="Aléatoire",
        showlegend=False,
        hoverinfo="skip",
    )

    if fig is None:
        traces = [trace, diagonal] if add_diagonal else [trace]
        fig = go.Figure(traces)
        fig.update_layout(
            title="Courbe ROC",
            xaxis_title="Taux faux positifs",
            yaxis_title="Taux vrais positifs",
        )
        return fig, auc

    if _is_subplot_figure(fig):
        fig.add_trace(trace, row=row, col=col)
        if add_diagonal:
            fig.add_trace(diagonal, row=row, col=col)
        fig.update_xaxes(title_text="Taux faux positifs", row=row, col=col)
        fig.update_yaxes(title_text="Taux vrais positifs", row=row, col=col)
    else:
        fig.add_trace(trace)
        if add_diagonal:
            fig.add_trace(diagonal)
    return fig, auc


def plot_silhouette(
    silhouette_scores,
    k_range,
    fig: Optional[go.Figure] = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    best_k = k_range[int(np.argmax(silhouette_scores))]
    trace = go.Scatter(
        x=list(k_range),
        y=silhouette_scores,
        mode="lines+markers",
        name="Silhouette",
        line=dict(color=COLORS["primary"], width=2.5),
        marker=dict(size=7, color=COLORS["primary"]),
    )
    vline = go.Scatter(
        x=[best_k, best_k],
        y=[min(silhouette_scores), max(silhouette_scores)],
        mode="lines",
        name=f"Meilleur k={best_k}",
        line=dict(color=COLORS["secondary"], dash="dash", width=1.5),
    )

    if fig is None:
        fig = go.Figure([trace, vline])
        fig.update_layout(
            title="Silhouette Score par nombre de clusters",
            xaxis_title="Nombre de clusters k",
            yaxis_title="Silhouette Score",
        )
        return fig

    if _is_subplot_figure(fig):
        fig.add_trace(trace, row=row, col=col)
        fig.add_trace(vline, row=row, col=col)
        fig.update_xaxes(title_text="k", row=row, col=col)
        fig.update_yaxes(title_text="Silhouette Score", row=row, col=col)
    else:
        fig.add_trace(trace)
        fig.add_trace(vline)
    return fig


def evaluate_classifier(y_true, y_pred, y_score=None, model_name="Modèle"):
    """Affiche métriques de classification en cartes HTML."""
    from src.display import show_classification_report, show_metrics_row

    show_classification_report(y_true, y_pred, model_name=model_name)
    metrics = {}
    if y_score is not None:
        metrics["ROC-AUC"] = f"{roc_auc_score(y_true, y_score):.4f}"
        metrics["Avg Precision"] = f"{average_precision_score(y_true, y_score):.4f}"
        show_metrics_row(metrics)
    return {
        "model": model_name,
        "roc_auc": roc_auc_score(y_true, y_score) if y_score is not None else None,
    }
