import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Server, Database, GitBranch, Terminal, Cpu, CheckCircle2, AlertCircle, Box, Clock,
} from 'lucide-react';
import { FigureImage } from './FigureImage';
import { useHealth } from '@/lib/hooks';

export function MLOpsModule() {
  const { data: health } = useHealth();
  const [checkedAt, setCheckedAt] = useState<string>('');

  useEffect(() => {
    if (health) {
      setCheckedAt(new Date().toLocaleTimeString('fr-FR'));
    }
  }, [health]);

  const modelsOk = health?.fraud_model_loaded && health?.cluster_model_loaded;

  const pipelineSteps = [
    { id: 'ingestion', label: 'INGESTION DES DONNÉES', status: 'success', icon: Database },
    { id: 'validation', label: 'VALIDATION & NETTOYAGE', status: 'success', icon: CheckCircle2 },
    { id: 'versioning', label: 'VERSIONING (MLflow)', status: 'success', icon: GitBranch },
    { id: 'training', label: 'ENTRAÎNEMENT DU MODÈLE', status: modelsOk ? 'success' : 'active', icon: Cpu },
    { id: 'deployment', label: 'DÉPLOIEMENT API + REACT', status: modelsOk ? 'success' : 'pending', icon: Box },
    { id: 'monitoring', label: 'SUIVI (MONITORING)', status: modelsOk ? 'active' : 'pending', icon: AlertCircle },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6 p-0 sm:p-2 relative z-10 min-w-0">
      <div className="flex flex-col gap-4 sm:gap-6 border-b border-slate-300/50 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
              <Server size={24} className="sm:hidden" />
              <Server size={28} className="hidden sm:block" />
            </div>
            ARCHITECTURE MLOPS
          </h2>
          <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-sm sm:text-base">Intégration Continue / Déploiement Continu / Monitoring</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 min-h-0 overflow-y-auto">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-8 flex flex-col shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-800 mb-8 uppercase tracking-wide">Pipeline End-to-End</h3>
          <div className="flex flex-col gap-6">
            {pipelineSteps.map((step, index) => {
              const isSuccess = step.status === 'success';
              const isActive = step.status === 'active';
              const colorClass = isSuccess
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : isActive
                  ? 'text-blue-600 bg-blue-50 border-blue-300 shadow-sm'
                  : 'text-slate-400 bg-slate-50 border-slate-200';
              const iconColorClass = isSuccess
                ? 'text-emerald-600 bg-white border-emerald-200'
                : isActive
                  ? 'text-blue-600 bg-white border-blue-500 ring-4 ring-blue-50'
                  : 'text-slate-400 bg-slate-100 border-slate-200';

              return (
                <div key={step.id} className="relative flex items-start sm:items-center gap-3 sm:gap-6">
                  {index < pipelineSteps.length - 1 && (
                    <div className={`absolute left-6 top-12 bottom-[-24px] w-0.5 z-0 ${isSuccess ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  )}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full border-2 flex items-center justify-center z-10 ${iconColorClass}`}>
                    {isActive ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                        <step.icon size={20} />
                      </motion.div>
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 border p-3 sm:p-4 rounded-xl ${colorClass}`}>
                    <span className="font-bold text-xs sm:text-sm">{step.label}</span>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80 shrink-0">
                      {isSuccess ? 'TERMINÉ' : isActive ? 'EN COURS...' : 'EN ATTENTE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <FigureImage filename="mlops_monitoring.png" title="Monitoring & dérive" />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wide">Déploiements Système</h3>
            <div className="space-y-4">
              <div className={`border p-4 rounded-xl ${modelsOk ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm">exam-ml-api</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${modelsOk ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'}`}>
                    {modelsOk ? 'EN LIGNE' : 'PARTIEL'}
                  </span>
                </div>
                <div className="text-sm text-slate-600">FastAPI — /health, /predict/*, /metadata</div>
              </div>
              <div className="border border-blue-200 p-4 rounded-xl bg-blue-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm">exam-ml-frontend</span>
                  <span className="text-xs text-blue-700 font-bold px-2 py-1 bg-blue-100 rounded-md">REACT</span>
                </div>
                <div className="text-sm text-slate-600">Render Static Site — Vite + Tailwind</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wide">Statut API</h3>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex gap-3 items-start text-slate-600">
                <Clock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">{checkedAt || '—'}</div>
                  Health check — Fraude: {health?.fraud_model_loaded ? 'OK' : 'KO'} · Cluster: {health?.cluster_model_loaded ? 'OK' : 'KO'}
                </div>
              </div>
              <div className="flex gap-3 items-start text-slate-600">
                <Terminal size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Pipeline</div>
                  python -m mlops.pipeline --task all
                </div>
              </div>
              <div className="flex gap-3 items-start text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">CI/CD</div>
                  GitHub Actions — tests + validation schéma
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
