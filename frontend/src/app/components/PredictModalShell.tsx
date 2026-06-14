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
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center gap-3 bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 min-w-0">
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{title}</span>
              </h3>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => onTabChange('upload')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
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
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  tab === 'manual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Saisie manuelle
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {intro && <div className="mb-5">{intro}</div>}
              {tab === 'upload' ? uploadPanel : manualPanel}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
