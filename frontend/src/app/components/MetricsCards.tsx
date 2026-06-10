import React from 'react';

interface Metric {
  label: string;
  value: string;
  color?: string;
}

export function MetricsCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
          <p className={`text-2xl font-bold mt-1 ${m.color ?? 'text-slate-800'}`}>{m.value}</p>
        </div>
      ))}
    </div>
  );
}
