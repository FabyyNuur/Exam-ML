# flake8: noqa: E501
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
            "Exercice 1 : classification binaire à classe minoritaire rare — 0,11 % de fraudes (XGBoost + SMOTE).",
            "Exercice 2 : clustering non supervisé (K-Means, k=4 — Premium, Digital, Promo-sensible, Dormant).",
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
        "subtitle": "Analyse exploratoire — detection_fraude.csv (1 048 575 lignes)",
        "insights": [
            "Sur 1 048 575 transactions, seules 1 142 sont frauduleuses (0,11 % contre 99,89 % de légitimes) — ROC-AUC et recall priment sur l'accuracy.",
            "Les montants frauduleux (moy. ≈ 101 196 €) dépassent largement le légitime (≈ 33 €) ; les distributions sont très asymétriques.",
            "CASH_OUT (578 cas) et TRANSFER (564) concentrent ≈ 99 % des fraudes ; PAYMENT et CASH_IN sont quasi absents du signal.",
            "Les schémas suspects incluent le vidage du compte émetteur (orig_zeroed : 100 % en fraude vs 0,06 % en légitime) et des écarts massifs de solde (error_balance_orig ≈ −51 707 vs 0 en légitime).",
        ],
        "figures": [
            (
                "ex1_class_distribution.png",
                "Distribution des classes",
                "Répartition isFraud (0,11 % de fraudes)",
                "Sur 1 048 575 transactions, 1 042 433 sont légitimes (99,89 %) et 1 142 frauduleuses (0,11 %). "
                "Un classificateur naïf atteindrait ~99,9 % d'accuracy en ignorant la fraude — "
                "d'où l'usage du ROC-AUC et du recall plutôt que l'accuracy seule.",
            ),
            (
                "ex1_amount_distribution.png",
                "Distribution des montants",
                "Montants par type de transaction",
                "Montant moyen fraude ≈ 101 196 € vs ≈ 33 € en légitime. "
                "Les montants frauduleux sont plus élevés et dispersés, surtout pour TRANSFER et CASH_OUT "
                "qui concentrent la quasi-totalité des cas.",
            ),
            (
                "ex1_suspicious_behavior.png",
                "Comportements suspects",
                "Patterns de fraude identifiés en EDA",
                "100 % des fraudes TRANSFER/CASH_OUT analysées présentent orig_zeroed (compte émetteur vidé) "
                "vs 0,06 % en légitime ; error_balance_orig moyen ≈ −51 707 € en fraude vs ≈ 0 € en légitime. "
                "Ces écarts justifient les features dérivées retenues au prétraitement.",
            ),
        ],
    },
    {
        "id": "ex1_preprocessing",
        "label": "Ex1 — Prétraitement",
        "section": "Exercice 1 · Fraude",
        "phase": "preprocessing",
        "title": "Feature engineering & rééquilibrage",
        "subtitle": "10 features finales — variables dérivées, encodage et standardisation",
        "insights": [
            "Features dérivées : error_balance_orig = newbalanceOrig − (oldbalanceOrg − amount), error_balance_dest = newbalanceDest − (oldbalanceDest + amount), orig_zeroed (compte émetteur vidé).",
            "Encodage ordinal du type via TYPE_MAP : PAYMENT=0, TRANSFER=1, CASH_OUT=2, DEBIT=3, CASH_IN=4 — 5 types → 10 features avec amount, step et soldes.",
            "StandardScaler appliqué sur les 10 colonnes numériques avant entraînement (moyenne 0, écart-type 1).",
            "Split train/test 80/20 stratifié sur isFraud : le test conserve la proportion réelle (~0,11 % de fraudes).",
            "SMOTE (sampling_strategy=0.1) appliqué uniquement sur le train après le split — le jeu de test n'est jamais rééquilibré.",
        ],
        "figures": [],
    },
    {
        "id": "ex1_imbalance",
        "label": "Ex1 — Déséquilibre",
        "section": "Exercice 1 · Fraude",
        "phase": "preprocessing",
        "title": "Gestion de la classe minoritaire",
        "subtitle": "0,11 % de fraudes — SMOTE sur le train uniquement",
        "insights": [
            "Stratégies combinées : SMOTE, class_weight='balanced', seuil de décision abaissé à 30 % pour maximiser le recall.",
            "Avant SMOTE (train) : 914 fraudes vs 837 946 normales ; après SMOTE : 83 794 fraudes (10 % du volume normal) — le test reste à 228 fraudes réelles.",
            "Le rééquilibrage stabilise l'apprentissage sans fausser l'évaluation : seul le jeu d'entraînement est sur-échantillonné.",
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
            "Un réseau de neurones dense (128-64-32) est entraîné à titre exploratoire sur les données SMOTE.",
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
            (
                "ex1_nn_training.png",
                "Réseau de neurones",
                "Courbes Loss & AUC (20 epochs)",
                "Le MLP TensorFlow (Dense 128-64-32, dropout) converge en AUC sur le train. "
                "XGBoost reste retenu pour la production en raison de sa meilleure interprétabilité (SHAP) "
                "et de ses performances en validation croisée.",
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
            "Sur le jeu de test, le modèle atteint une accuracy ≈ 0,999 (biaisée par le déséquilibre), un ROC-AUC de 0,997, un recall de 0,97 et un F1 de 0,61 au seuil de 30 %.",
            "Un faux positif correspond à une transaction normale bloquée à tort ; un faux négatif à une fraude non détectée, ce qui est l'erreur la plus critique.",
            "L'analyse SHAP montre que orig_zeroed, error_balance et amount sont parmi les variables les plus influentes.",
            "L'étude des faux positifs et faux négatifs permet d'affiner le seuil de décision selon la politique métier.",
        ],
        "figures": [
            (
                "ex1_best_model_eval.png",
                "Évaluation XGBoost",
                "Matrice de confusion & métriques",
                "Au seuil de 30 %, le modèle atteint un recall d'environ 97 % et une accuracy élevée (~99,9 %), "
                "mais cette dernière masque le déséquilibre des classes. La precision reste plus modérée car les fraudes ne représentent que 0,11 % des transactions.",
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
        "id": "ex2_context",
        "label": "Ex2 — Contexte",
        "section": "Exercice 2 · Segmentation",
        "phase": "eda",
        "title": "Objectifs marketing",
        "subtitle": "Analyse exploratoire — data_cluster.csv (~2 200 clients)",
        "insights": [
            "Envoyer la même promotion à l'ensemble de la base revient à supposer que tous les clients réagissent de la même façon, or les revenus, les canaux d'achat et la sensibilité aux offres varient fortement d'un profil à l'autre.",
            "La segmentation par clustering répond à une question centrale : quels groupes partagent un comportement comparable, et comment adapter le message, le canal et l'offre à chacun pour maximiser le retour sur investissement plutôt que diluer le budget en campagnes génériques ?",
            "Nous croisons démographie, dépenses par catégorie, récence d'achat et historique de réponse aux campagnes, car ce sont ces signaux comportementaux qui permettent de distinguer des segments réellement actionnables par les équipes marketing.",
        ],
        "figures": [],
    },
    {
        "id": "ex2_eda",
        "label": "Ex2 — EDA",
        "section": "Exercice 2 · Segmentation",
        "phase": "eda",
        "title": "Exploration des clients",
        "subtitle": "Analyse exploratoire — data_cluster.csv (~2 200 clients)",
        "insights": [
            "Le portefeuille compte environ 2 200 clients décrits par l'âge, le revenu, les dépenses par catégorie, la récence d'achat et l'historique de réponse aux campagnes, une richesse suffisante pour dépasser une segmentation purement démographique.",
            "Les revenus extrêmes (> 600 000 €) et les modalités aberrantes du statut marital (YOLO, Absurd) signalent des données à nettoyer avant clustering, faute de quoi les centroïdes seraient tirés par quelques valeurs atypiques.",
            "Les dépenses par catégorie (vins, viandes, poissons…) sont fortement corrélées entre elles : cette redondance confirme qu'un indice de dépense globale ou une PCA pourra résumer l'essentiel du comportement d'achat.",
            "La réponse aux campagnes n'est pas uniforme — une part significative des clients refuse les promotions — ce qui pose directement la question du ciblage : à qui envoyer une offre, et à qui proposer plutôt de la fidélisation sans discount ?",
        ],
        "figures": [
            (
                "ex2_distributions.png",
                "Distributions",
                "Revenus, âge, dépenses",
                "Les histogrammes révèlent des distributions asymétriques : revenus étalés sur une longue traîne, âges concentrés entre 40 et 60 ans, dépenses hétérogènes par catégorie. "
                "Cette variabilité confirme qu'un decoupage en segments homogènes apportera plus de valeur qu'une stratégie marketing uniforme.",
            ),
            (
                "ex2_interactive_explorer.png",
                "Exploration interactive",
                "Comparaisons revenu, âge, dépenses",
                "Le couple revenu–dépenses (r ≈ 0,79) sépare nettement Premium (~1 125 € de panier, ~69 500 € de revenu) "
                "de Digital (~133 €, ~36 000 €). L'âge ou la récence seuls ne suffisent pas : ce sont le revenu et le mix "
                "web/magasin qui structurent les segments actionnables.",
            ),
            (
                "ex2_correlation.png",
                "Matrice de corrélation",
                "Liens entre variables numériques",
                "Les corrélations fortes entre MntWines, MntMeat, MntFish et TotalSpend indiquent une redondance : les clients qui dépensent beaucoup dans une catégorie tendent à dépenser davantage partout. "
                "La standardisation avant K-Means est indispensable pour éviter que le revenu ou le montant total ne dominent seuls la distance euclidienne.",
            ),
            (
                "ex2_categorical.png",
                "Variables catégorielles",
                "Éducation, statut marital, canaux",
                "La répartition par niveau d'éducation et statut marital montre une diversité de profils sociodémographiques, mais ces seuls critères ne suffisent pas à expliquer les différences de dépenses — "
                "d'où l'intérêt de croiser ces variables avec le comportement d'achat en clustering.",
            ),
            (
                "ex2_spending_channels.png",
                "Canaux de dépense",
                "Répartition MntWines, MntMeat…",
                "Certains clients concentrent leurs achats sur le web, d'autres en magasin, avec des montants moyens très différents par catégorie. "
                "Ce graphique suggère que le canal dominant sera un axe discriminant aussi pertinent que le montant total pour distinguer un profil Digital d'un profil Premium.",
            ),
            (
                "ex2_campaign_response.png",
                "Réponse campagnes",
                "Acceptation des promotions",
                "Le déséquilibre entre acceptations et refus de campagnes montre qu'une partie de la base est peu sensible aux promotions classiques. "
                "Segmenter avant d'envoyer une offre permet d'éviter de solliciter inutilement les clients réfractaires et de concentrer le budget sur les profils réceptifs.",
            ),
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
            "Nous excluons les revenus supérieurs à 600 000 € et corrigeons les statuts maritaux aberrants, car la question n'est pas de conserver toutes les lignes mais de garantir que chaque observation reflète un client réel et actionnable.",
            "Les variables dérivées (âge, nombre d'enfants, dépense totale, nombre d'achats) condensent le comportement en indicateurs interprétables par les équipes marketing, plutôt qu'en dizaines de colonnes brutes.",
            "L'imputation par médiane et la standardisation (StandardScaler) sont nécessaires : sans elles, K-Means serait dominé par les variables à grande échelle (revenu, montants) et produirait des segments peu exploitables.",
            "La PCA exploratoire permet de visualiser la structure en 2D sans imposer k à l'avance — elle répond à la question « voyons-nous déjà des groupes naturels avant de fixer le nombre de clusters ? »",
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
            "La courbe du coude et le score de Silhouette (maximum ≈ 0,32 pour k=2) indiquent une structure dominante à deux blocs — nous retenons néanmoins k=4 pour couvrir les quatre profils métier du sujet.",
            "K-Means, DBSCAN, Agglomerative et GMM ont été comparés : DBSCAN produit trop de bruit sur ce jeu, tandis que K-Means offre des centroïdes directement interprétables par les équipes métier.",
            "Avec k=4, nous identifions Premium, Digital, Promo-sensible et Dormant — un découpage actionnable pour piloter fidélisation, offres web, coupons et réactivation.",
            "Le dendrogramme hiérarchique confirme une structure principale entre 2 et 4 groupes ; k=4 équilibre finesse statistique et couverture des archétypes marketing.",
        ],
        "figures": [
            (
                "ex2_kmeans_selection.png",
                "Sélection de k",
                "Silhouette & Elbow",
                "Le coude d'inertie et le pic de Silhouette autour de k=2 indiquent deux blocs dominants. "
                "k=4 est retenu malgré une Silhouette légèrement inférieure pour identifier Premium, Digital, Promo-sensible et Dormant.",
            ),
            (
                "ex2_pca_scree.png",
                "Scree plot PCA",
                "Variance expliquée",
                "Les deux premières composantes principales concentrent l'essentiel de la variance : elles suffisent pour visualiser la séparation des clusters en 2D "
                "sans reconstruire toutes les dimensions du portefeuille client.",
            ),
            (
                "ex2_dendrogram.png",
                "Dendrogramme",
                "Clustering hiérarchique",
                "Le dendrogramme montre une fusion progressive : les premières scissions séparent deux blocs, puis des sous-groupes — "
                "ce qui corrobore un découpage en quatre segments marketing plutôt qu'un unique envoi massif.",
            ),
            (
                "ex2_clustering_comparison.png",
                "Comparaison algorithmes",
                "K-Means vs DBSCAN vs GMM",
                "Sur la projection PCA, K-Means et GMM produisent des regroupements comparables, tandis que DBSCAN isole de nombreux points comme bruit. "
                "Pour un usage marketing, la stabilité et la lisibilité des centroïdes K-Means priment sur la finesse théorique d'algorithmes plus complexes.",
            ),
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
            "Avec k=4, la Silhouette est inférieure au pic à k=2 (~0,32), mais le Davies-Bouldin reste acceptable — l'enjeu marketing est l'actionnabilité des quatre profils.",
            "Les centroïdes normalisés discriminent Premium (revenu/dépenses), Digital (canal web), Promo-sensible (magasin/campagnes) et Dormant (récence élevée).",
            "La lecture des profils invite à se demander, pour chaque segment, quel canal privilégier et quel type d'offre maximisera la conversion sans cannibaliser la marge.",
        ],
        "figures": [
            (
                "ex2_cluster_profiles.png",
                "Profils par cluster",
                "Centroïdes normalisés",
                "Les barres des centroïdes mettent en évidence des profils opposés : le cluster Premium surperforme sur Income et TotalSpend, "
                "le cluster Digital sur NumWebPurchases et la récence. Ces écarts justifient des messages et des canaux distincts pour chaque segment.",
            ),
            (
                "ex2_radar_profiles.png",
                "Radar des profils",
                "Comparaison multi-dimensions",
                "Le radar confirme visuellement que les deux clusters ne diffèrent pas sur une seule variable mais sur un ensemble cohérent de dimensions — "
                "revenu, dépenses, canal et récence — ce qui renforce la légitimité du découpage pour une stratégie marketing différenciée.",
            ),
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
            "Quatre profils avec k=4 : Premium (haute valeur), Digital (segment masse), Promo-sensible (réceptif aux offres), Dormant (faible activité récente).",
            "Premium concentre revenu et panier élevés ; Digital le segment volume ; Promo-sensible réagit aux campagnes ; Dormant nécessite réactivation.",
            "Actions : Premium → fidélité haut de gamme ; Digital → offres web ciblées ; Promo-sensible → coupons ; Dormant → campagne de réactivation.",
        ],
        "figures": [
            (
                "ex2_cluster_profiles.png",
                "Profils par cluster",
                "Centroïdes normalisés",
                "Premium surperforme sur Income (~71 k€ vs ~39 k€) et TotalSpend (~1 233 € vs ~178 €). "
                "Digital se distingue surtout par un panier faible et plus d'enfants (1,3 vs 0,5) — pas par davantage d'achats web (2,9 vs 5,8). "
                "C'est la dépense globale qui structure le découpage, pas le canal d'achat.",
            ),
            (
                "ex2_radar_profiles.png",
                "Radar des profils",
                "Comparaison multi-dimensions",
                "Le radar montre Premium à 1,0 sur revenu, dépenses et fréquence d'achat, Digital proche de 0 sur ces axes "
                "mais plus élevé sur le nombre d'enfants. L'écart multi-dimensionnel confirme que deux parcours marketing distincts sont justifiés.",
            ),
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
            "Déploiement Docker : Dockerfile + docker compose up (voir README).",
            "Endpoint /health et /metadata pour le monitoring.",
            "Simulation PSI (Population Stability Index) pour détecter la dérive.",
        ],
        "figures": [
            (
                "mlops_monitoring.png",
                "Monitoring & dérive",
                "Distribution des scores et PSI",
            ),
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
