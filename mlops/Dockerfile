FROM python:3.10-slim

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi uvicorn pydantic \
    scikit-learn xgboost lightgbm \
    pandas numpy joblib

# Code source
COPY src/ ./src/
COPY mlops/api/ ./mlops/api/
COPY models/ ./models/

EXPOSE 8000

CMD ["uvicorn", "mlops.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
