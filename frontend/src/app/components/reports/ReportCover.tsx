import React from 'react';
import type { ReportDefinition, ReportKpi } from '@/lib/reportContent';
import { ReportPage } from './ReportA4Layout';

interface ReportCoverProps {
  report: ReportDefinition;
  kpis: ReportKpi[];
}

export function ReportCover({ report, kpis }: ReportCoverProps) {
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ReportPage>
      <div className="report-header-bar">
        <span>M2 CDSD — Exam-ML</span>
        <span>Rapport analytique A4</span>
      </div>

      <p className="text-sm text-slate-500 font-sans uppercase tracking-widest">Projet Machine Learning</p>
      <h1 className="report-cover-title">{report.title}</h1>
      <p className="report-cover-subtitle">{report.subtitle}</p>

      <div className="font-sans text-sm text-slate-600 space-y-1 mb-6">
        <p>
          <strong>Dataset :</strong> {report.dataset}
        </p>
        <p>
          <strong>Date :</strong> {today}
        </p>
        <p>
          <strong>Formation :</strong> Master 2 CDSD
        </p>
      </div>

      {kpis.length > 0 && (
        <>
          <h2 className="report-section-title font-sans">Indicateurs clés</h2>
          <div className="report-kpi-grid">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="report-kpi-card">
                <div className="report-kpi-label">{kpi.label}</div>
                <div className="report-kpi-value">{kpi.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-sm text-slate-500 font-sans leading-relaxed">
        Ce rapport synthétise l&apos;exploration, le prétraitement, la modélisation et
        l&apos;interprétation métier réalisés dans le tableau de bord Exam-ML. Les figures
        proviennent des notebooks et de l&apos;export analytics du projet.
      </p>
    </ReportPage>
  );
}
