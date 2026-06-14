# Présentation — Projet ML M2 CDSD

> Plan de soutenance (~15 min) — Exam-ML

---

## Slide 1 — Titre

**Détection de fraude, segmentation client et MLOps**

M2 CDSD — Projet Machine Learning

---

## Slide 2 — Contexte

- Entreprise financière + marketing
- Deux jeux de données : transactions bancaires (~1 M lignes) et clients CRM (~2 200)
- Objectif : modèles actionnables + industrialisation

---

## Slide 3 — Exercice 1 : problème

- Classifier `isFraud` (0/1)
- **0,11 % de fraudes** → métriques adaptées (ROC-AUC, recall, pas seulement accuracy)
- Enjeu : limiter les **faux négatifs** (fraudes non détectées)

---

## Slide 4 — Exercice 1 : méthode

- EDA : montants, types, comportements suspects (`orig_zeroed`)
- Prétraitement : feature engineering, SMOTE sur train
- 5 modèles testés → **XGBoost** retenu
- SHAP + analyse FP/FN

---

## Slide 5 — Exercice 1 : résultats

| Métrique | Valeur |
|----------|--------|
| Accuracy | ~99,9 % (biaisée) |
| ROC-AUC | ~0,997 |
| Recall | ~97 % |

Seuil 30 % pour maximiser la détection.

---

## Slide 6 — Exercice 2 : problème

- Segmenter la base client pour campagnes différenciées
- Variables : démographie, dépenses, canaux, campagnes
- Clustering non supervisé (4 algorithmes comparés)

---

## Slide 7 — Exercice 2 : choix k=4

- Pic Silhouette à **k=2** (~0,32)
- **k=4 retenu** : Premium, Digital, Promo-sensible, Dormant
- Compromis statistique / actionnabilité marketing

---

## Slide 8 — Exercice 2 : profils et actions

| Profil | Action |
|--------|--------|
| Premium | Fidélité haut de gamme |
| Digital | Offres web ciblées |
| Promo-sensible | Coupons |
| Dormant | Réactivation |

---

## Slide 9 — Architecture MLOps

- Pipeline CLI : `mlops/pipeline.py`
- API FastAPI : inférence batch + unitaire
- Dashboard React connecté
- MLflow + GitHub Actions + Docker

**Démo live** : modules Fraude / Segmentation → TESTER LE MODÈLE

---

## Slide 10 — Déploiement

- **Render** : API + frontend static (prod)
- **Docker** : `docker compose up` (local)
- Endpoints : `/health`, `/metadata`, `/predict/*`

---

## Slide 11 — Livrables

- 3 notebooks structurés
- Rapport technique (`docs/rapport_technique.md`)
- Dashboard + rapports PDF A4
- Dépôt GitHub professionnel

---

## Slide 12 — Conclusion

- Fraude : XGBoost performant, interprétabilité SHAP
- Segmentation : 4 profils marketing actionnables
- MLOps : pipeline reproductible, CI/CD, monitoring
- Perspectives : drift réel, réentraînement automatique

**Questions ?**
