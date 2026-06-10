"""Helpers de modèles : entraînement, comparaison, sauvegarde."""

import joblib
import mlflow
import mlflow.sklearn
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from xgboost import XGBClassifier

FRAUD_MODELS = {
    "logistic_regression": LogisticRegression(
        max_iter=1000, class_weight="balanced", random_state=42
    ),
    "random_forest": RandomForestClassifier(
        n_estimators=200, class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "xgboost": XGBClassifier(
        scale_pos_weight=99, eval_metric="logloss", random_state=42
    ),
    "lightgbm": LGBMClassifier(
        class_weight="balanced", random_state=42, n_jobs=-1, verbose=-1
    ),
}


def train_and_evaluate(model, X_train, y_train, X_test, y_test, model_name="model"):
    """Entraîne un modèle et retourne les prédictions + probabilités."""
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_proba = (
        model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    )
    return y_pred, y_proba


def cross_validate_models(models: dict, X, y, cv=5, scoring="roc_auc"):
    """Compare plusieurs modèles par validation croisée stratifiée."""
    cv_strategy = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    results = {}
    for name, model in models.items():
        scores = cross_val_score(
            model, X, y, cv=cv_strategy, scoring=scoring, n_jobs=-1
        )
        results[name] = {"mean": scores.mean(), "std": scores.std(), "scores": scores}
        print(f"{name:<25} {scoring}: {scores.mean():.4f} ± {scores.std():.4f}")
    return results


def save_model(model, path: str):
    joblib.dump(model, path)
    print(f"Modèle sauvegardé : {path}")


def load_model(path: str):
    return joblib.load(path)


def log_model_mlflow(model, model_name: str, params: dict, metrics: dict):
    """Log un modèle dans MLflow (tolérant aux erreurs de tracking local)."""
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    try:
        mlflow.set_tracking_uri(str(root / "mlruns"))
        mlflow.set_experiment("exam-ml")
        with mlflow.start_run(run_name=model_name):
            mlflow.log_params({k: str(v) for k, v in params.items()})
            mlflow.log_metrics(metrics)
            mlflow.sklearn.log_model(model, artifact_path=model_name)
        print(f"MLflow : run enregistrée pour {model_name}")
    except Exception as exc:
        print(f"MLflow ignoré ({model_name}) : {exc}")
