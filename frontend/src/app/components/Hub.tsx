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

export function Hub({ onSelect }: HubProps) {
  return (
    <div className="relative w-full max-w-[900px] h-[600px] flex items-center justify-center">
      {/* Central Core */}
      <motion.div 
        className="absolute z-10 w-48 h-48 rounded-full border border-white/60 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl shadow-xl"
      >
        <Target size={32} className="text-indigo-600 mb-2" />
        <span className="text-lg font-bold text-slate-800 tracking-wide">NOYAU</span>
        <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest mt-1">Connecté</span>
      </motion.div>
      <motion.div 
        className="absolute z-0 w-64 h-64 rounded-full border border-dashed border-indigo-200/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute z-0 w-[480px] h-[480px] rounded-full border border-indigo-200/40"
      />

      {/* Orbiting Modules */}
      {modules.map((mod, index) => {
        const angle = (index * Math.PI * 2) / modules.length;
        const radius = 240; // distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
            className="absolute z-40 top-1/2 left-1/2 -mt-20 -ml-32"
          >
            <button
              onClick={() => onSelect(mod.id)}
              className={`group flex flex-col items-center justify-center w-64 h-40 bg-white/70 backdrop-blur-lg border border-white/60 rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${mod.hover}`}
            >
              <div className={`p-4 rounded-full mb-3 bg-white shadow-sm ${mod.color}`}>
                <mod.icon size={28} className={mod.color} />
              </div>
              
              <div className="text-center px-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-1">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {mod.desc}
                </p>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
