import React from 'react';

interface ReportA4LayoutProps {
  children: React.ReactNode;
  printId?: string;
}

export function ReportA4Layout({ children, printId = 'report-print-root' }: ReportA4LayoutProps) {
  return (
    <div id={printId} className="report-viewport">
      {children}
    </div>
  );
}

interface ReportPageProps {
  children: React.ReactNode;
  pageBreak?: boolean;
}

export function ReportPage({ children, pageBreak = true }: ReportPageProps) {
  return (
    <article className={`report-a4-page${pageBreak ? ' report-page-break' : ''}`}>
      {children}
    </article>
  );
}
