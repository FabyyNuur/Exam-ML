import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  ClusterSummary,
  ClusterEdaAnalytics,
  CustomerRequest,
  CustomerResponse,
  FraudBatchResponse,
  FraudEdaAnalytics,
  FraudModelMetric,
  FraudSmoteAnalytics,
  FraudRequest,
  FraudResponse,
  HealthResponse,
  MetadataResponse,
  PageContent,
  PlotlyFigurePayload,
  PagesResponse,
  SegmentBatchResponse,
} from './api';

function useFetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useHealth() {
  return useFetch<HealthResponse>(api.health);
}

export function useMetadata() {
  return useFetch<MetadataResponse>(api.metadata);
}

export function usePageContent() {
  const result = useFetch<PagesResponse>(api.pages);
  return {
    ...result,
    getPage: (id: string): PageContent | undefined =>
      result.data?.pages.find((p) => p.id === id),
  };
}

export function useFraudEda() {
  return useFetch<FraudEdaAnalytics>(api.fraudEda);
}

export function useFraudModels() {
  return useFetch<{ models: FraudModelMetric[] }>(api.fraudModels);
}

export function useFraudSmote() {
  return useFetch<FraudSmoteAnalytics>(api.fraudSmote);
}

export function useClusterSummary() {
  return useFetch<ClusterSummary>(api.clusterSummary);
}

export function useClusterEda() {
  return useFetch<ClusterEdaAnalytics>(api.clusterEda);
}

export function usePredictFraud() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FraudResponse | null>(null);

  const predict = async (body: FraudRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictFraud(body);
      setResult(res);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de prédiction';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, result, reset: () => setResult(null) };
}

export function usePredictSegment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomerResponse | null>(null);

  const predict = async (body: CustomerRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictSegment(body);
      setResult(res);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de prédiction';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, result, reset: () => setResult(null) };
}

export function usePredictFraudBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FraudBatchResponse | null>(null);

  const predict = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictFraudBatch(file);
      setResult(res);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de prédiction batch';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, result, reset: () => setResult(null) };
}

export function usePredictSegmentBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SegmentBatchResponse | null>(null);

  const predict = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictSegmentBatch(file);
      setResult(res);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de prédiction batch';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, result, reset: () => setResult(null) };
}

const plotlyCache = new Map<string, PlotlyFigurePayload>();

export function usePlotlyChart(chartId: string) {
  const [data, setData] = useState<PlotlyFigurePayload | null>(() => plotlyCache.get(chartId) ?? null);
  const [loading, setLoading] = useState(!plotlyCache.has(chartId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plotlyCache.has(chartId)) {
      setData(plotlyCache.get(chartId)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.plotlyChart(chartId)
      .then((payload) => {
        plotlyCache.set(chartId, payload);
        setData(payload);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [chartId]);

  return { data, loading, error };
}
