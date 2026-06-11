import React from 'react';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import { Loader2 } from 'lucide-react';
import type { PlotlyFigurePayload } from '@/lib/api';

interface PlotlyChartProps {
  data: PlotlyFigurePayload | null;
  loading: boolean;
  error: string | null;
  title?: string;
  caption?: string;
  className?: string;
  height?: number;
  /** Limite la largeur du panneau à celle intrinsèque du graphique Plotly. */
  fitContent?: boolean;
}

export function PlotlyChart({
  data,
  loading,
  error,
  title,
  caption,
  className = '',
  height = 420,
  fitContent = false,
}: PlotlyChartProps) {
  const intrinsicWidth =
    typeof data?.layout?.width === 'number' ? data.layout.width : undefined;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${fitContent ? 'w-fit max-w-full' : ''} ${className}`}
      style={
        fitContent && intrinsicWidth
          ? { maxWidth: intrinsicWidth }
          : undefined
      }
    >
      {(title || caption) && (
        <div className="px-4 py-3 border-b border-slate-100">
          {title && <h4 className="text-sm font-bold text-slate-800 uppercase">{title}</h4>}
          {caption && <p className="text-xs text-slate-500 mt-1">{caption}</p>}
        </div>
      )}
      <div className="p-2 min-h-[200px] w-full overflow-x-auto">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-12">
            <Loader2 size={18} className="animate-spin" /> Chargement du graphique…
          </div>
        )}
        {error && !loading && (
          <p className="text-slate-400 text-sm py-8 px-4 text-center">{error}</p>
        )}
        {data && !loading && (
          <Plot
            data={data.data as Data[]}
            layout={{
              ...data.layout,
              autosize: true,
              width: fitContent ? undefined : data.layout?.width,
              height,
              margin: { ...(data.layout?.margin as object), t: data.layout?.title ? 50 : 30 },
            }}
            config={{ responsive: true, displayModeBar: true, displaylogo: false }}
            style={{
              width: '100%',
              maxWidth: fitContent && intrinsicWidth ? intrinsicWidth : undefined,
              height,
            }}
            useResizeHandler
          />
        )}
      </div>
    </div>
  );
}
