import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { useHealth } from '@/lib/hooks';

export function ApiStatusBadge() {
  const { data, loading } = useHealth();
  const active = data?.fraud_model_loaded && data?.cluster_model_loaded;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-sm font-semibold">
        <Activity size={16} className="animate-pulse" /> CHARGEMENT...
      </div>
    );
  }

  if (active) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 border border-emerald-200/60 rounded-lg text-sm font-semibold shadow-sm">
        <Activity size={16} /> ACTIF
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold">
      <AlertTriangle size={16} /> MODÈLES NON CHARGÉS
    </div>
  );
}
