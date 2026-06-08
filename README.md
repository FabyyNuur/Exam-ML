# Projet Machine Learning — M2 CDSD

Détection de fraude bancaire, segmentation client et architecture MLOps.

## Structure du projet

```
Exam-ML/
├── data/
│   └── raw/                    # Données brutes (detection_fraude.csv ignorée par git)
├── notebooks/
│   ├── 01_exercice1_detection_fraude.ipynb
│   ├── 02_exercice2_segmentation_clients.ipynb
│   └── 03_mlops_architecture.ipynb
├── src/
│   ├── preprocessing.py        # Fonctions de nettoyage et feature engineering
│   ├── models.py               # Wrappers et helpers de modèles
│   ├── display.py              # Composants HTML (hero, KPI, badges, tableaux)
│   └── utils.py                # Utilitaires (métriques, visualisations Plotly)
├── mlops/
│   ├── pipeline.py             # Pipeline de données avec validation
│   ├── api/
│   │   └── app.py              # API FastAPI
│   └── Dockerfile
├── reports/
│   └── figures/                # Graphiques exportés
├── requirements.txt
└── .gitignore
```

## Données

| Fichier | Taille | Source | Suivi git |
|---|---|---|---|
| `data_cluster.csv` | ~220 KB | Fourni | ✅ inclus |
| `detection_fraude.csv` | ~80 MB | Fourni | ❌ ignoré (trop lourd) |

> **Pour utiliser `detection_fraude.csv`** : placer le fichier dans `data/raw/` avant de lancer les notebooks.

## Installation

```bash
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
jupyter notebook
```

## Affichage notebook

Les notebooks utilisent [`src/display.py`](src/display.py) pour un rendu HTML cohérent (style dashboard) :

- `init_notebook_theme()` — injecte le CSS global (à appeler une fois en début de session)
- `show_hero`, `show_section`, `show_insight`, `show_metrics_row`, `show_badge`, etc.
- Graphiques Plotly harmonisés via `show_figure()` dans [`src/utils.py`](src/utils.py)

Après modification du code source, redémarrer le kernel Jupyter ou réexécuter la cellule d'imports.

## Exercices

### Exercice 1 — Détection de fraude
Notebook : [`notebooks/01_exercice1_detection_fraude.ipynb`](notebooks/01_exercice1_detection_fraude.ipynb)

- EDA sur les transactions financières
- Gestion du déséquilibre des classes (SMOTE, class_weight)
- Modèles : Régression Logistique, Random Forest, XGBoost, LightGBM, Réseau de neurones
- Évaluation : Accuracy, Precision, Recall, F1, ROC-AUC
- Interprétabilité SHAP et analyse faux positifs/négatifs

### Exercice 2 — Segmentation client
Notebook : [`notebooks/02_exercice2_segmentation_clients.ipynb`](notebooks/02_exercice2_segmentation_clients.ipynb)

- EDA et nettoyage (outliers Income, valeurs aberrantes)
- Clustering : K-Means, DBSCAN, Agglomerative, GMM
- Évaluation : Silhouette Score, Elbow Method, Davies-Bouldin
- Identification de profils : Premium, Digital, Promo-sensibles, Dormants
- Recommandations business et campagnes marketing

### Partie commune — MLOps
Notebook : [`notebooks/03_mlops_architecture.ipynb`](notebooks/03_mlops_architecture.ipynb)

- Pipeline de données (ingestion → validation → nettoyage)
- Versionning (DVC, MLflow)
- Architecture de déploiement (FastAPI + Docker)
- Monitoring et détection de dérive
- CI/CD avec GitHub Actions

## Résultats clés

> *À compléter après exécution des notebooks.*

## Auteurs

Projet réalisé dans le cadre du cours Machine Learning — M2 CDSD.
