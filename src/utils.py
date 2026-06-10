"""Utilitaires partagés : métriques, visualisations Plotly, helpers."""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from sklearn.metrics import (average_precision_score, confusion_matrix,
                             roc_auc_score, roc_curve)

COLORS = {
    "primary": "#4682B4",
    "secondary": "#FF6347",
    "accent": "#FF7F50",
    "neutral": "#708090",
}


def _is_subplot_figure(fig: go.Figure) -> bool:
    return bool(getattr(fig, "_grid_ref", None))


def apply_plotly_theme(fig: go.Figure) -> go.Figure:
    """Applique un thème Plotly uniforme (dashboard moderne)."""
    fig.update_layout(
        template="plotly_white",
        font=dict(
            family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            size=13,
        ),
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#F8FAFC",
        margin=dict(l=60, r=30, t=60, b=50),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        colorway=[
            COLORS["primary"],
            COLORS["secondary"],
            COLORS["accent"],
            COLORS["neutral"],
        ],
    )
    return fig


def save_figure(
    fig: go.Figure, path: str, width: int = 1000, height: int = 600
) -> go.Figure:
    """Exporte la figure en PNG (nécessite kaleido) ou HTML en secours."""
    fig = apply_plotly_theme(fig)
    try:
        fig.write_image(path, width=width, height=height, scale=2)
    except Exception:
        fig.write_html(path.replace(".png", ".html"))
    return fig


def show_figure(
    fig: go.Figure, path: str | None = None, width: int = 1000, height: int = 600
) -> go.Figure:
    """Affiche une figure Plotly thématisée et l'enregistre optionnellement."""
    fig = apply_plotly_theme(fig)
    fig.show()
    if path:
        save_figure(fig, path, width=width, height=height)
    return fig


def plot_class_distribution(
    y,
    title: str = "Distribution des classes",
    fig: go.Figure | None = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    counts = pd.Series(y).value_counts().sort_index()
    labels = counts.index.astype(str)
    text = [f"{v:,} ({v / len(y) * 100:.1f}%)" for v in counts.values]

    trace = go.Bar(
        x=labels,
        y=counts.values,
        marker_color=[COLORS["primary"], COLORS["secondary"]][: len(counts)],
        text=text,
        textposition="outside",
        name=title,
    )

    if fig is None:
        fig = go.Figure(trace)
        fig.update_layout(
            title=title, xaxis_title="Classe", yaxis_title="Nombre d'observations"
        )
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
    fig: go.Figure | None = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    cm = confusion_matrix(y_true, y_pred)
    tick_labels = labels or ["Négatif", "Positif"]
    trace = go.Heatmap(
        z=cm,
        x=tick_labels,
        y=tick_labels,
        colorscale="Blues",
        showscale=False,
        text=cm,
        texttemplate="%{text}",
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
    fig: go.Figure | None = None,
    row: int = 1,
    col: int = 1,
    add_diagonal: bool | None = None,
    max_roc_points: int | None = 200,
) -> tuple[go.Figure, float]:
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
        line=dict(color=COLORS["primary"]),
    )
    diagonal = go.Scatter(
        x=[0, 1],
        y=[0, 1],
        mode="lines",
        line=dict(color=COLORS["neutral"], dash="dash"),
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
    fig: go.Figure | None = None,
    row: int = 1,
    col: int = 1,
) -> go.Figure:
    best_k = k_range[int(np.argmax(silhouette_scores))]
    trace = go.Scatter(
        x=list(k_range),
        y=silhouette_scores,
        mode="lines+markers",
        name="Silhouette",
        line=dict(color=COLORS["primary"]),
    )
    vline = go.Scatter(
        x=[best_k, best_k],
        y=[min(silhouette_scores), max(silhouette_scores)],
        mode="lines",
        name=f"Meilleur k={best_k}",
        line=dict(color=COLORS["secondary"], dash="dash"),
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
