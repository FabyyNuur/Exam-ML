import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { downloadCsv } from '@/lib/csvUtils';

interface BatchResultsPanelProps {
  summaryCards: { label: string; value: string }[];
  headers: string[];
  rows: string[][];
  exportFilename: string;
  errors?: string[];
  extra?: React.ReactNode;
  interpretation?: string;
}

const PAGE_SIZE = 50;

export function BatchResultsPanel({
  summaryCards,
  headers,
  rows,
  exportFilename,
  errors = [],
  extra,
  interpretation,
}: BatchResultsPanelProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [rows, page],
  );

  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-sm font-semibold text-slate-800">Résultats du test</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summaryCards.map(({ label, value }) => (
          <div
            key={label}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center"
          >
            <p className="text-xs text-slate-500 uppercase font-semibold">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {interpretation && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950 leading-relaxed">
          <strong>Lecture :</strong> {interpretation}
        </div>
      )}

      {extra}

      {errors.length > 0 && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
          {errors.slice(0, 5).map((err, i) => (
            <p key={i}>{err}</p>
          ))}
          {errors.length > 5 && <p>… et {errors.length - 5} autre(s) avertissement(s)</p>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{rows.length} prédiction(s)</p>
        <button
          type="button"
          onClick={() => downloadCsv(exportFilename, headers, rows)}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Download size={16} /> Exporter CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="text-xs w-full">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-slate-500">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
