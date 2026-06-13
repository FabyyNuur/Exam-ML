import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, Users } from 'lucide-react';
import { useMetadata, usePageContent } from '@/lib/hooks';
import { buildReportManifest } from '@/lib/reportContent';

const ICONS = {
  fraude: ShieldAlert,
  segmentation: Users,
} as const;

export function ReportsHub() {
  const { data: pagesData, loading: pagesLoading } = usePageContent();
  const { data: metadata, loading: metaLoading } = useMetadata();
  const loading = pagesLoading || metaLoading;

  const manifest = buildReportManifest(pagesData, metadata);

  return (
    <div className="report-shell min-h-screen">
      <div className="no-print max-w-4xl mx-auto px-6 py-8">
        <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          ← Retour au tableau de bord
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-indigo-600" size={32} />
            Rapports analytiques
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Rapports A4 par exercice — visualisation et export PDF
          </p>
        </div>

        {loading && (
          <p className="text-slate-500 text-sm animate-pulse">Chargement des rapports…</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {manifest.map((item) => {
            const Icon = ICONS[item.id];
            return (
              <Link
                key={item.id}
                to={`/rapport/${item.id}`}
                className={`block bg-white/80 backdrop-blur-md border rounded-2xl p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  item.id === 'fraude'
                    ? 'border-red-200 hover:border-red-300'
                    : 'border-indigo-200 hover:border-indigo-300'
                }`}
              >
                <div
                  className={`inline-flex p-3 rounded-xl mb-4 ${
                    item.id === 'fraude' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Icon size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h2>
                <p className="text-sm text-slate-500 mb-4">{item.subtitle}</p>
                <p className="text-xs text-slate-400 mb-3">{item.dataset}</p>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded">{item.pageCount} sections</span>
                  <span className="bg-slate-100 px-2 py-1 rounded">{item.figureCount} figures</span>
                </div>
                {item.kpis.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {item.kpis.slice(0, 4).map((kpi) => (
                      <div key={kpi.label}>
                        <p className="text-[10px] uppercase text-slate-400 font-semibold">{kpi.label}</p>
                        <p className="text-sm font-bold text-slate-700">{kpi.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-sm font-semibold text-indigo-600">Ouvrir le rapport →</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
