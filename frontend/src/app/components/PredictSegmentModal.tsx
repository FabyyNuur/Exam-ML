import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Loader2 } from 'lucide-react';
import { CustomerRequest } from '@/lib/api';
import { usePredictSegment } from '@/lib/hooks';

interface PredictSegmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function PredictSegmentModal({ open, onClose }: PredictSegmentModalProps) {
  const { predict, loading, error, result } = usePredictSegment();
  const [form, setForm] = useState<CustomerRequest>({
    income: 60000,
    age: 40,
    total_spend: 800,
    num_web_purchases: 6,
    num_store_purchases: 4,
    recency: 20,
    children: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await predict(form);
  };

  const fields: { key: keyof CustomerRequest; label: string }[] = [
    { key: 'income', label: 'Revenu annuel' },
    { key: 'age', label: 'Âge' },
    { key: 'total_spend', label: 'Dépenses totales' },
    { key: 'num_web_purchases', label: 'Achats web' },
    { key: 'num_store_purchases', label: 'Achats magasin' },
    { key: 'recency', label: 'Récence (jours)' },
    { key: 'children', label: 'Enfants' },
  ];

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
                <Users className="text-indigo-500" size={20} /> Test de Segmentation
              </h3>
              <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">{label}</label>
                    <input
                      type="number"
                      value={form[key]}
                      min={key === 'age' ? 18 : 0}
                      max={key === 'age' ? 100 : undefined}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
              )}

              {result && (
                <div className="rounded-xl p-4 border bg-indigo-50 border-indigo-200">
                  <p className="font-bold text-slate-800">Profil : {result.profile}</p>
                  <p className="text-sm text-slate-600 mt-1">Cluster {result.cluster_id} — {result.description}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyse...</> : 'SEGMENTER LE CLIENT'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
