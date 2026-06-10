const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface HealthResponse {
  fraud_model_loaded: boolean;
  cluster_model_loaded: boolean;
}

export interface FraudMetadata {
  model_name: string;
  roc_auc: number;
  f1: number;
  precision: number;
  recall: number;
  cv_roc_auc_mean: number;
}

export interface ClusterMetadata {
  model_name: string;
  best_k: number;
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

export interface FraudEdaAnalytics {
  class_balance: { label: string; count: number; pct: number }[];
  fraud_by_type: { type: string; fraud: number }[];
  total_transactions: number;
}

export interface FraudModelMetric {
  name: string;
  key: string;
  roc: number;
  precision: number;
  f1: number;
  rappel: number;
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

export interface ClusterEdaAnalytics {
  total_customers: number;
  income_distribution: { range: string; count: number; pct: number }[];
  spending_by_channel: { channel: string; total: number; avg: number }[];
  campaign_response: { label: string; count: number; pct: number }[];
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  metadata: () => request<MetadataResponse>('/metadata'),
  pages: () => request<PagesResponse>('/content/pages'),
  fraudEda: () => request<FraudEdaAnalytics>('/analytics/fraud/eda'),
  fraudModels: () => request<{ models: FraudModelMetric[] }>('/analytics/fraud/models'),
  clusterSummary: () => request<ClusterSummary>('/analytics/cluster/summary'),
  clusterEda: () => request<ClusterEdaAnalytics>('/analytics/cluster/eda'),
  clusterKSelection: () => request<ClusterKSelection>('/analytics/cluster/k-selection'),
  plotlyChart: (chartId: string) => request<PlotlyFigurePayload>(`/analytics/charts/${chartId}`),
  predictFraud: (body: FraudRequest) =>
    request<FraudResponse>('/predict/fraud', { method: 'POST', body: JSON.stringify(body) }),
  predictSegment: (body: CustomerRequest) =>
    request<CustomerResponse>('/predict/segment', { method: 'POST', body: JSON.stringify(body) }),
  figureUrl: (filename: string) => `${API_BASE}/figures/${filename}`,
};
