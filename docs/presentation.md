# Présentation — Projet Machine Learning M2 CDSD

## Synthèse du projet

**Objectif :** construire un pipeline ML complet — de l'exploration des données à la mise en production — sur deux problèmes réels : fraude bancaire et segmentation marketing.

## Livrables

| Livrable | Emplacement |
|----------|-------------|
| Notebooks d'analyse | `notebooks/01_*.ipynb`, `02_*.ipynb`, `03_*.ipynb` |
| Code mutualisé | `src/` (preprocessing, training, charts) |
| Pipeline MLOps | `mlops/pipeline.py`, `mlops/api/` |
| Dashboard interactif | `frontend/` (React + Vite) |
| Rapport technique | `docs/rapport_technique.md` |
| API déployée | Render — `render.yaml` |
| Frontend déployé | Vercel — `vercel.json` |

## Résultats clés

### Fraude (XGBoost + SMOTE)

- **ROC-AUC ≈ 0.997** — excellente discrimination fraude / légitime
- **Recall ≈ 0.97** — détection de la quasi-totalité des fraudes
- Interprétabilité SHAP pour expliquer chaque décision

### Segmentation (K-Means, k=2)

- **Silhouette ≈ 0.32** — séparation correcte des profils
- Deux segments actionnables : **Premium** et **Digital**
- Visualisations PCA, radar et profils par canal d'achat

## Démonstration dashboard

Le dashboard React propose quatre modules :

1. **Fraude** — EDA, courbes ROC, SHAP, prédiction live
2. **Segmentation** — profils clusters, PCA, prédiction segment
3. **MLOps** — architecture pipeline, monitoring
4. **Livrables** — structure du dépôt et documentation

## Stack technique

- **Python 3.10** — scikit-learn, XGBoost, SHAP, FastAPI
- **React 18** — Tailwind CSS, Recharts, Plotly.js
- **CI/CD** — GitHub Actions, Render, Vercel

## Conclusion

Le projet démontre un cycle ML complet : exploration, modélisation, interprétabilité, industrialisation et exposition via une API et un dashboard moderne, prêt pour un déploiement cloud hybride.
