import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Users, Server, FileCode2, Target } from 'lucide-react';

interface HubProps {
  onSelect: (module: string) => void;
}

const modules = [
  { id: 'fraud', title: 'DÉTECTION DE FRAUDE', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50', hover: 'hover:border-red-300 hover:shadow-red-100', desc: 'Apprentissage supervisé' },
  { id: 'deliverables', title: 'LIVRABLES DU PROJET', icon: FileCode2, color: 'text-emerald-500', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100', desc: 'Code source & Rapports' },
  { id: 'mlops', title: 'ARCHITECTURE MLOPS', icon: Server, color: 'text-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100', desc: 'Pipeline CI/CD / Suivi' },
  { id: 'segmentation', title: 'SEGMENTATION CLIENT', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300 hover:shadow-indigo-100', desc: 'Clustering / Profilage' },
];

function ModuleButton({
  mod,
  onSelect,
  className = '',
}: {
  mod: (typeof modules)[number];
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <button
      onClick={() => onSelect(mod.id)}
      className={`group flex flex-col items-center justify-center w-full sm:w-64 h-auto min-h-[7rem] sm:h-40 bg-white/70 backdrop-blur-lg border border-white/60 rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${mod.hover} ${className}`}
    >
      <div className={`p-3 sm:p-4 rounded-full mb-2 sm:mb-3 bg-white shadow-sm ${mod.color}`}>
        <mod.icon size={24} className={`sm:hidden ${mod.color}`} />
        <mod.icon size={28} className={`hidden sm:block ${mod.color}`} />
      </div>
      <div className="text-center px-4 pb-3 sm:pb-0">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide mb-1">
          {mod.title}
        </h3>
        <p className="text-xs text-slate-500 font-medium">{mod.desc}</p>
      </div>
    </button>
  );
}

export function Hub({ onSelect }: HubProps) {
  return (
    <>
      {/* Mobile / tablette : grille scrollable */}
      <div className="md:hidden w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-3">
        <div className="flex flex-col items-center mb-2">
          <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border border-white/60 bg-white/60 backdrop-blur-xl shadow-xl">
            <Target size={24} className="text-indigo-600 mb-1" />
            <span className="text-sm font-bold text-slate-800 tracking-wide">NOYAU</span>
            <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mt-0.5">
              Connecté
            </span>
          </div>
        </div>
        {modules.map((mod) => (
          <ModuleButton key={mod.id} mod={mod} onSelect={onSelect} />
        ))}
      </div>

      {/* Desktop : disposition orbitale */}
      <div className="hidden md:flex relative w-full max-w-[900px] h-[600px] items-center justify-center">
        <motion.div
          className="absolute z-10 w-48 h-48 rounded-full border border-white/60 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl shadow-xl"
        >
          <Target size={32} className="text-indigo-600 mb-2" />
          <span className="text-lg font-bold text-slate-800 tracking-wide">NOYAU</span>
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest mt-1">
            Connecté
          </span>
        </motion.div>
        <motion.div
          className="absolute z-0 w-64 h-64 rounded-full border border-dashed border-indigo-200/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div className="absolute z-0 w-[480px] h-[480px] rounded-full border border-indigo-200/40" />

        {modules.map((mod, index) => {
          const angle = (index * Math.PI * 2) / modules.length;
          const radius = 240;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x, y }}
              transition={{ duration: 0.8, delay: index * 0.1, type: 'spring' }}
              className="absolute z-40 top-1/2 left-1/2 -mt-20 -ml-32"
            >
              <ModuleButton mod={mod} onSelect={onSelect} className="w-64" />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
