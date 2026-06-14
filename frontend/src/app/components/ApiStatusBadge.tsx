import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { useHealth } from '@/lib/hooks';

export function ApiStatusBadge() {
  const { data, loading } = useHealth();
  const active = data?.fraud_model_loaded && data?.cluster_model_loaded;

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold">
        <Activity size={16} className="animate-pulse shrink-0" />
        <span className="hidden sm:inline">CHARGEMENT...</span>
        <span className="sm:hidden">...</span>
      </div>
    );
  }

  if (active) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 border border-emerald-200/60 rounded-lg text-xs sm:text-sm font-semibold shadow-sm">
        <Activity size={16} className="shrink-0" /> ACTIF
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs sm:text-sm font-semibold">
      <AlertTriangle size={16} className="shrink-0" />
      <span className="hidden sm:inline">MODÈLES NON CHARGÉS</span>
      <span className="sm:hidden">OFFLINE</span>
    </div>
  );
}
