# Projet Machine Learning — M2 CDSD

Détection de fraude bancaire, segmentation client et architecture MLOps avec dashboard React interactif.

## Structure du projet

```
Exam-ML/
├── render.yaml                 # Blueprint Render (API + frontend static)
├── requirements.txt            # Dépendances prod API (Render)
├── requirements-dev.txt        # Notebooks, lint et dev local
├── data/raw/                   # Données (symlinks ou CSV locaux)
├── models/                     # Modèles exportés (*.joblib, metadata.json)
├── notebooks/                  # Analyses et notebooks MLOps
├── frontend/                   # Dashboard React (Vite + Tailwind)
├── scripts/
│   ├── train_and_export.py     # Entraînement + export des modèles
│   ├── export_analytics.py     # Export JSON Recharts + figures Plotly
│   └── create_ci_models.py     # Modèles légers pour la CI
├── src/                        # Code mutualisé (preprocessing, training, viz)
├── mlops/
│   ├── api/                    # API FastAPI (inférence + figures + analytics)
│   ├── content/                # Contenu pédagogique des pages
│   └── pipeline.py             # Pipeline reproductible CLI
├── tests/                      # Tests unitaires et API
├── reports/
│   ├── figures/                # PNG notebooks (gitignorés) + mlops_monitoring.png
│   └── analytics/              # JSON Recharts + plotly/*.json (gitignoré, voir export ci-dessous)
└── docs/
    ├── rapport_technique.md
    └── presentation.md
```

## Données

| Fichier | Source | Suivi git |
|---|---|---|
| `data_cluster.csv` | Fourni | Inclus (symlink dans `data/raw/`) |
| `detection_fraude.csv` | Fourni (~80 Mo) | Ignoré — placer dans `data/raw/` |

## Installation

```bash
python3.10 -m venv .venv   # Python >=3.10 recommandé (Render utilise 3.10)
source .venv/bin/activate   # obligatoire — ne pas utiliser conda (base) directement
pip install -r requirements-dev.txt   # notebooks + lint + API + tests

cd frontend && npm install
```

Après clone, générer les analytics pour le dashboard (nécessite `data/raw/data_cluster.csv`) :

```bash
python scripts/create_ci_models.py   # ou train_and_export.py pour des modèles réels
python scripts/export_analytics.py
```

Pour l'API seule (sans notebooks ni tests) : `pip install -r requirements.txt`

> **Important :** le projet impose `numpy<2` (voir `requirements.txt`). L'environnement **conda (base)** installe souvent NumPy 2.x, incompatible avec scipy/xgboost/numexpr déjà compilés. Utilisez toujours le venv du projet.

## Entraînement et export des modèles

```bash
python scripts/train_and_export.py --task all
# ou
python -m mlops.pipeline --task fraud|cluster|all
```

Produit dans `models/` :
- `fraud_model.joblib`, `fraud_scaler.joblib`
- `cluster_model.joblib`, `cluster_scaler.joblib`
- `metadata.json` (métriques et labels métier)

Et dans `reports/analytics/` :
- JSON agrégés pour les KPI Recharts (`fraud_eda.json`, `cluster_eda.json`, etc.)
- Figures Plotly interactives dans `reports/analytics/plotly/*.json` (consommées par le dashboard via `react-plotly.js`)

Pour régénérer les analytics sans réentraîner les modèles (Python ≥ 3.10 recommandé) :

```bash
python3.12 scripts/export_analytics.py
```

Les figures Plotly du dashboard sont produites par les builders `src/charts/` (`fraud.py`, `segmentation.py`) avec **échantillonnage automatique** (`src/charts/sampling.py`) pour garder les JSON légers. Les notebooks `01` et `02` appellent ces mêmes builders via `show_figure()` — ne pas reconstruire de histogrammes ou scatter sur le dataset brut.

Les graphiques lourds (ROC, SHAP, comparaison d'algorithmes) nécessitent les modèles entraînés dans `models/`.

## Lancement local

### API + Dashboard (développement)

Terminal 1 — API (recommandé) :
```bash
bash scripts/run_api.sh
```

Ou manuellement après activation du venv :
```bash
source .venv/bin/activate
uvicorn mlops.api.app:app --reload --port 8000
```

Terminal 2 — Frontend React :
```bash
cd frontend && npm run dev
```

Interface : http://localhost:5173 (proxy API vers :8000)

### Preview production locale

En production, le frontend et l'API sont sur **Render** (voir § Déploiement cloud).

Pour simuler la prod en local, lancer l'API et le build Vite en parallèle :

Terminal 1 — API :
```bash
uvicorn mlops.api.app:app --port 8000
```

Terminal 2 — Frontend (build + preview) :
```bash
cd frontend && npm run build && VITE_API_URL=http://localhost:8000 npm run preview
```

Interface : http://localhost:4173

### Endpoints API

| Route | Description |
|---|---|
| `GET /health` | Statut des modèles |
| `GET /metadata` | Métriques fraude & cluster |
| `POST /predict/fraud` | Scoring transaction (saisie unitaire) |
| `POST /predict/fraud/batch` | Scoring batch via upload CSV |
| `POST /predict/segment` | Segmentation client (saisie unitaire) |
| `POST /predict/segment/batch` | Segmentation batch via upload CSV |
| `GET /predict/templates/{kind}` | Téléchargement d'un CSV modèle (`fraud` ou `segment`) |
| `GET /figures/{filename}` | Figures PNG |
| `GET /content/pages` | Contenu pédagogique |
| `GET /analytics/fraud/eda` | Stats EDA fraude |
| `GET /analytics/fraud/models` | Comparaison modèles |
| `GET /analytics/cluster/eda` | Stats EDA clients (revenus, canaux, campagnes) |
| `GET /analytics/cluster/k-selection` | Courbes Elbow / Silhouette / Davies-Bouldin |
| `GET /analytics/cluster/summary` | Scatter PCA 2D |
| `GET /analytics/charts` | Liste des graphiques Plotly disponibles |
| `GET /analytics/charts/{id}` | Figure Plotly JSON (ex. `ex2_correlation`) |

### Tester les modèles (dashboard)

Dans les modules **Fraude** et **Segmentation**, le bouton **TESTER LE MODÈLE** ouvre une modale avec deux onglets :

1. **Upload CSV** — déposez un fichier (max 8 Mo) pour scorer en batch.
2. **Saisie manuelle** — test unitaire via formulaire.

**Formats CSV attendus :**

| Exercice | Colonnes requises | Évaluation auto |
|---|---|---|
| Fraude | `step`, `type`, `amount`, `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest` | Si `isFraud` présent → ROC-AUC, F1, matrice de confusion |
| Segmentation | Format brut client (`Year_Birth`, `Income`, `Kidhome`, `Teenhome`, `Mnt*`, `NumWebPurchases`, `NumStorePurchases`, `Recency`, …) | — |

Modèles téléchargeables : `GET /predict/templates/fraud` et `GET /predict/templates/segment` (fichiers dans `data/samples/`).

## Modules du dashboard

| Module | Contenu |
|---|---|
| Fraude | EDA, prétraitement, modélisation XGBoost, SHAP, test CSV + saisie manuelle |
| Segmentation | EDA clients, K-Means k=2, profils Premium/Digital, test CSV + saisie manuelle |
| MLOps | Pipeline, déploiement, monitoring |
| Livrables | Structure du dépôt et documentation |

## Notebooks

| Notebook | Contenu |
|---|---|
| `01_exercice1_detection_fraude.ipynb` | Exercice 1 complet (EDA → SHAP) |
| `02_exercice2_segmentation_clients.ipynb` | Exercice 2 clustering |
| `03_mlops_architecture.ipynb` | Architecture MLOps |

## Tests

27 tests (API, preprocessing, pipeline) :

```bash
pytest tests/ -v
```

## Dépannage

### `ImportError: numpy.core.multiarray failed to import` / NumPy 2.x

Cause : uvicorn lancé depuis **conda (base)** avec NumPy 2.x alors que scipy, xgboost, numexpr ont été compilés pour NumPy 1.x.

Solution :
```bash
cd Exam-ML
bash scripts/run_api.sh
# ou
source .venv/bin/activate && uvicorn mlops.api.app:app --reload --port 8000
```

Si le venv n'existe pas encore :
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
```

## Résultats clés

| Exercice | Meilleur modèle | Métrique principale |
|---|---|---|
| Fraude | XGBoost + SMOTE | ROC-AUC ≈ **0.997**, Recall ≈ **0.97** |
| Segmentation | K-Means (k=2) | Silhouette ≈ **0.32** |

Profils clients identifiés : **Premium**, **Digital** (k=2 sur features API).

## Déploiement cloud

Tout le projet se déploie sur **Render** via le blueprint [`render.yaml`](render.yaml) :

| Service | Type Render | URL par défaut |
|---------|-------------|----------------|
| `exam-ml-api` | Web Service (Python) | `https://exam-ml-api.onrender.com` |
| `exam-ml-frontend` | Static Site (Vite) | `https://exam-ml-frontend.onrender.com` |

### Mise en place

1. Connecter le dépôt GitHub à Render → **New Blueprint**
2. Render crée les deux services à partir de `render.yaml`
3. Le build API exécute `create_ci_models.py` + `export_analytics.py`
4. Le build frontend injecte `VITE_API_URL=https://exam-ml-api.onrender.com`

Variables déjà configurées dans le blueprint :
- **API** : `CORS_ORIGINS` autorise le frontend Render + localhost
- **Frontend** : `VITE_API_URL` pointe vers l'API Render

Voir [`frontend/.env.example`](frontend/.env.example) pour le dev local.

## Auteurs

Projet réalisé dans le cadre du cours Machine Learning — M2 CDSD.
