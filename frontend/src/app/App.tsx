import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hub } from './components/Hub';
import { FraudModule } from './components/FraudModule';
import { SegmentationModule } from './components/SegmentationModule';
import { MLOpsModule } from './components/MLOpsModule';
import { DeliverablesModule } from './components/DeliverablesModule';
import { HudFrame } from './components/HudFrame';

export default function App() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSystemReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!systemReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-fuchsia-50 flex flex-col items-center justify-center font-sans text-indigo-900">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-16 h-16 border-t-2 border-r-2 border-indigo-600 rounded-full mb-8"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="tracking-widest text-lg font-medium"
        >
          CHARGEMENT DU PROJET...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-fuchsia-50 text-slate-800 overflow-hidden font-sans selection:bg-indigo-500/30">
      <HudFrame title="PROJET ML M2CDSD // TABLEAU DE BORD" onHome={() => setActiveModule(null)} showHome={activeModule !== null}>
        <AnimatePresence mode="wait">
          {!activeModule && (
            <motion.div 
              key="hub"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Hub onSelect={setActiveModule} />
            </motion.div>
          )}

          {activeModule === 'fraud' && (
            <motion.div
              key="fraud"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 p-8 pt-24"
            >
              <FraudModule />
            </motion.div>
          )}

          {activeModule === 'segmentation' && (
            <motion.div
              key="segmentation"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 p-8 pt-24"
            >
              <SegmentationModule />
            </motion.div>
          )}

          {activeModule === 'mlops' && (
            <motion.div
              key="mlops"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 p-8 pt-24"
            >
              <MLOpsModule />
            </motion.div>
          )}

          {activeModule === 'deliverables' && (
            <motion.div
              key="deliverables"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 p-8 pt-24"
            >
              <DeliverablesModule />
            </motion.div>
          )}
        </AnimatePresence>
      </HudFrame>
    </div>
  );
}
