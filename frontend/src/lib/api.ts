const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface HealthResponse {
  fraud_model_loaded: boolean;
  cluster_model_loaded: boolean;
}

export interface FraudMetadata {
  model_name: string;
  accuracy: number;
  roc_auc: number;
  f1: number;
  precision: number;
  recall: number;
  cv_roc_auc_mean?: number;
}

export interface ClusterMetadata {
  model_name: string;
  best_k: number;
  silhouette_peak_k?: number;
  silhouette_at_peak_k?: number;
  silhouette: number;
  davies_bouldin: number;
  cluster_labels: Record<string, string>;
}

export interface MetadataResponse {
  fraud: FraudMetadata | null;
  cluster: ClusterMetadata | null;
}

export interface PageFigure {
  filename: string;
  title: string;
  caption: string;
  interpretation?: string;
}

export interface PageContent {
  id: string;
  label: string;
  section: string | null;
  phase: string | null;
  title: string;
  subtitle: string;
  insights: string[];
  figures: PageFigure[];
  metadata_key?: string;
  is_predict?: boolean;
}

export interface PagesResponse {
  pages: PageContent[];
  phases: { id: string; label: string; color: string }[];
}

export interface FraudEdaRecord {
  amount: number;
  step: number;
  oldbalance_org: number;
  newbalance_orig: number;
  oldbalance_dest: number;
  newbalance_dest: number;
  error_balance_orig: number;
  error_balance_dest: number;
  orig_zeroed: number;
  type: string;
  is_fraud: number;
}

export interface FraudDerivedFeatureStat {
  name: string;
  label: string;
  fraud_mean: number;
  legit_mean: number;
  description: string;
}

export interface FraudPreprocessingStats {
  feature_count: number;
  type_encoding: Record<string, number>;
  derived_features: FraudDerivedFeatureStat[];
  pipeline_steps: string[];
  amount_fraud_mean: number;
  amount_legit_mean: number;
}

export interface FraudEdaAnalytics {
  class_balance: { label: string; count: number; pct: number }[];
  fraud_by_type: { type: string; fraud: number }[];
  total_transactions: number;
  records?: FraudEdaRecord[];
  numeric_variables?: { key: string; label: string }[];
  filters?: {
    types: string[];
    is_fraud: { value: string; label: string }[];
    orig_zeroed: { value: string; label: string }[];
  };
  preprocessing?: FraudPreprocessingStats;
}

export interface FraudModelMetric {
  name: string;
  key: string;
  roc: number;
  cv_std?: number;
}

export interface FraudSmoteMetric {
  label: string;
  count: number;
}

export interface FraudSmoteAnalytics {
  metrics: FraudSmoteMetric[];
  sampling_strategy: number;
  insight: string;
}

export interface ClusterPoint {
  x: number;
  y: number;
  cluster: string;
  cluster_id: number;
}

export interface ClusterSummary {
  points: ClusterPoint[];
  explained_variance: number[];
  metrics?: {
    silhouette: number;
    davies_bouldin: number;
    best_k: number;
    cluster_labels: Record<string, string>;
  };
}

export interface ClusterEdaRecord {
  age: number;
  income: number;
  total_spend: number;
  children: number;
  recency: number;
  web_purchases: number;
  store_purchases: number;
  response: number;
  education: string;
  marital_status: string;
  cluster: string;
  wines?: number;
  fruits?: number;
  meat?: number;
  fish?: number;
  sweet?: number;
  gold?: number;
}

export interface ClusterEdaAnalytics {
  total_customers: number;
  income_distribution: { range: string; count: number; pct: number }[];
  spending_by_channel: { channel: string; total: number; avg: number }[];
  campaign_response: { label: string; count: number; pct: number }[];
  records?: ClusterEdaRecord[];
  numeric_variables?: { key: string; label: string }[];
  filters?: {
    education: string[];
    marital_status: string[];
    clusters: string[];
    response: { value: string; label: string }[];
  };
}

export interface ClusterKSelection {
  k_range: number[];
  inertias: number[];
  silhouette_scores: number[];
  davies_bouldin_scores: number[];
  best_k: number;
  best_silhouette: number;
}

export interface PlotlyFigurePayload {
  data: unknown[];
  layout: Record<string, unknown>;
  frames?: unknown[];
}

export interface FraudRequest {
  step: number;
  type: 'PAYMENT' | 'TRANSFER' | 'CASH_OUT' | 'DEBIT' | 'CASH_IN';
  amount: number;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export interface FraudResponse {
  is_fraud: boolean;
  probability: number;
  risk_level: string;
}

export interface CustomerRequest {
  income: number;
  age: number;
  total_spend: number;
  num_web_purchases: number;
  num_store_purchases: number;
  recency: number;
  children: number;
}

export interface CustomerResponse {
  cluster_id: number;
  profile: string;
  description: string;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface FraudBatchEvaluation {
  accuracy: number;
  roc_auc: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: ConfusionMatrix;
}

export interface FraudBatchRow extends FraudResponse {
  row_index: number;
}

export interface FraudBatchResponse {
  total: number;
  processed: number;
  summary: {
    fraud_count: number;
    fraud_rate: number;
    risk_distribution: Record<string, number>;
  };
  evaluation: FraudBatchEvaluation | null;
  rows: FraudBatchRow[];
  errors: string[];
}

export interface SegmentBatchRow extends CustomerResponse {
  row_index: number;
}

export interface SegmentBatchResponse {
  total: number;
  processed: number;
  summary: {
    cluster_distribution: Record<string, number>;
  };
  rows: SegmentBatchRow[];
  errors: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    try {
      const json = JSON.parse(detail) as { detail?: string };
      throw new Error(json.detail || detail || `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== detail) throw e;
      throw new Error(detail || `HTTP ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

async function uploadBatch<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.text();
    try {
      const json = JSON.parse(detail) as { detail?: string };
      throw new Error(json.detail || detail || `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== detail) throw e;
      throw new Error(detail || `HTTP ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  metadata: () => request<MetadataResponse>('/metadata'),
  pages: () => request<PagesResponse>('/content/pages'),
  fraudEda: () => request<FraudEdaAnalytics>('/analytics/fraud/eda'),
  fraudModels: () => request<{ models: FraudModelMetric[] }>('/analytics/fraud/models'),
  fraudSmote: () => request<FraudSmoteAnalytics>('/analytics/fraud/smote'),
  clusterSummary: () => request<ClusterSummary>('/analytics/cluster/summary'),
  clusterEda: () => request<ClusterEdaAnalytics>('/analytics/cluster/eda'),
  clusterKSelection: () => request<ClusterKSelection>('/analytics/cluster/k-selection'),
  plotlyChart: (chartId: string) => request<PlotlyFigurePayload>(`/analytics/charts/${chartId}`),
  predictFraud: (body: FraudRequest) =>
    request<FraudResponse>('/predict/fraud', { method: 'POST', body: JSON.stringify(body) }),
  predictSegment: (body: CustomerRequest) =>
    request<CustomerResponse>('/predict/segment', { method: 'POST', body: JSON.stringify(body) }),
  predictFraudBatch: (file: File) => uploadBatch<FraudBatchResponse>('/predict/fraud/batch', file),
  predictSegmentBatch: (file: File) =>
    uploadBatch<SegmentBatchResponse>('/predict/segment/batch', file),
  figureUrl: (filename: string) => `${API_BASE}/figures/${filename}`,
};
