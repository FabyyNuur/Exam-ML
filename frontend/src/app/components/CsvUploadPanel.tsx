import React, { useCallback, useState } from 'react';
import { Download, FileUp, Loader2 } from 'lucide-react';
import { CsvPreviewData, readCsvPreview, templateUrl } from '@/lib/csvUtils';

interface CsvUploadPanelProps {
  templateKind: 'fraud' | 'segment';
  loading: boolean;
  error: string | null;
  onSubmit: (file: File) => void;
  submitLabel: string;
  children?: React.ReactNode;
}

export function CsvUploadPanel({
  templateKind,
  loading,
  error,
  onSubmit,
  submitLabel,
  children,
}: CsvUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (selected: File) => {
    setLocalError(null);
    try {
      const data = await readCsvPreview(selected);
      if (data.rowCount === 0) {
        throw new Error('Le fichier ne contient aucune ligne de données');
      }
      setFile(selected);
      setPreview(data);
    } catch (e) {
      setFile(null);
      setPreview(null);
      setLocalError(e instanceof Error ? e.message : 'Fichier invalide');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) void handleFile(dropped);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <FileUp className="mx-auto text-slate-400 mb-3" size={32} />
        <p className="text-sm text-slate-600 mb-3">
          Glissez-déposez un fichier <strong>.csv</strong> ou cliquez pour parcourir
        </p>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          id={`csv-input-${templateKind}`}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void handleFile(selected);
          }}
        />
        <label
          htmlFor={`csv-input-${templateKind}`}
          className="inline-block cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-300"
        >
          Choisir un fichier
        </label>
        <p className="text-xs text-slate-400 mt-2">Max 8 Mo</p>
      </div>

      <a
        href={templateUrl(templateKind)}
        download
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium w-fit"
      >
        <Download size={16} /> Télécharger un modèle CSV
      </a>

      {file && preview && (
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <p className="font-medium text-slate-800 text-sm mb-2">
            {file.name} — {preview.rowCount} ligne(s), {preview.columns.length} colonne(s)
          </p>
          {preview.hasIsFraud && templateKind === 'fraud' && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
              Colonne <code>isFraud</code> détectée — évaluation automatique activée
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  {preview.columns.slice(0, 6).map((col) => (
                    <th key={col} className="py-1 pr-3 font-semibold">
                      {col}
                    </th>
                  ))}
                  {preview.columns.length > 6 && <th className="py-1">…</th>}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {row.slice(0, 6).map((cell, j) => (
                      <td key={j} className="py-1 pr-3 text-slate-700 truncate max-w-[120px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {displayError}
        </p>
      )}

      {children}

      <button
        type="button"
        disabled={!file || loading}
        onClick={() => file && onSubmit(file)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Analyse en cours…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
