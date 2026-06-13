"""Schémas Pydantic pour l'API REST."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

TransactionType = Literal["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT", "CASH_IN"]

MAX_UPLOAD_BYTES = 8 * 1024 * 1024


class FraudRequest(BaseModel):
    step: int = Field(..., ge=1, description="Unité temporelle")
    type: TransactionType = Field(..., description="Type de transaction")
    amount: float = Field(..., ge=0, description="Montant")
    oldbalanceOrg: float = Field(..., ge=0)
    newbalanceOrig: float = Field(..., ge=0)
    oldbalanceDest: float = Field(..., ge=0)
    newbalanceDest: float = Field(..., ge=0)


class FraudResponse(BaseModel):
    is_fraud: bool
    probability: float
    risk_level: str


class FraudBatchRow(FraudResponse):
    row_index: int


class ConfusionMatrix(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int


class FraudBatchEvaluation(BaseModel):
    roc_auc: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: ConfusionMatrix


class FraudBatchResponse(BaseModel):
    total: int
    processed: int
    summary: dict
    evaluation: Optional[FraudBatchEvaluation] = None
    rows: list[FraudBatchRow]
    errors: list[str]


class CustomerRequest(BaseModel):
    income: float = Field(..., ge=0)
    age: int = Field(..., ge=18, le=100)
    total_spend: float = Field(..., ge=0)
    num_web_purchases: int = Field(..., ge=0)
    num_store_purchases: int = Field(..., ge=0)
    recency: int = Field(..., ge=0)
    children: int = Field(..., ge=0)


class CustomerResponse(BaseModel):
    cluster_id: int
    profile: str
    description: str


class SegmentBatchRow(CustomerResponse):
    row_index: int


class SegmentBatchResponse(BaseModel):
    total: int
    processed: int
    summary: dict
    rows: list[SegmentBatchRow]
    errors: list[str]


class HealthResponse(BaseModel):
    fraud_model_loaded: bool
    cluster_model_loaded: bool


class MetadataResponse(BaseModel):
    fraud: Optional[dict] = None
    cluster: Optional[dict] = None
