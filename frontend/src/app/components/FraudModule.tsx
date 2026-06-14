import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  FileText,
  Search,
  Settings,
  Scale,
  Cpu,
  UploadCloud,
} from 'lucide-react';
import { ApiStatusBadge } from "./ApiStatusBadge";
import { ChartWithInterpretation } from "./ChartWithInterpretation";
import { InsightsList } from "./InsightsList";
import { MetricsCards } from "./MetricsCards";
import { PredictFraudModal } from "./PredictFraudModal";
import { FraudInteractiveExplorer } from "./FraudInteractiveExplorer";
import {
  useFraudEda,
  useFraudModels,
  useFraudSmote,
  useMetadata,
  usePageContent,
} from "@/lib/hooks";
import {
  interpretFraudByType,
  interpretFraudClassBalance,
  interpretFraudCvRoc,
  interpretFraudPreprocessing,
  interpretFraudSmote,
  interpretFraudTestMetrics,
} from "@/lib/chartInterpretations";
import type { PageContent, PageFigure } from "@/lib/api";

type Tab = "CONTEXT" | "EDA" | "PREPROCESSING" | "IMBALANCE" | "MODELING";

const PIE_COLORS = ["#94a3b8", "#ef4444"];

const PLOTLY_CHART_HEIGHTS: Record<string, number> = {
  "ex1_amount_distribution.png": 440,
  "ex1_suspicious_behavior.png": 480,
  "ex1_roc_curves.png": 520,
  "ex1_nn_training.png": 480,
  "ex1_best_model_eval.png": 560,
  "ex1_threshold_analysis.png": 520,
  "ex1_shap_importance.png": 500,
  "ex1_shap_beeswarm.png": 640,
  "ex1_shap_force_plot.png": 640,
};

function plotlyHeight(filename: string): number {
  return PLOTLY_CHART_HEIGHTS[filename] ?? 480;
}

function InterpretationBlock({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-red-50 border border-red-100 px-4 py-3 rounded-lg text-sm text-red-900 leading-relaxed ${className}`}
    >
      <strong>Interprétation :</strong> {text}
    </div>
  );
}

function getFigure(
  page: PageContent | undefined,
  filename: string,
): PageFigure | undefined {
  return page?.figures.find((f) => f.filename === filename);
}

function FullWidthChart({
  filename,
  figure,
}: {
  filename: string;
  figure?: PageFigure;
}) {
  return (
    <ChartWithInterpretation
      filename={filename}
      figure={figure}
      height={plotlyHeight(filename)}
      variant="red"
    />
  );
}

export function FraudModule() {
  const [activeTab, setActiveTab] = useState<Tab>("CONTEXT");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getPage } = usePageContent();
  const { data: eda } = useFraudEda();
  const { data: modelsData } = useFraudModels();
  const { data: smoteData } = useFraudSmote();
  const { data: metadata } = useMetadata();

  const contextPage = getPage("ex1_eda");
  const edaPage = contextPage;
  const prepPage = getPage("ex1_preprocessing");
  const imbalancePage = getPage("ex1_imbalance");
  const modelPage = getPage("ex1_modeling");
  const evalPage = getPage("ex1_evaluation");
  const fraudMeta = metadata?.fraud;

  const modelMetrics = fraudMeta
    ? [
        { name: "Accuracy", value: (fraudMeta.accuracy * 100).toFixed(1) },
        { name: "ROC-AUC", value: (fraudMeta.roc_auc * 100).toFixed(1) },
        { name: "F1", value: (fraudMeta.f1 * 100).toFixed(1) },
        { name: "Précision", value: (fraudMeta.precision * 100).toFixed(1) },
        { name: "Rappel", value: (fraudMeta.recall * 100).toFixed(1) },
      ]
    : [];

  const chartInterpretations = useMemo(
    () => ({
      classBalance: interpretFraudClassBalance(eda),
      fraudByType: interpretFraudByType(eda),
      cvRoc: interpretFraudCvRoc(modelsData?.models),
      testMetrics: interpretFraudTestMetrics(fraudMeta),
      preprocessing: interpretFraudPreprocessing(eda),
      smote: interpretFraudSmote(smoteData, eda),
    }),
    [eda, modelsData, fraudMeta, smoteData],
  );

  const derivedFeatureComparison = useMemo(() => {
    const features = eda?.preprocessing?.derived_features ?? [];
    return features.map((f) => ({
      name: f.label,
      fraude: Math.round(f.fraud_mean * 100) / 100,
      legitime: Math.round(f.legit_mean * 100) / 100,
    }));
  }, [eda]);

  const prepMetrics = useMemo(() => {
    const prep = eda?.preprocessing;
    if (!prep) return [];
    const orig = prep.derived_features.find((f) => f.name === "orig_zeroed");
    const err = prep.derived_features.find((f) => f.name === "error_balance_orig");
    const typeCount = Object.keys(prep.type_encoding).length;
    return [
      {
        label: "Features finales",
        value: String(prep.feature_count),
        color: "text-red-600",
      },
      {
        label: "Types encodés",
        value: String(typeCount),
        color: "text-red-500",
      },
      {
        label: "orig_zeroed (fraude)",
        value: orig ? `${orig.fraud_mean.toFixed(0)} %` : "—",
        color: "text-red-600",
      },
      {
        label: "orig_zeroed (légitime)",
        value: orig ? `${orig.legit_mean.toFixed(2)} %` : "—",
        color: "text-slate-600",
      },
      {
        label: "Δ error_balance_orig",
        value: err
          ? `${Math.round(err.fraud_mean - err.legit_mean).toLocaleString("fr-FR")}`
          : "—",
        color: "text-red-400",
      },
    ];
  }, [eda]);

  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6 p-0 sm:p-2 relative z-10 min-w-0">
      <div className="flex flex-col gap-4 sm:gap-6 border-b border-slate-300/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <ShieldAlert size={24} className="sm:hidden" />
                <ShieldAlert size={28} className="hidden sm:block" />
              </div>
              <span className="truncate">DÉTECTION DE FRAUDE</span>
            </h2>
            <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-sm sm:text-base">
              Apprentissage Supervisé / Résolution d&apos;Anomalies
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/rapport/fraude"
              className="flex items-center gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-700 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-lg hover:bg-white hover:text-red-600 transition-all shadow-sm"
            >
              <FileText size={16} /> <span className="hidden sm:inline">RAPPORT </span>PDF
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-700 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-lg hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
            >
              <UploadCloud size={16} /> <span className="hidden sm:inline">TESTER LE </span>MODÈLE
            </button>
            <ApiStatusBadge />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {[
            { id: "CONTEXT", label: "CONTEXTE", icon: <FileText size={16} /> },
            {
              id: "EDA",
              label: "ANALYSE EXPLORATOIRE",
              icon: <Search size={16} />,
            },
            {
              id: "PREPROCESSING",
              label: "PRÉTRAITEMENT",
              icon: <Settings size={16} />,
            },
            {
              id: "IMBALANCE",
              label: "CLASSE MINORITAIRE (SMOTE)",
              icon: <Scale size={16} />,
            },
            {
              id: "MODELING",
              label: "MODÉLISATION & RÉSULTATS",
              icon: <Cpu size={16} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-red-50 text-red-700 border border-red-200 shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "CONTEXT" && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                  PROBLÉMATIQUE MÉTIER
                </h3>
                <div className="text-slate-600 leading-relaxed space-y-4">
                  <p>
                    L&apos;objectif de ce module est de détecter les
                    transactions financières frauduleuses en temps réel. Le
                    dataset PaySim simule des transferts mobiles où la fraude
                    ne représente qu&apos;environ 0,11 % des transactions.
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  DATASET
                </h3>
                <p className="text-slate-500 text-sm">
                  {contextPage?.subtitle}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "EDA" && (
            <motion.div
              key="eda"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              <InsightsList
                title="Analyses exploratoires"
                insights={edaPage?.insights ?? []}
                variant="red"
              />

              {eda?.records?.length ? (
                <FraudInteractiveExplorer data={eda} />
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Répartition des classes
                    </h3>
                    {eda ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={eda.class_balance}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {eda.class_balance.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        Analytics non disponibles — exécuter le pipeline.
                      </p>
                    )}
                  </div>
                  <InterpretationBlock text={chartInterpretations.classBalance} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Fraudes par type
                    </h3>
                    {eda?.fraud_by_type?.length ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={eda.fraud_by_type}
                          layout="vertical"
                          margin={{ left: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="type"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            width={80}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="fraud"
                            name="Fraudes"
                            fill="#ef4444"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        Données non disponibles.
                      </p>
                    )}
                  </div>
                  <InterpretationBlock text={chartInterpretations.fraudByType} />
                </div>
              </div>

              <div className="flex flex-col gap-8 w-full">
                <FullWidthChart
                  filename="ex1_amount_distribution.png"
                  figure={getFigure(edaPage, "ex1_amount_distribution.png")}
                />
                <FullWidthChart
                  filename="ex1_suspicious_behavior.png"
                  figure={getFigure(edaPage, "ex1_suspicious_behavior.png")}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "PREPROCESSING" && (
            <motion.div
              key="prep"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {prepPage?.title}
                </h3>
                <p className="text-slate-500 text-sm">{prepPage?.subtitle}</p>
              </div>

              <InsightsList
                title="Étapes de préparation"
                insights={prepPage?.insights ?? []}
                variant="numbered"
              />

              {eda?.preprocessing?.pipeline_steps?.length ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                    Pipeline de prétraitement
                  </h3>
                  <ol className="flex flex-col gap-3">
                    {eda.preprocessing.pipeline_steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="pt-1 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {prepMetrics.length > 0 && <MetricsCards metrics={prepMetrics} />}

              {derivedFeatureComparison.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Features dérivées — fraude vs légitime
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={derivedFeatureComparison}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          interval={0}
                          angle={-12}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="fraude"
                          name="Fraude (moy.)"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="legitime"
                          name="Légitime (moy.)"
                          fill="#94a3b8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <InterpretationBlock text={chartInterpretations.preprocessing} />
                </div>
              )}

              {!eda?.preprocessing && (
                <p className="text-slate-400 text-sm">
                  Statistiques de prétraitement non disponibles — exécuter
                  scripts/export_analytics.py.
                </p>
              )}
            </motion.div>
          )}

          {activeTab === "IMBALANCE" && (
            <motion.div
              key="imbalance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-sm">
                <strong>Attention :</strong> Stratégies SMOTE, class_weight=&apos;balanced&apos;,
                seuil de décision ajusté — 0,11&nbsp;% de fraudes (1&nbsp;142 sur 1,0&nbsp;M de transactions).
              </div>

              <InsightsList
                title="Classe minoritaire & SMOTE"
                insights={imbalancePage?.insights ?? []}
                variant="red"
              />

              {smoteData?.metrics?.length ? (
                <MetricsCards
                  metrics={smoteData.metrics.map((m) => ({
                    label: m.label,
                    value: m.count.toLocaleString("fr-FR"),
                    color: m.label.includes("Fraude") ? "text-red-600" : "text-slate-600",
                  }))}
                />
              ) : (
                <p className="text-slate-400 text-sm">
                  Métriques SMOTE non disponibles — exécuter le pipeline.
                </p>
              )}

              <InterpretationBlock text={chartInterpretations.smote} />
            </motion.div>
          )}

          {activeTab === "MODELING" && (
            <motion.div
              key="modeling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {fraudMeta && (
                <MetricsCards
                  metrics={[
                    {
                      label: "Modèle retenu",
                      value: fraudMeta.model_name.toUpperCase(),
                      color: "text-red-600",
                    },
                    {
                      label: "ROC-AUC",
                      value: fraudMeta.roc_auc.toFixed(3),
                      color: "text-red-600",
                    },
                    {
                      label: "CV ROC-AUC",
                      value:
                        fraudMeta.cv_roc_auc_mean != null
                          ? fraudMeta.cv_roc_auc_mean.toFixed(3)
                          : "—",
                      color: "text-red-500",
                    },
                    {
                      label: "F1 (seuil 0.3)",
                      value: fraudMeta.f1.toFixed(3),
                      color: "text-red-400",
                    },
                  ]}
                />
              )}

              <div className="grid grid-cols-1 gap-6 max-w-2xl">
                {modelsData?.models?.length ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                        Comparaison CV ROC-AUC
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={modelsData.models}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                          />
                          <YAxis
                            domain={[80, 100]}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="roc"
                            name="ROC-AUC (%)"
                            fill="#b91c1c"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <InterpretationBlock text={chartInterpretations.cvRoc} />
                  </div>
                ) : null}

                {modelMetrics.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                        Métriques test — {fraudMeta?.model_name}
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={modelMetrics}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                          <RechartsTooltip />
                          <Bar
                            dataKey="value"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <InterpretationBlock text={chartInterpretations.testMetrics} />
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
                figure={getFigure(modelPage, "ex1_roc_curves.png")}
              />

              <FullWidthChart
                filename="ex1_nn_training.png"
                figure={getFigure(modelPage, "ex1_nn_training.png")}
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
                  <strong>Synthèse :</strong> La fraude ne compte que 0,11 % des
                  transactions (1 142 sur 1,0 M). Nous avons
                  appliqué SMOTE et un rééquilibrage par class_weight pour que
                  le modèle ne néglige pas la classe minoritaire.
                </p>
                <p>
                  Parmi les quatre algorithmes comparés, XGBoost obtient le
                  meilleur ROC-AUC en validation croisée (~0,996) et sur le jeu
                  de test (~0,997). Les variables les plus discriminantes sont
                  les soldes dérivés (orig_zeroed, error_balance) et le montant
                  de la transaction.
                </p>
                <p>
                  En contexte de détection de fraude, un faux négatif (fraude
                  non détectée) est plus coûteux qu&apos;un faux positif. Le
                  seuil de décision a donc été abaissé à 30 % afin
                  d&apos;atteindre un recall d&apos;environ 97 %, au prix
                  d&apos;une precision plus modérée.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PredictFraudModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
