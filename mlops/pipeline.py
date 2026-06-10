"""Pipeline MLOps : validation, entraînement, export et tracking MLflow."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.training import train_all, train_cluster_model, train_fraud_model  # noqa: E402

FRAUD_REQUIRED_COLUMNS = [
    "step",
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "isFraud",
]

CLUSTER_REQUIRED_COLUMNS = [
    "Year_Birth",
    "Income",
    "Kidhome",
    "Teenhome",
    "Recency",
    "NumWebPurchases",
    "NumStorePurchases",
    "MntWines",
    "MntFruits",
    "MntMeatProducts",
]


def validate_schema(path: Path, required: list[str], label: str) -> pd.DataFrame:
    """Valide la présence des colonnes requises."""
    if not path.exists():
        raise FileNotFoundError(f"Fichier {label} introuvable : {path}")

    df = pd.read_csv(path, sep=None, engine="python", nrows=5)
    if df.shape[1] == 1 and ";" in df.columns[0]:
        df = pd.read_csv(path, sep=";", nrows=5)
    if df.shape[1] == 1:
        df = pd.read_csv(path, sep="\t", nrows=5)

    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Schéma {label} invalide — colonnes manquantes : {missing}")

    print(f"OK {label} : schéma validé ({len(required)} colonnes requises présentes)")
    return pd.read_csv(path, sep=None, engine="python")


def run_pipeline(
    task: str, fraud_path: Path, cluster_path: Path, models_dir: Path, log_mlflow: bool
) -> dict:
    """Exécute le pipeline selon la tâche demandée."""
    results = {}

    if task in ("fraud", "all"):
        validate_schema(fraud_path, FRAUD_REQUIRED_COLUMNS, "fraude")
        results["fraud"] = train_fraud_model(
            fraud_path, models_dir, log_mlflow=log_mlflow
        )

    if task in ("cluster", "all"):
        validate_schema(cluster_path, CLUSTER_REQUIRED_COLUMNS, "clustering")
        results["cluster"] = train_cluster_model(
            cluster_path, models_dir, log_mlflow=log_mlflow
        )

    if task == "all":
        metadata_path = models_dir / "metadata.json"
        import json

        payload = results
        metadata_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipeline MLOps Exam-ML")
    parser.add_argument(
        "--task",
        choices=["fraud", "cluster", "all"],
        default="all",
        help="Tâche à exécuter",
    )
    parser.add_argument(
        "--fraud-path",
        type=Path,
        default=ROOT / "data" / "raw" / "detection_fraude.csv",
    )
    parser.add_argument(
        "--cluster-path",
        type=Path,
        default=ROOT / "data" / "raw" / "data_cluster.csv",
    )
    parser.add_argument(
        "--models-dir",
        type=Path,
        default=ROOT / "models",
    )
    parser.add_argument(
        "--no-mlflow", action="store_true", help="Désactiver le logging MLflow"
    )
    args = parser.parse_args()

    if args.task == "all":
        metrics = train_all(
            args.fraud_path,
            args.cluster_path,
            args.models_dir,
            log_mlflow=not args.no_mlflow,
        )
    else:
        metrics = run_pipeline(
            args.task,
            args.fraud_path,
            args.cluster_path,
            args.models_dir,
            log_mlflow=not args.no_mlflow,
        )

    print("\n=== Pipeline terminé ===")
    for name, values in metrics.items():
        print(f"\n{name.upper()}:")
        for key, value in values.items():
            if key != "cluster_labels":
                print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
