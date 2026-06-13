import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export type PredictTab = 'upload' | 'manual';

interface PredictModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  intro?: React.ReactNode;
  loading?: boolean;
  tab: PredictTab;
  onTabChange: (tab: PredictTab) => void;
  uploadPanel: React.ReactNode;
  manualPanel: React.ReactNode;
}

export function PredictModalShell({
  open,
  onClose,
  title,
  icon,
  intro,
  loading = false,
  tab,
  onTabChange,
  uploadPanel,
  manualPanel,
}: PredictModalShellProps) {
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {icon}
                {title}
              </h3>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('upload')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === 'upload'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Upload CSV
              </button>
              <button
                type="button"
                onClick={() => onTabChange('manual')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === 'manual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Saisie manuelle
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {intro && <div className="mb-5">{intro}</div>}
              {tab === 'upload' ? uploadPanel : manualPanel}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
