import React from 'react';
import type { PageContent } from '@/lib/api';
import { api } from '@/lib/api';
import { PHASE_LABELS, groupPagesByPhase } from '@/lib/reportContent';
import { ReportPage } from './ReportA4Layout';

interface ReportBodyProps {
  pages: PageContent[];
}

function ReportFigure({ figure }: { figure: PageContent['figures'][0] }) {
  return (
    <figure className="report-figure">
      <img src={api.figureUrl(figure.filename)} alt={figure.title} loading="lazy" />
      <figcaption className="report-figure-caption">
        <strong>{figure.title}</strong>
        {figure.caption ? ` — ${figure.caption}` : ''}
      </figcaption>
    </figure>
  );
}

export function ReportBody({ pages }: ReportBodyProps) {
  const grouped = groupPagesByPhase(pages);
  const phaseOrder = ['eda', 'preprocessing', 'modeling', 'evaluation', 'interpretation', 'general'];

  const orderedPhases = [
    ...phaseOrder.filter((p) => grouped.has(p)),
    ...[...grouped.keys()].filter((p) => !phaseOrder.includes(p)),
  ];

  return (
    <>
      {orderedPhases.map((phase) => {
        const phasePages = grouped.get(phase) ?? [];
        if (phasePages.length === 0) return null;

        return (
          <ReportPage key={phase}>
            <div className="report-header-bar">
              <span>M2 CDSD — Exam-ML</span>
              <span>{PHASE_LABELS[phase] ?? phase}</span>
            </div>

            <h2 className="report-section-title">{PHASE_LABELS[phase] ?? phase}</h2>

            {phasePages.map((page) => (
              <section key={page.id} className="mb-6">
                <h3 className="report-page-title">{page.title}</h3>
                {page.subtitle && (
                  <p className="text-sm text-slate-500 font-sans mb-2">{page.subtitle}</p>
                )}

                {page.insights.length > 0 && (
                  <ul className="report-insights">
                    {page.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                )}

                {page.figures.slice(0, 2).map((figure) => (
                  <ReportFigure key={figure.filename} figure={figure} />
                ))}
              </section>
            ))}
          </ReportPage>
        );
      })}
    </>
  );
}
