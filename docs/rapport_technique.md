# Rapport technique — Projet Machine Learning M2 CDSD

## 1. Contexte

Ce projet couvre deux cas d'usage métier :

1. **Détection de fraude bancaire** sur des transactions (`detection_fraude.csv`)
2. **Segmentation client** pour le marketing (`data_cluster.csv`)

Une couche **MLOps** expose les modèles via une API FastAPI et un dashboard React interactif.

## 2. Exercice 1 — Détection de fraude

### Données et prétraitement

- Variables : montant, type de transaction, soldes origine/destination, step temporel
- Encodage one-hot du type de transaction, standardisation des features numériques
- Gestion du déséquilibre de classes via **SMOTE** à l'entraînement

### Modélisation

| Modèle | ROC-AUC (CV) |
|--------|--------------|
| Logistic Regression | ~0.99 |
| Random Forest | ~0.99 |
| **XGBoost** | **~0.996** |

**Modèle retenu : XGBoost** — meilleur compromis recall / précision sur la classe minoritaire.

| Métrique | Valeur |
|----------|--------|
| ROC-AUC | 0.997 |
| Recall | 0.97 |
| F1 | 0.61 |
| Precision | 0.45 |

L'interprétabilité est assurée par **SHAP** (beeswarm, force plot, importance globale).

## 3. Exercice 2 — Segmentation clients

### Approche

- Features : revenu, âge, dépenses totales, canaux d'achat, récence, enfants
- Sélection de k via **Elbow**, **Silhouette** et **Davies-Bouldin**
- Algorithme retenu : **K-Means** avec **k = 2**

| Métrique | Valeur |
|----------|--------|
| Silhouette | 0.32 |
| Davies-Bouldin | 1.29 |

### Profils identifiés

| Cluster | Label | Caractéristiques |
|---------|-------|------------------|
| 0 | Digital | Achats web dominants, panier modéré |
| 1 | Premium | Revenus élevés, dépenses store et web importantes |

## 4. Architecture MLOps

```
Notebooks / Pipeline CLI
        ↓
   models/*.joblib + metadata.json
        ↓
   FastAPI (Render) ←→ React Dashboard (Vercel)
        ↓
   reports/analytics/*.json + plotly/*.json
```

### Composants

| Composant | Rôle |
|-----------|------|
| `src/training.py` | Entraînement reproductible fraude + cluster |
| `mlops/pipeline.py` | CLI d'orchestration |
| `mlops/api/` | Inférence, analytics, figures, contenu pédagogique |
| `scripts/export_analytics.py` | Export JSON pour le dashboard |
| `frontend/` | Interface React (Recharts + Plotly) |

### Déploiement

- **API** : Render (`render.yaml`) — build génère modèles CI et analytics
- **Frontend** : Vercel (`vercel.json`) — build Vite, proxy dev local
- **CI** : GitHub Actions — lint, tests, build frontend

## 5. Tests et qualité

- 23 tests : API (endpoints, prédiction), preprocessing, pipeline, export Plotly
- Lint : black, isort, flake8 sur `src/` et `mlops/`

## 6. Limites et pistes d'amélioration

- Le recall élevé sur la fraude s'accompagne d'une précision modérée (faux positifs)
- k=2 simplifie l'interprétation mais pourrait être affiné avec davantage de features comportementales
- Monitoring de dérive et réentraînement automatique à implémenter en production
