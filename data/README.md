# Données — Exam-ML

## Fichiers attendus

| Fichier | Chemin | Taille | Versionné git |
|---------|--------|--------|---------------|
| Segmentation clients | `raw/data_cluster.csv` | ~2 200 lignes | Oui |
| Détection fraude | `raw/detection_fraude.csv` | ~80 Mo, ~1 M lignes | **Non** (`.gitignore`) |

## Après clone

```bash
# 1. Placer detection_fraude.csv dans data/raw/ (fourni par l'enseignant)

# 2. Entraîner et exporter
python scripts/train_and_export.py --task all
python scripts/export_analytics.py

# 3. Ou modèles CI légers (sans gros CSV fraude)
python scripts/create_ci_models.py
python scripts/export_analytics.py
```

## Validation du schéma

Le pipeline MLOps valide automatiquement les colonnes requises :

```bash
python -m mlops.pipeline --task all
```

Colonnes fraude : `step`, `type`, `amount`, soldes, `isFraud`.

Colonnes cluster : `Year_Birth`, `Income`, `Kidhome`, `Recency`, `Mnt*`, etc.

## Versioning

- **Modèles** : `models/*.joblib` + `models/metadata.json` (métriques, labels clusters).
- **MLflow** : runs locales dans `mlruns/` (gitignoré).
- **Analytics dashboard** : `reports/analytics/*.json` (versionnés pour Render).
- **Données brutes fraude** : hors git — documenter la source et la date d'acquisition en local.

## Échantillons de test

- `samples/fraud_sample.csv` — test batch fraude
- `samples/cluster_sample.csv` — test batch segmentation
- Templates API : `GET /predict/templates/fraud` et `/predict/templates/segment`
