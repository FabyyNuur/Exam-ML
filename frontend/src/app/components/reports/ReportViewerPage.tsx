import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMetadata, usePageContent } from '@/lib/hooks';
import {
  buildReportKpis,
  filterReportPages,
  getReportDefinition,
} from '@/lib/reportContent';
import { ReportA4Layout } from './ReportA4Layout';
import { ReportBody } from './ReportBody';
import { ReportCover } from './ReportCover';
import { ReportToolbar } from './ReportToolbar';

export function ReportViewerPage() {
  const { reportId = '' } = useParams<{ reportId: string }>();
  const report = getReportDefinition(reportId);

  const { data: pagesData, loading: pagesLoading, error: pagesError } = usePageContent();
  const { data: metadata, loading: metaLoading } = useMetadata();

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Rapport introuvable.</p>
          <Link to="/rapports" className="text-indigo-600 font-medium">
            ← Retour aux rapports
          </Link>
        </div>
      </div>
    );
  }

  const loading = pagesLoading || metaLoading;
  const pages = filterReportPages(pagesData?.pages ?? [], report.sectionFilter);
  const kpis = buildReportKpis(report.id, metadata ?? null);

  return (
    <div className="report-shell">
      <ReportToolbar
        backTo="/rapports"
        backLabel="Tous les rapports"
        downloadFilename={report.downloadFilename}
      />

      {loading && (
        <p className="no-print text-center text-slate-500 py-8 animate-pulse">
          Génération du rapport…
        </p>
      )}

      {pagesError && (
        <p className="no-print text-center text-red-600 py-4">{pagesError}</p>
      )}

      {!loading && (
        <ReportA4Layout>
          <ReportCover report={report} kpis={kpis} />
          <ReportBody pages={pages} />
        </ReportA4Layout>
      )}
    </div>
  );
}
