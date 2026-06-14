import React from 'react';
import { FraudBatchEvaluation } from '@/lib/api';

interface EvaluationSummaryProps {
  evaluation: FraudBatchEvaluation;
}

export function EvaluationSummary({ evaluation }: EvaluationSummaryProps) {
  const { confusion_matrix: cm } = evaluation;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="font-semibold text-slate-800 text-sm mb-3">Évaluation (colonne isFraud)</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Accuracy', value: evaluation.accuracy.toFixed(3) },
          { label: 'ROC-AUC', value: evaluation.roc_auc.toFixed(3) },
          { label: 'Precision', value: evaluation.precision.toFixed(3) },
          { label: 'Recall', value: evaluation.recall.toFixed(3) },
          { label: 'F1', value: evaluation.f1.toFixed(3) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg p-2 border border-emerald-100 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs max-w-xs">
        <div className="bg-white p-2 rounded border text-center">
          <span className="text-slate-500">TP</span> <strong>{cm.tp}</strong>
        </div>
        <div className="bg-white p-2 rounded border text-center">
          <span className="text-slate-500">FP</span> <strong>{cm.fp}</strong>
        </div>
        <div className="bg-white p-2 rounded border text-center">
          <span className="text-slate-500">TN</span> <strong>{cm.tn}</strong>
        </div>
        <div className="bg-white p-2 rounded border text-center">
          <span className="text-slate-500">FN</span> <strong>{cm.fn}</strong>
        </div>
      </div>
    </div>
  );
}
