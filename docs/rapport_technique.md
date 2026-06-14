# Rapport technique — Projet Machine Learning M2 CDSD

## 1. Contexte et objectifs

Ce projet simule une mission de Data Scientist au sein d'une entreprise financière et marketing. Deux problématiques complémentaires sont traitées :

1. **Détection de fraude bancaire** (classification supervisée, dataset `detection_fraude.csv`, ~1 M transactions).
2. **Segmentation client** (clustering non supervisé, dataset `data_cluster.csv`, ~2 200 clients).

Une couche **MLOps** industrialise l'entraînement, le déploiement (API FastAPI + dashboard React) et le suivi.

---

## 2. Exercice 1 — Détection de fraude

### 2.1 Données et EDA

- **Déséquilibre extrême** : 0,11 % de transactions frauduleuses.
- **Montants** : moyenne fraude ≈ 101 196 € vs ≈ 33 € en légitime.
- **Types** : CASH_OUT et TRANSFER concentrent ≈ 99 % des fraudes.
- **Signaux suspects** : `orig_zeroed` (compte émetteur vidé), écarts de solde (`error_balance_orig`).

### 2.2 Prétraitement

- Features dérivées : `error_balance_orig`, `error_balance_dest`, `orig_zeroed`, encodage `type`.
- Standardisation (StandardScaler), split 80/20 stratifié.
- **SMOTE** (`sampling_strategy=0.1`) appliqué **uniquement sur le train**.

### 2.3 Modélisation

Cinq approches testées :

| Modèle | ROC-AUC CV (approx.) |
|--------|----------------------|
| Régression logistique | 0,989 |
| Random Forest | 0,991 |
| **XGBoost** | **0,996** |
| LightGBM | 0,989 |
| Réseau de neurones (Keras 128-64-32) | exploratoire |

**Modèle retenu** : XGBoost + SMOTE, seuil de décision **30 %** (priorité au recall).

### 2.4 Évaluation (jeu de test)

| Métrique | Valeur | Commentaire |
|----------|--------|-------------|
| **Accuracy** | ≈ 0,999 | Élevée mais **trompeuse** (classe majoritaire) |
| **ROC-AUC** | ≈ 0,997 | Discrimination excellente |
| **Recall** | ≈ 0,97 | Quasi-totalité des fraudes détectées |
| **Precision** | modérée | Conséquence du déséquilibre |
| **F1** | ≈ 0,61 | Compromis au seuil 30 % |

### 2.5 Interprétabilité

- Importance des variables (XGBoost) et **SHAP** (global, beeswarm, force plot).
- Analyse des **faux positifs** et **faux négatifs** pour ajuster le seuil métier.

---

## 3. Exercice 2 — Segmentation client

### 3.1 EDA et prétraitement

- Nettoyage (revenus > 600 k€, statuts maritaux aberrants).
- Features : âge, enfants, dépense totale, achats web/magasin, récence.
- Standardisation + **PCA** exploratoire.

### 3.2 Clustering

Algorithmes comparés : **K-Means**, DBSCAN, Agglomerative, GMM.

- **Pic Silhouette** : k=2 (≈ 0,32).
- **Choix production** : **k=2** (optimal statistique, modèle API).
- **Analyse complémentaire** : **k=4** pour les quatre profils marketing du sujet.

| Métrique | k=2 (production) | k=4 (analyse marketing) |
|----------|------------------|-------------------------|
| Silhouette | ≈ 0,32 (pic) | légèrement inférieure |
| Davies-Bouldin | acceptable | acceptable |

### 3.3 Profils identifiés

| Profil | Caractéristiques | Action marketing |
|--------|------------------|------------------|
| **Premium** | Revenu et panier élevés | Fidélité, cross-sell haut de gamme |
| **Digital** | Segment masse, panier modéré | Offres web ciblées |
| **Promo-sensible** | Réceptif aux campagnes | Coupons ciblés |
| **Dormant** | Récence élevée, faible activité | Campagne de réactivation |

---

## 4. Architecture MLOps

```
Données CSV → validation (pipeline.py) → entraînement (training.py)
    → export joblib + metadata.json → MLflow (local)
    → analytics JSON + figures Plotly → API FastAPI
    → Dashboard React (Vite) + rapports PDF A4
```

- **CI/CD** : GitHub Actions (lint, tests, build frontend).
- **Déploiement** : Render (prod) ou **Docker** (local, voir `Dockerfile`).
- **Monitoring** : `/health`, `/metadata`, simulation PSI (notebook 03).

---

## 5. Livrables

| Livrable | Emplacement |
|----------|-------------|
| Notebooks commentés | `notebooks/` |
| Code mutualisé | `src/`, `mlops/` |
| Dashboard interactif | `frontend/` |
| Rapports PDF | `/rapports` dans le dashboard |
| Présentation | `docs/presentation.md` |
| Dépôt GitHub | https://github.com/FabyyNuur/Exam-ML |

---

## 6. Limites et perspectives

- `detection_fraude.csv` (~80 Mo) n'est pas versionné dans git — à placer localement après clone.
- L'accuracy seule est insuffisante pour la fraude ; le recall et le ROC-AUC priment.
- k=2 en production (Silhouette optimale) ; k=4 réservé à l'analyse marketing des quatre profils.
- Monitoring PSI simulé — à connecter à un flux de production réel en entreprise.
