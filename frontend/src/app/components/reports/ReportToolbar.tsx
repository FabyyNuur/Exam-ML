import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';

interface ReportToolbarProps {
  backTo: string;
  backLabel?: string;
  downloadFilename: string;
  printTargetId?: string;
}

export function ReportToolbar({
  backTo,
  backLabel = 'Retour',
  downloadFilename,
  printTargetId = 'report-print-root',
}: ReportToolbarProps) {
  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = downloadFilename.replace(/\.pdf$/i, '');
    window.print();
    document.title = prevTitle;
  };

  return (
    <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 shrink-0"
        >
          <ArrowLeft size={18} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-none justify-center"
            aria-controls={printTargetId}
          >
            <Download size={16} />
            Télécharger PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg hover:border-indigo-300 transition-colors flex-1 sm:flex-none justify-center"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>
      <p className="no-print text-center text-xs text-slate-400 pb-2">
        Utilisez « Enregistrer au format PDF » dans la boîte de dialogue d&apos;impression
      </p>
    </div>
  );
}
