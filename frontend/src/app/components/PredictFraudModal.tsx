import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import { FraudRequest } from '@/lib/api';
import { usePredictFraud } from '@/lib/hooks';

const TX_TYPES = ['PAYMENT', 'TRANSFER', 'CASH_OUT', 'DEBIT', 'CASH_IN'] as const;

interface PredictFraudModalProps {
  open: boolean;
  onClose: () => void;
}

export function PredictFraudModal({ open, onClose }: PredictFraudModalProps) {
  const { predict, loading, error, result } = usePredictFraud();
  const [form, setForm] = useState<FraudRequest>({
    step: 100,
    type: 'TRANSFER',
    amount: 5000,
    oldbalanceOrg: 10000,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await predict(form);
  };

  const field = (key: keyof FraudRequest, label: string, type: 'number' | 'select' = 'number') => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">{label}</label>
      {type === 'select' ? (
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as FraudRequest['type'] })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          {TX_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={form[key] as number}
          min={key === 'step' ? 1 : 0}
          onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={20} /> Test de Détection
              </h3>
              <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {field('step', 'Step')}
                {field('type', 'Type', 'select')}
                {field('amount', 'Montant')}
                {field('oldbalanceOrg', 'Solde émetteur (avant)')}
                {field('newbalanceOrig', 'Solde émetteur (après)')}
                {field('oldbalanceDest', 'Solde destinataire (avant)')}
                {field('newbalanceDest', 'Solde destinataire (après)')}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
              )}

              {result && (
                <div className={`rounded-xl p-4 border ${result.is_fraud ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="font-bold text-slate-800">
                    {result.is_fraud ? 'FRAUDE DÉTECTÉE' : 'TRANSACTION LÉGITIME'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Probabilité : {(result.probability * 100).toFixed(1)}% — Risque : {result.risk_level}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyse...</> : 'SCORER LA TRANSACTION'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
