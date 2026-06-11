"""Figures Plotly — exercice segmentation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from scipy.cluster.hierarchy import linkage
from sklearn.cluster import DBSCAN, AgglomerativeClustering, KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from src.charts.sampling import (
    PLOTLY_SAMPLE_CLUSTER,
    PLOTLY_SAMPLE_DENDRO,
    PLOTLY_SAMPLE_HIST,
    sample_df,
)
from src.constants import CLUSTER_API_COLUMNS
from src.preprocessing import clean_customer_data, engineer_customer_features, load_cluster_data
from src.training import prepare_cluster_matrix
from src.utils import COLORS, plot_silhouette

RANDOM_STATE = 42
PLOTLY_SAMPLE_DISTRIBUTIONS = PLOTLY_SAMPLE_HIST


def _cluster_context(cluster_path: str | Path, models_dir: str | Path) -> dict:
    df = load_cluster_data(str(cluster_path))
    df_clean = clean_customer_data(df)
    df_clean = engineer_customer_features(df_clean)
    X_df = prepare_cluster_matrix(df)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    metadata_path = Path(models_dir) / "metadata.json"
    best_k = 2
    cluster_labels: dict[int, str] = {0: "Digital", 1: "Premium"}
    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        cluster_meta = meta.get("cluster", {})
        best_k = int(cluster_meta.get("best_k", 2))
        raw_labels = cluster_meta.get("cluster_labels", cluster_labels)
        cluster_labels = {int(k): v for k, v in raw_labels.items()}

    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    X_pca = pca.fit_transform(X_scaled)
    pca_full = PCA(random_state=RANDOM_STATE)
    X_pca_full = pca_full.fit_transform(X_scaled)

    km = KMeans(n_clusters=best_k, random_state=RANDOM_STATE, n_init=10)
    kmeans_labels = km.fit_predict(X_scaled)
    centroids = pd.DataFrame(
        scaler.inverse_transform(km.cluster_centers_), columns=CLUSTER_API_COLUMNS
    )
    cluster_profiles = centroids
    cluster_names = cluster_labels

    df_result = df_clean.copy()
    df_result["Cluster"] = kmeans_labels

    return {
        "df": df,
        "df_clean": df_clean,
        "df_result": df_result,
        "X_scaled": X_scaled,
        "X_pca": X_pca,
        "X_pca_full": X_pca_full,
        "pca_full": pca_full,
        "best_k": best_k,
        "kmeans_labels": kmeans_labels,
        "cluster_profiles": cluster_profiles,
        "cluster_names": cluster_names,
        "scaler": scaler,
    }


def build_distributions(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    df = sample_df(ctx["df_clean"], PLOTLY_SAMPLE_DISTRIBUTIONS, random_state=RANDOM_STATE)
    key_vars = [
        "Income",
        "Age" if "Age" in df.columns else "Year_Birth",
        "MntWines",
        "MntMeatProducts",
        "NumWebPurchases",
        "NumStorePurchases",
    ]
    key_vars = [v for v in key_vars if v in df.columns][:6]
    fig = make_subplots(rows=2, cols=3, subplot_titles=key_vars)
    for i, var in enumerate(key_vars):
        row, col = i // 3 + 1, i % 3 + 1
        fig.add_trace(
            go.Histogram(x=df[var], marker_color=COLORS["primary"], name=var, showlegend=False),
            row=row,
            col=col,
        )
    fig.update_layout(title_text="Distribution des variables principales", height=650, width=1100)
    return fig


def build_categorical(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    df = ctx["df"]
    cat_vars = [v for v in ["Education", "Marital_Status"] if v in df.columns]
    fig = make_subplots(rows=1, cols=max(len(cat_vars), 1), subplot_titles=cat_vars)
    for i, var in enumerate(cat_vars):
        counts = df[var].value_counts()
        fig.add_trace(
            go.Bar(
                x=counts.index.astype(str),
                y=counts.values,
                marker_color=COLORS["primary"],
                showlegend=False,
            ),
            row=1,
            col=i + 1,
        )
    fig.update_layout(height=450, width=1000)
    return fig


def build_spending_channels(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    df = ctx["df_clean"]
    spend_cols = [c for c in df.columns if c.startswith("Mnt")]
    channel_cols = [c for c in df.columns if "Purchases" in c]
    spend_mean = df[spend_cols].mean().sort_values()
    channel_mean = df[channel_cols].mean().sort_values()
    fig = make_subplots(
        rows=1,
        cols=2,
        subplot_titles=["Dépenses moyennes par catégorie", "Achats moyens par canal"],
    )
    fig.add_trace(
        go.Bar(
            x=spend_mean.values,
            y=spend_mean.index,
            orientation="h",
            marker_color=COLORS["primary"],
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Bar(
            x=channel_mean.values,
            y=channel_mean.index,
            orientation="h",
            marker_color=COLORS["accent"],
        ),
        row=1,
        col=2,
    )
    fig.update_layout(height=450, width=1000)
    return fig


def build_correlation(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    df_clean = ctx["df_clean"]
    num_cols = df_clean.select_dtypes(include=np.number).columns
    corr_matrix = df_clean[num_cols].corr()
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    corr_masked = corr_matrix.mask(mask)
    fig = go.Figure(
        go.Heatmap(
            z=corr_masked.values,
            x=corr_masked.columns.astype(str),
            y=corr_masked.columns.astype(str),
            colorscale="RdBu",
            zmid=0,
            zmin=-1,
            zmax=1,
        )
    )
    fig.update_layout(title="Matrice de corrélation", height=800, width=1000)
    return fig


def build_pca_scree(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    X_scaled = ctx["X_scaled"]
    pca_all = PCA(random_state=RANDOM_STATE)
    pca_all.fit(X_scaled)
    components = list(range(1, len(pca_all.explained_variance_ratio_) + 1))
    cumvar = np.cumsum(pca_all.explained_variance_ratio_)
    fig = make_subplots(rows=1, cols=2, subplot_titles=["Scree Plot", "Variance cumulative"])
    fig.add_trace(
        go.Scatter(
            x=components,
            y=pca_all.explained_variance_ratio_,
            mode="lines+markers",
            name="Variance",
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(
            x=components,
            y=cumvar,
            mode="lines+markers",
            name="Cumul",
            line_color=COLORS["accent"],
        ),
        row=1,
        col=2,
    )
    fig.add_hline(y=0.95, line_dash="dash", line_color="gray", annotation_text="95%", row=1, col=2)
    fig.update_xaxes(title_text="Composante")
    fig.update_yaxes(title_text="Variance expliquée", row=1, col=1)
    fig.update_layout(height=450, width=1000)
    return fig


def build_kmeans_selection(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    X_pca_full = ctx["X_pca_full"]
    k_range = list(range(2, 11))
    inertias, silhouette_scores, db_scores = [], [], []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(X_pca_full)
        inertias.append(km.inertia_)
        silhouette_scores.append(silhouette_score(X_pca_full, labels))
        db_scores.append(davies_bouldin_score(X_pca_full, labels))
    fig = make_subplots(rows=1, cols=3, subplot_titles=["Elbow", "Silhouette", "Davies-Bouldin"])
    fig.add_trace(
        go.Scatter(x=k_range, y=inertias, mode="lines+markers", line_color=COLORS["primary"]),
        row=1,
        col=1,
    )
    plot_silhouette(silhouette_scores, k_range, fig=fig, row=1, col=2)
    fig.add_trace(
        go.Scatter(x=k_range, y=db_scores, mode="lines+markers", line_color=COLORS["accent"]),
        row=1,
        col=3,
    )
    fig.update_layout(height=450, width=1200)
    return fig


def build_clustering_comparison(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    X_scaled_full = ctx["X_scaled"]
    rng = np.random.RandomState(RANDOM_STATE)
    n = min(PLOTLY_SAMPLE_CLUSTER, len(X_scaled_full))
    idx = rng.choice(len(X_scaled_full), size=n, replace=False)
    X_scaled = X_scaled_full[idx]
    X_pca = ctx["X_pca"][idx]
    best_k = ctx["best_k"]

    kmeans_labels = KMeans(n_clusters=best_k, random_state=RANDOM_STATE, n_init=10).fit_predict(
        X_scaled
    )
    agglo_labels = AgglomerativeClustering(n_clusters=best_k).fit_predict(X_scaled)
    gmm_labels = GaussianMixture(n_components=best_k, random_state=RANDOM_STATE).fit_predict(
        X_scaled
    )
    dbscan_labels = DBSCAN(eps=0.8, min_samples=5).fit_predict(X_scaled)

    algo_results = [
        (kmeans_labels, "K-Means"),
        (agglo_labels, "Agglomerative"),
        (gmm_labels, "GMM"),
        (dbscan_labels, "DBSCAN"),
    ]
    fig = make_subplots(rows=2, cols=2, subplot_titles=[t for _, t in algo_results])
    positions = [(1, 1), (1, 2), (2, 1), (2, 2)]
    palette = px.colors.qualitative.T10
    for (labels, title), (row, col) in zip(algo_results, positions):
        unique_labels = list(dict.fromkeys(labels))
        color_map = {label: palette[i % len(palette)] for i, label in enumerate(unique_labels)}
        marker_colors = [color_map[label] for label in labels]
        fig.add_trace(
            go.Scatter(
                x=X_pca[:, 0],
                y=X_pca[:, 1],
                mode="markers",
                marker=dict(color=marker_colors, size=5, opacity=0.6),
                name=title,
                showlegend=False,
            ),
            row=row,
            col=col,
        )
        fig.update_xaxes(title_text="PC1", row=row, col=col)
        fig.update_yaxes(title_text="PC2", row=row, col=col)
    fig.update_layout(title="Comparaison des algorithmes de clustering", height=800, width=1000)
    return fig


def build_dendrogram(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    from plotly.figure_factory import create_dendrogram

    ctx = _cluster_context(cluster_path, models_dir)
    X_pca_full = ctx["X_pca_full"]
    rng = np.random.RandomState(RANDOM_STATE)
    sample_idx = rng.choice(
        len(X_pca_full), min(PLOTLY_SAMPLE_DENDRO, len(X_pca_full)), replace=False
    )
    fig = create_dendrogram(
        X_pca_full[sample_idx],
        linkagefun=lambda x: linkage(x, method="ward"),
        orientation="bottom",
        labels=None,
    )
    fig.update_layout(
        title="Dendrogramme (échantillon 300 clients)",
        xaxis_title="Clients",
        yaxis_title="Distance Ward",
        height=500,
        width=1200,
    )
    return fig


def build_cluster_profiles(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    cluster_profiles = ctx["cluster_profiles"]
    profile_norm = pd.DataFrame(
        MinMaxScaler().fit_transform(cluster_profiles),
        index=cluster_profiles.index,
        columns=cluster_profiles.columns,
    )
    fig = go.Figure(
        go.Heatmap(
            z=profile_norm.T.values,
            x=[str(c) for c in profile_norm.index],
            y=profile_norm.columns.astype(str),
            colorscale="YlOrRd",
            text=cluster_profiles.T.round(0).astype(int).values,
            texttemplate="%{text}",
        )
    )
    fig.update_layout(
        title="Profils clients par cluster (normalisés)",
        xaxis_title="Cluster",
        height=500,
        width=1100,
    )
    return fig


def build_radar_profiles(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    cluster_profiles = ctx["cluster_profiles"]
    cluster_names = ctx["cluster_names"]
    best_k = ctx["best_k"]
    radar_cols = [
        c
        for c in [
            "Income",
            "TotalSpend",
            "NumWebPurchases",
            "NumStorePurchases",
            "Recency",
            "Children",
        ]
        if c in cluster_profiles.columns
    ]
    if not radar_cols:
        radar_cols = list(cluster_profiles.columns[:6])
    norm_profiles = MinMaxScaler().fit_transform(cluster_profiles[radar_cols])
    palette = px.colors.qualitative.T10
    fig = go.Figure()
    for i in range(min(best_k, norm_profiles.shape[0])):
        row = norm_profiles[i]
        values = row.tolist() + [row[0]]
        theta = radar_cols + [radar_cols[0]]
        name = cluster_names.get(i, f"Cluster {i}")
        fig.add_trace(
            go.Scatterpolar(
                r=values,
                theta=theta,
                fill="toself",
                name=name,
                line_color=palette[i % len(palette)],
            )
        )
    fig.update_layout(
        title="Radar — Profils clients",
        polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
        height=500,
        width=1000,
    )
    return fig


def build_campaign_response(cluster_path: str | Path, models_dir: str | Path) -> go.Figure:
    ctx = _cluster_context(cluster_path, models_dir)
    df_result = ctx["df_result"]
    cmp_cols = [c for c in df_result.columns if c.startswith("AcceptedCmp") or c == "Response"]
    if not cmp_cols:
        fig = go.Figure()
        fig.update_layout(title="Données campagnes non disponibles", height=400, width=900)
        return fig
    df_result = df_result.copy()
    df_result["CampaignResponse"] = df_result[cmp_cols].sum(axis=1)
    campaign_by_cluster = df_result.groupby("Cluster")["CampaignResponse"].mean()
    fig = go.Figure(
        go.Bar(
            x=campaign_by_cluster.index.astype(str),
            y=campaign_by_cluster.values,
            marker_color=COLORS["primary"],
        )
    )
    fig.update_layout(
        title="Réponse moyenne aux campagnes marketing par cluster",
        xaxis_title="Cluster",
        yaxis_title="Taux de réponse moyen",
        height=450,
        width=900,
    )
    return fig


def all_charts(
    cluster_path: str | Path, models_dir: str | Path
) -> dict[str, Callable[[], go.Figure]]:
    path, models = Path(cluster_path), Path(models_dir)
    return {
        "ex2_distributions": lambda: build_distributions(path, models),
        "ex2_categorical": lambda: build_categorical(path, models),
        "ex2_spending_channels": lambda: build_spending_channels(path, models),
        "ex2_correlation": lambda: build_correlation(path, models),
        "ex2_pca_scree": lambda: build_pca_scree(path, models),
        "ex2_kmeans_selection": lambda: build_kmeans_selection(path, models),
        "ex2_clustering_comparison": lambda: build_clustering_comparison(path, models),
        "ex2_dendrogram": lambda: build_dendrogram(path, models),
        "ex2_cluster_profiles": lambda: build_cluster_profiles(path, models),
        "ex2_radar_profiles": lambda: build_radar_profiles(path, models),
        "ex2_campaign_response": lambda: build_campaign_response(path, models),
    }
