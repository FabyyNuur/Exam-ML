"""Configuration des pages du dashboard et chemins des artefacts."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
FIGURES_DIR = ROOT / "reports" / "figures"
ANALYTICS_DIR = ROOT / "reports" / "analytics"
METADATA_PATH = ROOT / "models" / "metadata.json"

COLORS = {
    "primary": "#4682B4",
    "secondary": "#FF6347",
    "accent": "#FF7F50",
    "neutral": "#708090",
    "success": "#2E8B57",
    "warning": "#FFA500",
    "danger": "#DC3545",
    "bg": "#F8FAFC",
    "card": "#FFFFFF",
    "text": "#1E293B",
    "muted": "#64748B",
}

PHASES = [
    {"id": "eda", "label": "EDA", "color": COLORS["primary"]},
    {"id": "preprocessing", "label": "Prétraitement", "color": COLORS["accent"]},
    {"id": "modeling", "label": "Modélisation", "color": COLORS["secondary"]},
    {"id": "evaluation", "label": "Évaluation", "color": COLORS["success"]},
    {"id": "interpretation", "label": "Interprétabilité", "color": COLORS["warning"]},
    {"id": "mlops", "label": "MLOps", "color": COLORS["neutral"]},
]

PAGES = [
    {
        "id": "home",
        "label": "Accueil",
        "section": None,
        "phase": None,
        "title": "Exam-ML — Pipeline Machine Learning",
        "subtitle": "Détection de fraude & segmentation client — M2 CDSD",
        "insights": [
            "Parcours complet : exploration → prétraitement → modélisation → évaluation → déploiement.",
            "Exercice 1 : classification binaire déséquilibrée (XGBoost + SMOTE).",
            "Exercice 2 : clustering non supervisé (K-Means, k=2).",
            "API FastAPI pour l'inférence en production.",
        ],
        "figures": [],
    },
    {
        "id": "ex1_eda",
        "label": "Ex1 — EDA",
        "section": "Exercice 1 · Fraude",
        "phase": "eda",
        "title": "Exploration des transactions",
        "subtitle": "Analyse exploratoire — detection_fraude.csv (~1 M lignes)",
        "insights": [
            "Le jeu de données présente un déséquilibre : environ 0,1 % des transactions sont frauduleuses.",
            "Les montants et les soldes des comptes sont très asymétriques entre transactions légitimes et frauduleuses.",
            "L'analyse révèle des comportements suspects, notamment des comptes vidés après un transfert massif.",
        ],
        "figures": [
            (
                "ex1_class_distribution.png",
                "Distribution des classes",
                "Déséquilibre extrême isFraud",
                "Moins d'une transaction sur mille est frauduleuse. Ce déséquilibre impose des stratégies "
                "de rééquilibrage et des métriques adaptées (ROC-AUC, recall) plutôt que l'accuracy seule.",
            ),
            (
                "ex1_amount_distribution.png",
                "Distribution des montants",
                "Montants par type de transaction",
                "Les montants des transactions frauduleuses tendent à être plus élevés et plus dispersés que ceux "
                "des transactions normales, en particulier pour les transferts (TRANSFER) et les retraits (CASH_OUT).",
            ),
            (
                "ex1_suspicious_behavior.png",
                "Comportements suspects",
                "Patterns de fraude identifiés en EDA",
                "Les schémas typiques de fraude incluent le vidage du compte émetteur (orig_zeroed) et des écarts "
                "importants entre le montant transféré et la variation réelle du solde (error_balance).",
            ),
        ],
    },
    {
        "id": "ex1_preprocessing",
        "label": "Ex1 — Prétraitement",
        "section": "Exercice 1 · Fraude",
        "phase": "preprocessing",
        "title": "Feature engineering & rééquilibrage",
        "subtitle": "Variables dérivées et gestion du déséquilibre",
        "insights": [
            "Features dérivées : error_balance_orig, error_balance_dest, orig_zeroed.",
            "Encodage ordinal du type de transaction (PAYMENT → 0 … CASH_IN → 4).",
            "Standardisation (StandardScaler) avant entraînement.",
            "SMOTE appliqué sur le train (ratio 10 %) pour améliorer le recall.",
        ],
        "figures": [],
    },
    {
        "id": "ex1_modeling",
        "label": "Ex1 — Modélisation",
        "section": "Exercice 1 · Fraude",
        "phase": "modeling",
        "title": "Comparaison des modèles",
        "subtitle": "Validation croisée stratifiée (ROC-AUC)",
        "insights": [
            "La validation croisée stratifiée sur 5 folds utilise le ROC-AUC comme métrique principale de comparaison.",
            "Quatre modèles ont été testés : régression logistique, Random Forest, XGBoost et LightGBM.",
            "XGBoost est retenu avec un CV ROC-AUC d'environ 0,996, offrant le meilleur compromis entre discrimination et stabilité.",
            "Le seuil décisionnel a été abaissé à 30 % afin de maximiser le rappel dans un contexte de détection de fraude.",
        ],
        "figures": [
            (
                "ex1_roc_curves.png",
                "Courbes ROC",
                "Comparaison des 4 modèles",
                "Les courbes ROC montrent que XGBoost et LightGBM atteignent les AUC les plus élevés (supérieurs à 0,99). "
                "La diagonale en pointillés représente un classifieur aléatoire ; plus une courbe s'en éloigne vers le "
                "coin supérieur gauche, meilleure est la discrimination du modèle.",
            ),
        ],
        "metadata_key": "fraud",
    },
    {
        "id": "ex1_evaluation",
        "label": "Ex1 — Évaluation",
        "section": "Exercice 1 · Fraude",
        "phase": "evaluation",
        "title": "Performance & interprétabilité",
        "subtitle": "Métriques test set + analyse SHAP",
        "insights": [
            "Sur le jeu de test, le modèle atteint un ROC-AUC de 0,997, un recall de 0,97 et un F1 de 0,61 au seuil de 30 %.",
            "Un faux positif correspond à une transaction normale bloquée à tort ; un faux négatif à une fraude non détectée, ce qui est l'erreur la plus critique.",
            "L'analyse SHAP montre que orig_zeroed, error_balance et amount sont parmi les variables les plus influentes.",
            "L'étude des faux positifs et faux négatifs permet d'affiner le seuil de décision selon la politique métier.",
        ],
        "figures": [
            (
                "ex1_best_model_eval.png",
                "Évaluation XGBoost",
                "Matrice de confusion & métriques",
                "Au seuil de 30 %, le modèle atteint un recall d'environ 97 %, ce qui signifie que la quasi-totalité "
                "des fraudes sont détectées. La precision reste plus modérée en raison du fort déséquilibre des classes.",
            ),
            (
                "ex1_threshold_analysis.png",
                "Analyse du seuil",
                "Compromis precision / recall",
                "L'analyse du seuil met en évidence le compromis entre precision et recall. Un seuil abaissé à 30 % "
                "permet de limiter les faux négatifs (fraudes non détectées), qui sont les erreurs les plus coûteuses "
                "dans un contexte de lutte contre la fraude.",
            ),
            (
                "ex1_shap_importance.png",
                "Importance SHAP globale",
                "Features les plus discriminantes",
                "L'importance SHAP globale confirme que les variables liées aux soldes (orig_zeroed, error_balance) "
                "et au montant de la transaction (amount) sont les plus discriminantes pour prédire une fraude.",
            ),
            (
                "ex1_shap_beeswarm.png",
                "SHAP beeswarm",
                "Impact directionnel par observation",
                "Le graphique beeswarm montre l'impact directionnel de chaque variable : une valeur SHAP élevée "
                "(rouge) pousse la prédiction vers la fraude, tandis qu'une valeur faible (bleu) indique une "
                "transaction légitime.",
            ),
            (
                "ex1_shap_force_plot.png",
                "SHAP force plot",
                "Explication locale d'une prédiction",
                "Le force plot détaille l'explication locale d'une transaction frauduleuse : chaque barre représente "
                "la contribution d'une feature à la probabilité de fraude prédite par le modèle.",
            ),
        ],
        "metadata_key": "fraud",
    },
    {
        "id": "ex2_eda",
        "label": "Ex2 — EDA",
        "section": "Exercice 2 · Segmentation",
        "phase": "eda",
        "title": "Exploration des clients",
        "subtitle": "Analyse exploratoire — data_cluster.csv (~2 200 clients)",
        "insights": [
            "Dataset : ~2 200 clients, variables démographiques (âge, revenu, enfants), comportementales (achats web/magasin, récence) et marketing (campagnes, réponse).",
            "Outliers sur Income (> 600 000 €) : clients atypiques à exclure avant clustering.",
            "Modalités aberrantes Marital_Status (YOLO, Absurd) signalant des erreurs de saisie.",
            "Corrélations fortes entre dépenses par catégorie (MntWines, MntMeat, MntFish…) : redondance à surveiller.",
            "Réponse aux campagnes (Accept vs Reject) : base pour le ciblage marketing post-segmentation.",
        ],
        "figures": [
            ("ex2_distributions.png", "Distributions", "Revenus, âge, dépenses"),
            ("ex2_correlation.png", "Matrice de corrélation", "Liens entre variables numériques"),
            ("ex2_categorical.png", "Variables catégorielles", "Éducation, statut marital, canaux"),
            ("ex2_spending_channels.png", "Canaux de dépense", "Répartition MntWines, MntMeat…"),
            ("ex2_campaign_response.png", "Réponse campagnes", "Acceptation des promotions"),
        ],
    },
    {
        "id": "ex2_preprocessing",
        "label": "Ex2 — Prétraitement",
        "section": "Exercice 2 · Segmentation",
        "phase": "preprocessing",
        "title": "Nettoyage & features dérivées",
        "subtitle": "Préparation des données pour le clustering",
        "insights": [
            "[Nettoyage] Suppression des outliers Income (> 600 000 €) et correction Marital_Status (Alone → Single, YOLO/Absurd → NaN).",
            "[Features] Age (2024 − Year_Birth), Children (Kidhome + Teenhome), TotalSpend (somme Mnt*), TotalPurchases (somme *Purchases).",
            "[Imputation] Valeurs manquantes numériques remplacées par la médiane.",
            "[Encodage] Variables catégorielles encodées (LabelEncoder) pour analyse exploratoire complémentaire.",
            "[Standardisation] StandardScaler appliqué avant clustering — indispensable pour K-Means sur échelles hétérogènes.",
            "[PCA] Réduction dimensionnelle explorée (scree plot) pour visualisation 2D sans perdre la structure.",
        ],
        "figures": [],
    },
    {
        "id": "ex2_modeling",
        "label": "Ex2 — Modélisation",
        "section": "Exercice 2 · Segmentation",
        "phase": "modeling",
        "title": "Sélection de l'algorithme & k optimal",
        "subtitle": "K-Means, DBSCAN, Agglomerative, GMM",
        "insights": [
            "Sélection de k (2–10) : critères Elbow (inertie), Silhouette (max ≈ 0,32 à k=2) et Davies-Bouldin (min).",
            "Algorithmes comparés : K-Means, DBSCAN, Agglomerative Clustering, GMM (Gaussian Mixture).",
            "K-Means retenu : interprétabilité des centroïdes, stabilité et coût calcul raisonnable.",
            "k optimal = 2 : séparation nette Premium (revenus/dépenses élevés) vs Digital (achats web dominants).",
            "Dendrogramme hiérarchique : confirme la structure à 2–3 groupes principaux.",
        ],
        "figures": [
            ("ex2_kmeans_selection.png", "Sélection de k", "Silhouette & Elbow"),
            ("ex2_pca_scree.png", "Scree plot PCA", "Variance expliquée"),
            ("ex2_dendrogram.png", "Dendrogramme", "Clustering hiérarchique"),
            ("ex2_clustering_comparison.png", "Comparaison algorithmes", "K-Means vs DBSCAN vs GMM"),
        ],
        "metadata_key": "cluster",
    },
    {
        "id": "ex2_evaluation",
        "label": "Ex2 — Évaluation",
        "section": "Exercice 2 · Segmentation",
        "phase": "evaluation",
        "title": "Profils clients & recommandations",
        "subtitle": "Interprétation métier des clusters",
        "insights": [
            "Silhouette ≈ 0,32 et Davies-Bouldin ≈ 1,29 : séparation acceptable pour un clustering marketing.",
            "Variance PCA : les 2 premières composantes capturent l'essentiel de la structure pour la visualisation.",
            "Centroïdes normalisés : Income et TotalSpend discriminent fortement le cluster Premium.",
            "NumWebPurchases et Recency caractérisent le cluster Digital (engagement canal web).",
        ],
        "figures": [
            ("ex2_cluster_profiles.png", "Profils par cluster", "Centroïdes normalisés"),
            ("ex2_radar_profiles.png", "Radar des profils", "Comparaison multi-dimensions"),
        ],
        "metadata_key": "cluster",
    },
    {
        "id": "ex2_interpretation",
        "label": "Ex2 — Interprétabilité",
        "section": "Exercice 2 · Segmentation",
        "phase": "interpretation",
        "title": "Profils clients & recommandations business",
        "subtitle": "Actions marketing par segment — synthèse stratégique",
        "insights": [
            "Premium : programme fidélité haut de gamme, offres exclusives, cross-sell produits premium.",
            "Digital : campagnes e-mail et push, promotions ciblées sur le canal web, parcours mobile.",
            "Personnaliser chaque campagne selon le profil cluster plutôt qu'un envoi massif.",
            "Recalculer les segments mensuellement et suivre la Silhouette pour détecter une dérive comportementale.",
            "Synthèse : k=2 offre un compromis lisible pour les équipes marketing tout en restant actionnable.",
        ],
        "figures": [
            ("ex2_cluster_profiles.png", "Profils par cluster", "Centroïdes normalisés"),
            ("ex2_radar_profiles.png", "Radar des profils", "Comparaison multi-dimensions"),
        ],
        "metadata_key": "cluster",
    },
    {
        "id": "mlops",
        "label": "MLOps & Monitoring",
        "section": "Industrialisation",
        "phase": "mlops",
        "title": "Déploiement & suivi",
        "subtitle": "API FastAPI · MLflow · CI/CD · dérive",
        "insights": [
            "Pipeline reproductible : mlops/pipeline.py (validate → train → export).",
            "Modèles versionnés dans models/*.joblib + metadata.json.",
            "Endpoint /health et /metadata pour le monitoring.",
            "Simulation PSI (Population Stability Index) pour détecter la dérive.",
        ],
        "figures": [
            ("mlops_monitoring.png", "Monitoring & dérive", "Distribution des scores et PSI"),
        ],
    },
    {
        "id": "predict",
        "label": "Prédiction live",
        "section": "Industrialisation",
        "phase": "mlops",
        "title": "Inférence en temps réel",
        "subtitle": "Interface connectée à l'API FastAPI",
        "insights": [],
        "figures": [],
        "is_predict": True,
    },
]

DEFAULT_PAGE = "home"


def serialize_pages() -> list[dict]:
    """Sérialise PAGES pour l'API JSON (figures en listes de dicts)."""
    result = []
    for page in PAGES:
        entry = {k: v for k, v in page.items() if k != "figures"}
        entry["figures"] = [
            {
                "filename": f[0],
                "title": f[1],
                "caption": f[2],
                "interpretation": f[3] if len(f) > 3 else f[2],
            }
            for f in page.get("figures", [])
        ]
        result.append(entry)
    return result
