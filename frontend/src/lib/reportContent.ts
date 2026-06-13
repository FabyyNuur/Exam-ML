import type { MetadataResponse, PageContent, PagesResponse } from './api';

export type ReportId = 'fraude' | 'segmentation';

export interface ReportDefinition {
  id: ReportId;
  title: string;
  subtitle: string;
  sectionFilter: string;
  dataset: string;
  accent: 'red' | 'indigo';
  downloadFilename: string;
}

export const REPORTS: ReportDefinition[] = [
  {
    id: 'fraude',
    title: 'Exercice 1 — Détection de fraude',
    subtitle: 'Machine Learning supervisé · Transactions bancaires',
    sectionFilter: 'Exercice 1 · Fraude',
    dataset: 'detection_fraude.csv (~1 M transactions)',
    accent: 'red',
    downloadFilename: 'rapport_fraude_m2cdsd.pdf',
  },
  {
    id: 'segmentation',
    title: 'Exercice 2 — Segmentation client',
    subtitle: 'Clustering non supervisé · Marketing CRM',
    sectionFilter: 'Exercice 2 · Segmentation',
    dataset: 'data_cluster.csv (~2 200 clients)',
    accent: 'indigo',
    downloadFilename: 'rapport_segmentation_m2cdsd.pdf',
  },
];

export function getReportDefinition(id: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.id === id);
}

export function filterReportPages(pages: PageContent[], sectionFilter: string): PageContent[] {
  return pages.filter((p) => p.section === sectionFilter && !p.is_predict);
}

export interface ReportKpi {
  label: string;
  value: string;
}

export function buildReportKpis(
  reportId: ReportId,
  metadata: MetadataResponse | null,
): ReportKpi[] {
  if (reportId === 'fraude' && metadata?.fraud) {
    const m = metadata.fraud;
    return [
      { label: 'Modèle retenu', value: m.model_name.toUpperCase() },
      { label: 'ROC-AUC', value: m.roc_auc.toFixed(3) },
      { label: 'Recall', value: m.recall.toFixed(2) },
      { label: 'F1-score', value: m.f1.toFixed(2) },
      { label: 'Precision', value: m.precision.toFixed(2) },
    ];
  }
  if (reportId === 'segmentation' && metadata?.cluster) {
    const m = metadata.cluster;
    const profiles = Object.values(m.cluster_labels ?? {}).join(', ') || '—';
    return [
      { label: 'Algorithme', value: m.model_name.toUpperCase() },
      { label: 'k optimal', value: String(m.best_k) },
      { label: 'Silhouette', value: m.silhouette.toFixed(3) },
      { label: 'Davies-Bouldin', value: m.davies_bouldin.toFixed(2) },
      { label: 'Profils', value: profiles },
    ];
  }
  return [];
}

export interface ReportManifestItem {
  id: ReportId;
  title: string;
  subtitle: string;
  dataset: string;
  section: string;
  pageCount: number;
  figureCount: number;
  kpis: ReportKpi[];
}

export function buildReportManifest(
  pagesResponse: PagesResponse | null,
  metadata: MetadataResponse | null,
): ReportManifestItem[] {
  const pages = pagesResponse?.pages ?? [];
  return REPORTS.map((report) => {
    const reportPages = filterReportPages(pages, report.sectionFilter);
    const figureCount = reportPages.reduce((n, p) => n + p.figures.length, 0);
    return {
      id: report.id,
      title: report.title,
      subtitle: report.subtitle,
      dataset: report.dataset,
      section: report.sectionFilter,
      pageCount: reportPages.length,
      figureCount,
      kpis: buildReportKpis(report.id, metadata),
    };
  });
}

export function groupPagesByPhase(pages: PageContent[]): Map<string, PageContent[]> {
  const groups = new Map<string, PageContent[]>();
  for (const page of pages) {
    const phase = page.phase ?? 'general';
    const list = groups.get(phase) ?? [];
    list.push(page);
    groups.set(phase, list);
  }
  return groups;
}

export const PHASE_LABELS: Record<string, string> = {
  eda: 'Analyse exploratoire',
  preprocessing: 'Prétraitement',
  modeling: 'Modélisation',
  evaluation: 'Évaluation',
  interpretation: 'Interprétation métier',
  general: 'Synthèse',
};
