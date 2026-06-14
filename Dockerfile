FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/
COPY mlops/ mlops/
COPY scripts/ scripts/
COPY models/ models/
COPY reports/analytics/ reports/analytics/
COPY reports/figures/mlops_monitoring.png reports/figures/mlops_monitoring.png
COPY data/raw/data_cluster.csv data/raw/data_cluster.csv
COPY data/samples/ data/samples/

RUN python scripts/create_ci_models.py && python scripts/export_analytics.py

EXPOSE 8000

CMD ["uvicorn", "mlops.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
