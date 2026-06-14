"""Figures Plotly — exercice fraude."""

from __future__ import annotations

from pathlib import Path
from typing import Callable

import joblib
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from imblearn.over_sampling import SMOTE
from plotly.subplots import make_subplots
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src.charts.sampling import PLOTLY_SAMPLE_HIST, PLOTLY_SAMPLE_SCATTER, sample_df, sample_series
from src.constants import FRAUD_THRESHOLD
from src.models import FRAUD_MODELS, get_fraud_model
from src.preprocessing import load_fraud_data
from src.training import prepare_fraud_matrix
from src.utils import COLORS, plot_class_distribution, plot_confusion_matrix, plot_roc_curve

RANDOM_STATE = 42


def _fraud_eval_context(fraud_path: str | Path, models_dir: str | Path):
    """Prépare données test + prédictions du modèle fraude (joblib ou entraînement à la volée)."""
    df = load_fraud_data(str(fraud_path))
    X, y = prepare_fraud_matrix(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model_path = Path(models_dir) / "fraud_model.joblib"
    scaler_path = Path(models_dir) / "fraud_scaler.joblib"
    if model_path.exists() and scaler_path.exists():
        # Modèle entraîné et sauvegardé (pipeline production)
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        X_test_scaled = scaler.transform(X_test)
    else:
        # Fallback notebook : entraîne XGBoost à la volée si pas de joblib
        smote = SMOTE(random_state=RANDOM_STATE, sampling_strategy=0.1)
        X_resampled, y_resampled = smote.fit_resample(X_train_scaled, y_train)
        model = get_fraud_model("xgboost")
        model.fit(X_resampled, y_resampled)

    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    y_pred = (y_proba >= FRAUD_THRESHOLD).astype(int)  # seuil métier (0.3), pas 0.5
    return df, X, X_test, y_test, X_test_scaled, model, y_proba, y_pred


def build_class_distribution(fraud_path: str | Path) -> go.Figure:
    """EDA : déséquilibre des classes et répartition des fraudes par type de transaction."""
    df = load_fraud_data(str(fraud_path))
    type_fraud = df.groupby(["type", "isFraud"]).size().unstack(fill_value=0)
    fig = make_subplots(
        rows=1,
        cols=2,
        subplot_titles=["Distribution isFraud", "Fraudes par type de transaction"],
    )
    plot_class_distribution(df["isFraud"], title="Distribution isFraud", fig=fig, row=1, col=1)
    fig.add_trace(
        go.Bar(
            name="Normal",
            x=type_fraud.index,
            y=type_fraud[0],
            marker_color=COLORS["primary"],
        ),
        row=1,
        col=2,
    )
    fig.add_trace(
        go.Bar(
            name="Fraude",
            x=type_fraud.index,
            y=type_fraud[1],
            marker_color=COLORS["secondary"],
        ),
        row=1,
        col=2,
    )
    fig.update_layout(barmode="group", height=450, width=1000)
    fig.update_xaxes(title_text="Type", row=1, col=2)
    return fig


def build_amount_distribution(fraud_path: str | Path) -> go.Figure:
    """EDA : histogrammes des montants (clippés au P99) et montants moyens par type."""
    df = load_fraud_data(str(fraud_path))
    clip_val = df["amount"].quantile(0.99)
    amount_by_type = df.groupby(["type", "isFraud"])["amount"].mean().unstack()
    fig = make_subplots(
        rows=1,
        cols=2,
        subplot_titles=[
            "Distribution des montants",
            "Montant moyen par type et classe",
        ],
    )
    for label, color, name in [
        (0, COLORS["primary"], "Normal"),
        (1, COLORS["secondary"], "Fraude"),
    ]:
        amounts = df.loc[df["isFraud"] == label, "amount"].clip(upper=clip_val)
        amounts = sample_series(amounts, PLOTLY_SAMPLE_HIST, random_state=RANDOM_STATE)
        fig.add_trace(
            go.Histogram(
                x=amounts,
                name=name,
                opacity=0.7,
                marker_color=color,
                nbinsx=50,
            ),
            row=1,
            col=1,
        )
    fig.add_trace(
        go.Bar(
            name="Normal",
            x=amount_by_type.index,
            y=amount_by_type[0],
            marker_color=COLORS["primary"],
        ),
        row=1,
        col=2,
    )
    fig.add_trace(
        go.Bar(
            name="Fraude",
            x=amount_by_type.index,
            y=amount_by_type[1],
            marker_color=COLORS["secondary"],
        ),
        row=1,
        col=2,
    )
    fig.update_layout(barmode="overlay", height=450, width=1000)
    fig.update_xaxes(title_text="Montant (clippé au 99e percentile)", row=1, col=1)
    fig.update_xaxes(title_text="Type", row=1, col=2)
    return fig


def build_suspicious_behavior(fraud_path: str | Path) -> go.Figure:
    """EDA : scatter soldes émetteur (normal vs fraude) et corrélations numériques."""
    df = load_fraud_data(str(fraud_path))
    num_cols = [
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
        "isFraud",
    ]
    corr = df[num_cols].corr()
    fig = make_subplots(
        rows=1,
        cols=2,
        subplot_titles=["Soldes émetteur : normal vs fraude", "Matrice de corrélation"],
    )
    for label, color, name in [
        (0, COLORS["primary"], "Normal"),
        (1, COLORS["secondary"], "Fraude"),
    ]:
        subset = df[df["isFraud"] == label]
        subset = sample_df(subset, PLOTLY_SAMPLE_SCATTER, random_state=RANDOM_STATE)
        fig.add_trace(
            go.Scatter(
                x=subset["oldbalanceOrg"].clip(upper=1e6),
                y=subset["newbalanceOrig"].clip(upper=1e6),
                mode="markers",
                name=name,
                marker=dict(color=color, size=4, opacity=0.4),
            ),
            row=1,
            col=1,
        )
    fig.add_trace(
        go.Heatmap(
            z=corr.values,
            x=corr.columns,
            y=corr.columns,
            colorscale="RdBu",
            zmid=0,
            text=np.round(corr.values, 2),
            texttemplate="%{text}",
            showscale=True,
        ),
        row=1,
        col=2,
    )
    fig.update_xaxes(title_text="Solde avant (émetteur)", row=1, col=1)
    fig.update_yaxes(title_text="Solde après (émetteur)", row=1, col=1)
    fig.update_layout(height=450, width=1000)
    return fig


def build_roc_curves(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Compare les courbes ROC des 4 modèles sklearn après SMOTE sur le jeu d'entraînement."""
    X, y = prepare_fraud_matrix(load_fraud_data(str(fraud_path)))
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    smote = SMOTE(random_state=RANDOM_STATE, sampling_strategy=0.1)
    X_resampled, y_resampled = smote.fit_resample(X_train_scaled, y_train)

    fig = go.Figure()
    for name in FRAUD_MODELS:
        m = get_fraud_model(name)
        if hasattr(m, "predict_proba"):
            m.fit(X_resampled, y_resampled)
            y_proba = m.predict_proba(X_test_scaled)[:, 1]
            plot_roc_curve(y_test, y_proba, model_name=name, fig=fig, add_diagonal=False)
    fig.add_trace(
        go.Scatter(
            x=[0, 1],
            y=[0, 1],
            mode="lines",
            line=dict(dash="dash", color=COLORS["neutral"]),
            showlegend=False,
            hoverinfo="skip",
        ),
    )
    fig.update_layout(
        title="Courbes ROC — Comparaison des modèles",
        xaxis_title="Taux faux positifs",
        yaxis_title="Taux vrais positifs",
        height=600,
        width=900,
    )
    return fig


def build_best_model_eval(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Évaluation du modèle déployé : matrice de confusion + courbe ROC sur le test set."""
    _, _, _, y_test, _, model, y_proba, y_pred = _fraud_eval_context(fraud_path, models_dir)
    model_name = getattr(model, "__class__", type(model)).__name__
    fig = make_subplots(rows=1, cols=2, subplot_titles=["Matrice de confusion", "Courbe ROC"])
    plot_confusion_matrix(y_test, y_pred, fig=fig, row=1, col=1)
    plot_roc_curve(y_test, y_proba, model_name=model_name, fig=fig, row=1, col=2, add_diagonal=True)
    fig.update_layout(height=500, width=1000)
    return fig


def build_threshold_analysis(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Analyse du seuil de décision : distribution des probabilités et F1 en fonction du seuil."""
    _, _, _, y_test, _, _, y_proba, _ = _fraud_eval_context(fraud_path, models_dir)
    thresholds = np.arange(0.1, 0.9, 0.05)
    f1_scores = [f1_score(y_test, (y_proba >= t).astype(int)) for t in thresholds]
    best_threshold = float(thresholds[int(np.argmax(f1_scores))])
    proba_normal = sample_series(pd.Series(y_proba[y_test == 0]), PLOTLY_SAMPLE_HIST, RANDOM_STATE)
    proba_fraud = sample_series(pd.Series(y_proba[y_test == 1]), PLOTLY_SAMPLE_HIST, RANDOM_STATE)
    fig = make_subplots(
        rows=1,
        cols=2,
        subplot_titles=[
            "Distribution des probabilités prédites",
            "F1-score en fonction du seuil",
        ],
    )
    fig.add_trace(
        go.Histogram(
            x=proba_normal,
            name="Normal",
            opacity=0.7,
            marker_color=COLORS["primary"],
            histnorm="probability density",
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Histogram(
            x=proba_fraud,
            name="Fraude",
            opacity=0.7,
            marker_color=COLORS["secondary"],
            histnorm="probability density",
        ),
        row=1,
        col=1,
    )
    fig.add_vline(
        x=0.5,
        line_dash="dash",
        line_color="black",
        annotation_text="Seuil 0.5",
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(
            x=thresholds,
            y=f1_scores,
            mode="lines+markers",
            name="F1",
            line_color=COLORS["primary"],
        ),
        row=1,
        col=2,
    )
    fig.add_vline(
        x=best_threshold,
        line_dash="dash",
        line_color=COLORS["secondary"],
        annotation_text=f"Optimal={best_threshold:.2f}",
        row=1,
        col=2,
    )
    fig.update_layout(barmode="overlay", height=450, width=1000)
    fig.update_xaxes(title_text="P(Fraude)", row=1, col=1)
    fig.update_xaxes(title_text="Seuil", row=1, col=2)
    fig.update_yaxes(title_text="F1-score", row=1, col=2)
    return fig


def _shap_context(fraud_path: str | Path, models_dir: str | Path):
    """Calcule SHAP (TreeExplainer) sur un échantillon ; repli sur feature_importances_."""
    _, X, X_test, y_test, X_test_scaled, model, _, _ = _fraud_eval_context(fraud_path, models_dir)
    n_shap = min(500, X_test.shape[0])
    rng = np.random.RandomState(RANDOM_STATE)
    inds = rng.choice(X_test.shape[0], size=n_shap, replace=False)
    X_sample = pd.DataFrame(X_test_scaled[inds], columns=X.columns)

    try:
        import shap

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)
        sv = (
            shap_values[1] if isinstance(shap_values, list) else shap_values
        )  # classe positive (fraude)
        base_value = (
            explainer.expected_value[1]
            if isinstance(explainer.expected_value, list)
            else explainer.expected_value
        )
    except Exception:
        # Repli si SHAP indisponible (modèle non-arbre, erreur d'install, etc.)
        importances = getattr(model, "feature_importances_", np.ones(X.shape[1]) / X.shape[1])
        sv = np.tile(importances, (n_shap, 1))
        base_value = 0.0
        explainer = None

    importance = pd.Series(np.abs(sv).mean(axis=0), index=X_sample.columns).sort_values()
    return (
        sv,
        X_sample,
        importance,
        base_value,
        y_test,
        X_test,
        X_test_scaled,
        explainer,
        inds,
    )


def build_shap_importance(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Barplot horizontal de l'importance globale des features (|SHAP| moyen)."""
    sv, X_sample, importance, _, _, _, _, _, _ = _shap_context(fraud_path, models_dir)
    fig = go.Figure(
        go.Bar(
            x=importance.values,
            y=importance.index,
            orientation="h",
            marker_color=COLORS["primary"],
        )
    )
    fig.update_layout(
        title="Importance des features (SHAP — valeur absolue moyenne)",
        xaxis_title="|SHAP| moyen",
        yaxis_title="Feature",
        height=600,
        width=900,
    )
    return fig


def build_shap_beeswarm(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Nuage de points SHAP par observation pour les features les plus influentes."""
    sv, X_sample, importance, _, _, _, _, _, _ = _shap_context(fraud_path, models_dir)
    top_k = min(30, len(importance))
    top_features = importance.index[-top_k:]
    traces = []
    for col in top_features:
        idx = X_sample.columns.get_loc(col)
        traces.append(
            go.Scatter(
                x=sv[:, idx],
                y=[col] * len(sv),
                mode="markers",
                marker=dict(
                    size=4,
                    opacity=0.5,
                    color=sv[:, idx],
                    colorscale="RdBu",
                    showscale=False,
                ),
                showlegend=False,
            )
        )
    fig = go.Figure(traces)
    fig.update_layout(
        title=f"Impact SHAP par feature et par observation (Top {top_k})",
        xaxis_title="Valeur SHAP",
        yaxis_title="Feature",
        height=700,
        width=900,
    )
    return fig


def build_shap_force_plot(fraud_path: str | Path, models_dir: str | Path) -> go.Figure:
    """Contributions SHAP locales pour une transaction frauduleuse du jeu de test."""
    sv, X_sample, _, base_value, y_test, X_test, X_test_scaled, explainer, inds = _shap_context(
        fraud_path, models_dir
    )
    fraud_mask = y_test == 1
    if not fraud_mask.any():
        fig = go.Figure()
        fig.update_layout(title="Aucune fraude dans le jeu de test", height=400, width=900)
        return fig
    fraud_pos_in_test = int(np.where(fraud_mask.values)[0][0])
    if fraud_pos_in_test in inds:
        fraud_pos = list(inds).index(fraud_pos_in_test)
        contrib = pd.Series(sv[fraud_pos], index=X_sample.columns).sort_values(key=abs)
    elif explainer is not None:
        X_single = pd.DataFrame(
            X_test_scaled[fraud_pos_in_test].reshape(1, -1), columns=X_test.columns
        )
        sv_single = explainer.shap_values(X_single)
        sv_single_arr = sv_single[1] if isinstance(sv_single, list) else sv_single
        contrib = pd.Series(sv_single_arr[0], index=X_single.columns).sort_values(key=abs)
    else:
        contrib = pd.Series(sv[0], index=X_sample.columns).sort_values(key=abs)
    colors = [COLORS["secondary"] if v > 0 else COLORS["primary"] for v in contrib.values]
    fig = go.Figure(go.Bar(x=contrib.values, y=contrib.index, orientation="h", marker_color=colors))
    fig.update_layout(
        title=f"Explication SHAP — Transaction frauduleuse (base={base_value:.3f})",
        xaxis_title="Contribution SHAP",
        height=600,
        width=900,
    )
    return fig


# Courbe d'apprentissage MLP — valeurs du notebook 01 (TensorFlow, 20 epochs).
_NN_TRAINING_HISTORY = {
    "loss": [
        0.010586452670395374,
        0.0026324158534407616,
        0.0022756694816052914,
        0.002238977001979947,
        0.002042650245130062,
        0.0018484749598428607,
        0.0017524224240332842,
        0.001654459978453815,
        0.0016397065483033657,
        0.0015332844341173768,
        0.0016513322480022907,
        0.001547956489957869,
        0.001573572400957346,
        0.0015169746475294232,
        0.0015619106125086546,
        0.0015538115985691547,
        0.001500989543274045,
        0.0015288012800738215,
        0.0015425921883434057,
        0.0013775378465652466,
    ],
    "val_loss": [
        1.0944023132324219,
        0.7742147445678711,
        0.635152280330658,
        0.7109448909759521,
        0.734125018119812,
        0.9395886659622192,
        0.5259311199188232,
        0.7606319189071655,
        0.7510833740234375,
        0.6509796380996704,
        0.5043615698814392,
        0.5560234189033508,
        0.4947529733181,
        0.7014482021331787,
        0.4124438762664795,
        0.5343977212905884,
        0.4200764000415802,
        0.3804328143596649,
        0.4745688736438751,
        0.7114101648330688,
    ],
    "auc": [
        0.8615469336509705,
        0.9565390348434448,
        0.9539301991462708,
        0.9693804383277893,
        0.9677824378013611,
        0.9714329838752747,
        0.9733365774154663,
        0.9721921682357788,
        0.9739763736724854,
        0.9758585691452026,
        0.9764041900634766,
        0.9776331186294556,
        0.9764620661735535,
        0.9764683842658997,
        0.9782542586326599,
        0.9782711267471313,
        0.9747220277786255,
        0.9735660552978516,
        0.9735260605812073,
        0.9800884127616882,
    ],
    "val_auc": [
        0.9420294165611267,
        0.971847414970398,
        0.9860363006591797,
        0.9544073343276978,
        0.980481743812561,
        0.9612299799919128,
        0.9784398674964905,
        0.9515343308448792,
        0.9837737679481506,
        0.9864334464073181,
        0.9855331778526306,
        0.9890633821487427,
        0.9873782992362976,
        0.9776875972747803,
        0.9868831038475037,
        0.9892151951789856,
        0.9887097477912903,
        0.9894945621490479,
        0.9881660342216492,
        0.9726214408874512,
    ],
}


def build_nn_training() -> go.Figure:
    """Courbe d'apprentissage du réseau de neurones (notebook ex1)."""
    epochs = list(range(1, len(_NN_TRAINING_HISTORY["loss"]) + 1))
    fig = make_subplots(rows=1, cols=2, subplot_titles=["Perte (Loss)", "AUC"])
    fig.add_trace(
        go.Scatter(x=epochs, y=_NN_TRAINING_HISTORY["loss"], mode="lines+markers", name="Train"),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(
            x=epochs, y=_NN_TRAINING_HISTORY["val_loss"], mode="lines+markers", name="Validation"
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(x=epochs, y=_NN_TRAINING_HISTORY["auc"], mode="lines+markers", name="Train"),
        row=1,
        col=2,
    )
    fig.add_trace(
        go.Scatter(
            x=epochs, y=_NN_TRAINING_HISTORY["val_auc"], mode="lines+markers", name="Validation"
        ),
        row=1,
        col=2,
    )
    fig.update_xaxes(title_text="Epoch", row=1, col=1)
    fig.update_xaxes(title_text="Epoch", row=1, col=2)
    fig.update_yaxes(title_text="Loss", row=1, col=1)
    fig.update_yaxes(title_text="AUC", row=1, col=2)
    fig.update_layout(
        title="Réseau de neurones — courbes d'apprentissage (20 epochs)",
        height=450,
        width=1000,
    )
    return fig


def all_charts(
    fraud_path: str | Path, models_dir: str | Path
) -> dict[str, Callable[[], go.Figure]]:
    """Registre des figures ex1_* pour export notebook, dashboard et API."""
    path, models = Path(fraud_path), Path(models_dir)
    return {
        "ex1_class_distribution": lambda: build_class_distribution(path),
        "ex1_amount_distribution": lambda: build_amount_distribution(path),
        "ex1_suspicious_behavior": lambda: build_suspicious_behavior(path),
        "ex1_roc_curves": lambda: build_roc_curves(path, models),
        "ex1_nn_training": lambda: build_nn_training(),
        "ex1_best_model_eval": lambda: build_best_model_eval(path, models),
        "ex1_threshold_analysis": lambda: build_threshold_analysis(path, models),
        "ex1_shap_importance": lambda: build_shap_importance(path, models),
        "ex1_shap_beeswarm": lambda: build_shap_beeswarm(path, models),
        "ex1_shap_force_plot": lambda: build_shap_force_plot(path, models),
    }
