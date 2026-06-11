import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { ShieldAlert, FileText, Search, Settings, Cpu, UploadCloud } from 'lucide-react';
import { ApiStatusBadge } from './ApiStatusBadge';
import { ChartPanel } from './ChartPanel';
import { InsightsList } from './InsightsList';
import { MetricsCards } from './MetricsCards';
import { PredictFraudModal } from './PredictFraudModal';
import { useFraudEda, useFraudModels, useMetadata, usePageContent } from '@/lib/hooks';
import type { PageContent, PageFigure } from '@/lib/api';

type Tab = 'CONTEXT' | 'EDA' | 'PREPROCESSING' | 'MODELING';

const PIE_COLORS = ['#94a3b8', '#ef4444'];

const PLOTLY_CHART_HEIGHTS: Record<string, number> = {
  'ex1_amount_distribution.png': 440,
  'ex1_suspicious_behavior.png': 480,
  'ex1_roc_curves.png': 520,
  'ex1_best_model_eval.png': 560,
  'ex1_threshold_analysis.png': 520,
  'ex1_shap_importance.png': 500,
  'ex1_shap_beeswarm.png': 640,
  'ex1_shap_force_plot.png': 640,
};

function plotlyHeight(filename: string): number {
  return PLOTLY_CHART_HEIGHTS[filename] ?? 480;
}

const RECHARTS_INTERPRETATIONS = {
  fraudByType:
    'Les fraudes se concentrent principalement sur les opérations de type TRANSFER et CASH_OUT, '
    + 'qui représentent les canaux les plus exposés aux détournements de fonds.',
  cvRoc:
    'La validation croisée confirme que XGBoost obtient le ROC-AUC le plus élevé parmi les quatre modèles testés, '
    + 'avec une faible variance entre les folds, signe d\'une bonne généralisation.',
  testMetrics:
    'Sur le jeu de test, le recall atteint environ 97 % grâce au seuil abaissé à 30 %, tandis que la precision '
    + 'et le F1 restent plus modérés en raison du fort déséquilibre des classes.',
} as const;

function InterpretationBlock({ text }: { text: string }) {
  return (
    <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-lg text-sm text-red-900 leading-relaxed">
      <strong>Interprétation :</strong> {text}
    </div>
  );
}

function getFigure(page: PageContent | undefined, filename: string): PageFigure | undefined {
  return page?.figures.find((f) => f.filename === filename);
}

function ChartWithInterpretation({
  filename,
  figure,
  height = 480,
}: {
  filename: string;
  figure?: PageFigure;
  height?: number;
}) {
  if (!figure) {
    return (
      <ChartPanel
        filename={filename}
        height={height}
        className="w-full"
      />
    );
  }
  return (
    <div className="flex flex-col gap-3 w-full">
      <ChartPanel
        filename={filename}
        title={figure.title}
        caption={figure.caption}
        height={height}
        className="w-full"
      />
      {figure.interpretation && <InterpretationBlock text={figure.interpretation} />}
    </div>
  );
}

function FullWidthChart({
  filename,
  figure,
}: {
  filename: string;
  figure?: PageFigure;
}) {
  return (
    <div className="w-full">
      <ChartWithInterpretation
        filename={filename}
        figure={figure}
        height={plotlyHeight(filename)}
      />
    </div>
  );
}

export function FraudModule() {
  const [activeTab, setActiveTab] = useState<Tab>('CONTEXT');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getPage } = usePageContent();
  const { data: eda } = useFraudEda();
  const { data: modelsData } = useFraudModels();
  const { data: metadata } = useMetadata();

  const contextPage = getPage('ex1_eda');
  const edaPage = contextPage;
  const prepPage = getPage('ex1_preprocessing');
  const modelPage = getPage('ex1_modeling');
  const evalPage = getPage('ex1_evaluation');
  const fraudMeta = metadata?.fraud;

  const modelMetrics = fraudMeta
    ? [
        { name: 'ROC-AUC', value: (fraudMeta.roc_auc * 100).toFixed(1) },
        { name: 'F1', value: (fraudMeta.f1 * 100).toFixed(1) },
        { name: 'Précision', value: (fraudMeta.precision * 100).toFixed(1) },
        { name: 'Rappel', value: (fraudMeta.recall * 100).toFixed(1) },
      ]
    : [];

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 relative z-10">
      <div className="flex flex-col gap-6 border-b border-slate-300/50 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <ShieldAlert size={28} />
              </div>
              DÉTECTION DE FRAUDE
            </h2>
            <p className="text-slate-500 font-medium mt-2">Apprentissage Supervisé / Résolution d&apos;Anomalies</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-700 px-4 py-2 font-medium text-sm rounded-lg hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
            >
              <UploadCloud size={16} /> TESTER LE MODÈLE
            </button>
            <ApiStatusBadge />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'CONTEXT', label: 'CONTEXTE', icon: <FileText size={16} /> },
            { id: 'EDA', label: 'ANALYSE EXPLORATOIRE', icon: <Search size={16} /> },
            { id: 'PREPROCESSING', label: 'PRÉTRAITEMENT', icon: <Settings size={16} /> },
            { id: 'MODELING', label: 'MODÉLISATION & RÉSULTATS', icon: <Cpu size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'CONTEXT' && (
            <motion.div key="context" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">PROBLÉMATIQUE MÉTIER</h3>
                <div className="text-slate-600 leading-relaxed space-y-4">
                  <p>
                    L&apos;objectif de ce module est de détecter les transactions financières frauduleuses en temps réel.
                    Le dataset PaySim simule des transferts mobiles avec un fort déséquilibre de classes.
                  </p>
                  {contextPage?.insights.map((insight, i) => (
                    <p key={i}>{insight}</p>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">DATASET</h3>
                <p className="text-slate-500 text-sm">{contextPage?.subtitle}</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'EDA' && (
            <motion.div key="eda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-8">
              <InsightsList title="Analyses exploratoires" insights={edaPage?.insights ?? []} variant="red" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Déséquilibre des classes</h3>
                    {eda ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={eda.class_balance} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                            {eda.class_balance.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">Analytics non disponibles — exécuter le pipeline.</p>
                    )}
                  </div>
                  {getFigure(edaPage, 'ex1_class_distribution.png')?.interpretation && (
                    <InterpretationBlock text={getFigure(edaPage, 'ex1_class_distribution.png')!.interpretation!} />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Fraudes par type</h3>
                    {eda?.fraud_by_type?.length ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={eda.fraud_by_type} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis type="category" dataKey="type" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                          <RechartsTooltip />
                          <Bar dataKey="fraud" name="Fraudes" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">Données non disponibles.</p>
                    )}
                  </div>
                  <InterpretationBlock text={RECHARTS_INTERPRETATIONS.fraudByType} />
                </div>
              </div>

              <div className="flex flex-col gap-8 w-full">
                <FullWidthChart
                  filename="ex1_amount_distribution.png"
                  figure={getFigure(edaPage, 'ex1_amount_distribution.png')}
                />
                <FullWidthChart
                  filename="ex1_suspicious_behavior.png"
                  figure={getFigure(edaPage, 'ex1_suspicious_behavior.png')}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'PREPROCESSING' && (
            <motion.div key="prep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prepPage?.insights.map((insight, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-slate-600 text-sm leading-relaxed">
                  {insight}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'MODELING' && (
            <motion.div key="modeling" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-8">
              {fraudMeta && (
                <MetricsCards
                  metrics={[
                    { label: 'Modèle retenu', value: fraudMeta.model_name.toUpperCase(), color: 'text-red-600' },
                    { label: 'ROC-AUC', value: fraudMeta.roc_auc.toFixed(3), color: 'text-red-600' },
                    {
                      label: 'CV ROC-AUC',
                      value: fraudMeta.cv_roc_auc_mean != null
                        ? fraudMeta.cv_roc_auc_mean.toFixed(3)
                        : '—',
                      color: 'text-red-500',
                    },
                    { label: 'F1 (seuil 0.3)', value: fraudMeta.f1.toFixed(3), color: 'text-red-400' },
                  ]}
                />
              )}

              <div className="grid grid-cols-1 gap-6 max-w-2xl">
                {modelsData?.models?.length ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Comparaison CV ROC-AUC</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={modelsData.models}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <RechartsTooltip />
                          <Bar dataKey="roc" name="ROC-AUC (%)" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <InterpretationBlock text={RECHARTS_INTERPRETATIONS.cvRoc} />
                  </div>
                ) : null}

                {modelMetrics.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Métriques test — {fraudMeta?.model_name}</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={modelMetrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <InterpretationBlock text={RECHARTS_INTERPRETATIONS.testMetrics} />
                  </div>
                )}
              </div>

              <InsightsList
                title="Comparaison des modèles"
                insights={modelPage?.insights ?? []}
                variant="red"
              />

              <FullWidthChart
                filename="ex1_roc_curves.png"
                figure={getFigure(modelPage, 'ex1_roc_curves.png')}
              />

              <InsightsList
                title="Évaluation & interprétabilité SHAP"
                insights={evalPage?.insights ?? []}
                variant="red"
              />

              <div className="flex flex-col gap-8 w-full">
                {evalPage?.figures.map((figure) => (
                  <FullWidthChart
                    key={figure.filename}
                    filename={figure.filename}
                    figure={figure}
                  />
                ))}
              </div>

              <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Synthèse :</strong> Le dataset PaySim présente un déséquilibre de classes
                  (~0,1 % de fraudes). Nous avons appliqué SMOTE et un rééquilibrage par class_weight
                  pour que le modèle ne néglige pas la classe minoritaire.
                </p>
                <p>
                  Parmi les quatre algorithmes comparés, XGBoost obtient le meilleur ROC-AUC en validation
                  croisée (~0,996) et sur le jeu de test (~0,997). Les variables les plus discriminantes
                  sont les soldes dérivés (orig_zeroed, error_balance) et le montant de la transaction.
                </p>
                <p>
                  En contexte de détection de fraude, un faux négatif (fraude non détectée) est plus
                  coûteux qu&apos;un faux positif. Le seuil de décision a donc été abaissé à 30 % afin
                  d&apos;atteindre un recall d&apos;environ 97 %, au prix d&apos;une precision plus modérée.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PredictFraudModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
