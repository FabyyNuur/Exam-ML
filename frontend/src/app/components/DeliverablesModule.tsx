import React from 'react';
import { Link } from 'react-router-dom';
import { FileCode2, Github, BookOpen, Presentation, FileCode, CheckCircle2, FolderTree, FileText } from 'lucide-react';

const REPO_ITEMS = [
  { icon: BookOpen, title: 'README.md', desc: 'Installation, entraînement, lancement API + frontend React.' },
  { icon: FileCode, title: 'notebooks/', desc: '01_exercice1_detection_fraude, 02_exercice2_segmentation_clients, 03_mlops_architecture.' },
  { icon: FolderTree, title: 'mlops/', desc: 'API FastAPI, pipeline CLI, contenu pédagogique partagé.' },
  { icon: FileCode2, title: 'frontend/', desc: 'Dashboard React (Vite + Tailwind) connecté à l\'API.' },
  { icon: FileCode2, title: 'requirements.txt', desc: 'Dépendances Python pour ML, API et tests.' },
];

export function DeliverablesModule() {
  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6 p-0 sm:p-2 relative z-10 min-w-0">
      <div className="flex flex-col gap-4 sm:gap-6 border-b border-slate-300/50 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
              <FileCode2 size={24} className="sm:hidden" />
              <FileCode2 size={28} className="hidden sm:block" />
            </div>
            LIVRABLES DU PROJET
          </h2>
          <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-sm sm:text-base">Dépôt GitHub & Documentation Finale</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 min-h-0 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Github className="text-emerald-600" /> STRUCTURE Exam-ML
          </h3>
          <div className="space-y-4">
            {REPO_ITEMS.map((item) => (
              <div key={item.title} className="bg-slate-50 p-5 border border-slate-200 rounded-xl flex items-center gap-4">
                <item.icon className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <div className="text-slate-800 font-bold mb-1">{item.title}</div>
                  <div className="text-slate-500 text-sm leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-sm min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Presentation className="text-emerald-600" /> SOUMISSIONS FINALES
          </h3>
          <div className="space-y-8">
            {[
              {
                title: 'Rapports analytiques A4',
                desc: 'Rapports PDF par exercice — fraude et segmentation — visualisables et exportables depuis le dashboard.',
                link: '/rapports',
                linkLabel: 'Voir tous les rapports',
              },
              {
                title: 'Documentation',
                desc: 'docs/rapport_technique.md et docs/presentation.md — synthèse écrite et plan de soutenance.',
              },
              {
                title: 'Présentation',
                desc: 'docs/presentation.md — slides pour la soutenance orale (~15 min).',
              },
              {
                title: 'Tableau de Bord Interactif',
                desc: 'frontend/ — interface React avec données réelles (métriques, figures, prédiction live).',
              },
            ].map((item, i, arr) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${i === arr.length - 1 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                    <CheckCircle2 size={18} />
                  </div>
                  {i < arr.length - 1 && <div className="w-0.5 h-full bg-emerald-100 my-2" />}
                </div>
                <div className="pb-4">
                  <div className="text-slate-800 font-bold mb-2 flex items-center gap-2">
                    {item.title === 'Rapports analytiques A4' && <FileText size={18} className="text-indigo-600" />}
                    {item.title}
                  </div>
                  <div className="text-slate-600 text-sm leading-relaxed">{item.desc}</div>
                  {'link' in item && item.link && (
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {item.linkLabel} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
