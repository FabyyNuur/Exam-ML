"""Utilitaires partagés : métriques, visualisations, helpers."""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, roc_curve,
    precision_recall_curve, average_precision_score,
)


def plot_class_distribution(y, title="Distribution des classes", ax=None):
    counts = pd.Series(y).value_counts()
    if ax is None:
        _, ax = plt.subplots()
    ax.bar(counts.index.astype(str), counts.values, color=["steelblue", "tomato"])
    ax.set_title(title)
    ax.set_xlabel("Classe")
    ax.set_ylabel("Nombre d'observations")
    for i, v in enumerate(counts.values):
        ax.text(i, v + 0.5, f"{v:,} ({v/len(y)*100:.1f}%)", ha="center")
    return ax


def plot_confusion_matrix(y_true, y_pred, labels=None, ax=None):
    cm = confusion_matrix(y_true, y_pred)
    if ax is None:
        _, ax = plt.subplots()
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=labels or ["Négatif", "Positif"],
        yticklabels=labels or ["Négatif", "Positif"],
        ax=ax,
    )
    ax.set_xlabel("Prédit")
    ax.set_ylabel("Réel")
    ax.set_title("Matrice de confusion")
    return ax


def plot_roc_curve(y_true, y_score, model_name="Modèle", ax=None):
    fpr, tpr, _ = roc_curve(y_true, y_score)
    auc = roc_auc_score(y_true, y_score)
    if ax is None:
        _, ax = plt.subplots()
    ax.plot(fpr, tpr, label=f"{model_name} (AUC = {auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", linewidth=0.8)
    ax.set_xlabel("Taux faux positifs")
    ax.set_ylabel("Taux vrais positifs")
    ax.set_title("Courbe ROC")
    ax.legend()
    return ax, auc


def evaluate_classifier(y_true, y_pred, y_score=None, model_name="Modèle"):
    """Affiche toutes les métriques de classification."""
    print(f"\n{'='*50}")
    print(f"  {model_name}")
    print(f"{'='*50}")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Fraude"]))
    if y_score is not None:
        auc = roc_auc_score(y_true, y_score)
        ap = average_precision_score(y_true, y_score)
        print(f"ROC-AUC  : {auc:.4f}")
        print(f"Avg Prec : {ap:.4f}")
    return {
        "model": model_name,
        "roc_auc": roc_auc_score(y_true, y_score) if y_score is not None else None,
    }


def plot_silhouette(silhouette_scores, k_range, ax=None):
    if ax is None:
        _, ax = plt.subplots()
    ax.plot(k_range, silhouette_scores, "o-", color="steelblue")
    best_k = k_range[np.argmax(silhouette_scores)]
    ax.axvline(best_k, color="tomato", linestyle="--", label=f"Meilleur k={best_k}")
    ax.set_xlabel("Nombre de clusters k")
    ax.set_ylabel("Silhouette Score")
    ax.set_title("Silhouette Score par nombre de clusters")
    ax.legend()
    return ax
