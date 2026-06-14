"""Constantes partagées entre entraînement et API."""

COLORS = {
    "primary": "#4682B4",
    "secondary": "#EF4444",
    "accent": "#FF7F50",
    "neutral": "#64748B",
    "success": "#2E8B57",
    "warning": "#F59E0B",
}

TYPE_MAP = {
    "PAYMENT": 0,
    "TRANSFER": 1,
    "CASH_OUT": 2,
    "DEBIT": 3,
    "CASH_IN": 4,
}

TRANSACTION_TYPES = tuple(TYPE_MAP.keys())

FRAUD_THRESHOLD = 0.3
RISK_HIGH_THRESHOLD = 0.7

FRAUD_FEATURE_COLUMNS = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "error_balance_orig",
    "error_balance_dest",
    "orig_zeroed",
    "type_encoded",
]

CLUSTER_API_COLUMNS = [
    "Income",
    "Age",
    "TotalSpend",
    "NumWebPurchases",
    "NumStorePurchases",
    "Recency",
    "Children",
]

TARGET_CLUSTER_K = 2  # k retenu en production (pic Silhouette)

BUSINESS_PROFILES_K = 4  # analyse complémentaire — 4 archétypes marketing du sujet

DEFAULT_CLUSTER_LABELS = {
    0: "Digital",
    1: "Premium",
}

BUSINESS_PROFILE_LABELS = {
    0: "Digital",
    1: "Premium",
    2: "Promo-sensible",
    3: "Dormant",
}

CLUSTER_PROFILE_DESCRIPTIONS = {
    "Premium": "Client à haute valeur, dépenses élevées, revenu supérieur.",
    "Digital": "Acheteur web fréquent, sensible aux offres en ligne.",
    "Promo-sensible": "Réagit fortement aux promotions et deals.",
    "Dormant": "Client peu actif, nécessite une campagne de réactivation.",
}
