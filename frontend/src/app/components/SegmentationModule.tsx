import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  FileText,
  Search,
  Settings,
  Cpu,
  UploadCloud,
  Lightbulb,
} from "lucide-react";
import { ApiStatusBadge } from "./ApiStatusBadge";
import { ChartWithInterpretation } from "./ChartWithInterpretation";
import { InsightsList } from "./InsightsList";
import { MetricsCards } from "./MetricsCards";
import { PredictSegmentModal } from "./PredictSegmentModal";
import {
  useClusterEda,
  useClusterSummary,
  useMetadata,
  usePageContent,
} from "@/lib/hooks";
import type { PageFigure } from "@/lib/api";

type Tab = "CONTEXT" | "EDA" | "PREPROCESSING" | "MODELING" | "INTERPRETATION";

const PLOTLY_CHART_HEIGHTS: Record<string, number> = {
  "ex2_distributions.png": 480,
  "ex2_correlation.png": 560,
  "ex2_categorical.png": 520,
  "ex2_spending_channels.png": 480,
  "ex2_campaign_response.png": 440,
  "ex2_kmeans_selection.png": 520,
  "ex2_pca_scree.png": 440,
  "ex2_dendrogram.png": 560,
  "ex2_clustering_comparison.png": 560,
  "ex2_cluster_profiles.png": 520,
  "ex2_radar_profiles.png": 520,
};

function plotlyHeight(filename: string): number {
  return PLOTLY_CHART_HEIGHTS[filename] ?? 480;
}

function FullWidthChartList({ figures }: { figures: PageFigure[] }) {
  if (!figures.length) return null;
  return (
    <div className="flex flex-col gap-8 w-full">
      {figures.map((figure) => (
        <ChartWithInterpretation
          key={figure.filename}
          filename={figure.filename}
          figure={figure}
          height={plotlyHeight(figure.filename)}
          variant="indigo"
        />
      ))}
    </div>
  );
}

const CLUSTER_COLORS: Record<string, string> = {
  Premium: "#8b5cf6",
  Digital: "#0ea5e9",
  "Promo-sensible": "#d946ef",
  Dormant: "#64748b",
};

const PROFILE_ACTIONS: Record<string, string> = {
  Premium:
    "Programme fidélité haut de gamme, offres exclusives, cross-sell premium",
  Digital: "Campagnes e-mail / push, promotions canal web, parcours mobile",
  "Promo-sensible": "Coupons ciblés, offres limitées dans le temps",
  Dormant: "Campagne de réactivation, enquête satisfaction, offre de bienvenue",
};

export function SegmentationModule() {
  const [activeTab, setActiveTab] = useState<Tab>("CONTEXT");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getPage } = usePageContent();
  const { data: clusterEda } = useClusterEda();
  const { data: clusterData } = useClusterSummary();
  const { data: metadata } = useMetadata();

  const contextPage = getPage("ex2_eda");
  const edaPage = getPage("ex2_eda");
  const prepPage = getPage("ex2_preprocessing");
  const modelPage = getPage("ex2_modeling");
  const evalPage = getPage("ex2_evaluation");
  const interpretPage = getPage("ex2_interpretation");
  const clusterMeta = metadata?.cluster;

  const clusterNames = useMemo(() => {
    const labels =
      clusterMeta?.cluster_labels ?? clusterData?.metrics?.cluster_labels ?? {};
    return [...new Set(Object.values(labels))];
  }, [clusterMeta, clusterData]);

  const scatterByCluster = useMemo(() => {
    if (!clusterData?.points) return [];
    return clusterNames.map((name) => ({
      name,
      data: clusterData.points.filter((p) => p.cluster === name),
    }));
  }, [clusterData, clusterNames]);

  const profileRows = useMemo(() => {
    const labels = clusterMeta?.cluster_labels ?? {};
    return Object.entries(labels).map(([id, profile]) => ({
      id,
      profile,
      action:
        PROFILE_ACTIONS[profile] ?? "Campagne personnalisée selon le profil",
    }));
  }, [clusterMeta]);

  const campaignData = useMemo(
    () =>
      clusterEda?.campaign_response.map((r) => ({
        ...r,
        label:
          r.label === "1" ? "Accepté" : r.label === "0" ? "Refusé" : r.label,
      })) ?? [],
    [clusterEda],
  );

  const tabs = [
    { id: "CONTEXT", label: "CONTEXTE", icon: <FileText size={16} /> },
    { id: "EDA", label: "ANALYSE EXPLORATOIRE", icon: <Search size={16} /> },
    {
      id: "PREPROCESSING",
      label: "PRÉTRAITEMENT",
      icon: <Settings size={16} />,
    },
    { id: "MODELING", label: "MODÉLISATION", icon: <Cpu size={16} /> },
    {
      id: "INTERPRETATION",
      label: "INTERPRÉTABILITÉ",
      icon: <Lightbulb size={16} />,
    },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 relative z-10">
      <div className="flex flex-col gap-6 border-b border-slate-300/50 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-wide flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users size={28} />
              </div>
              SEGMENTATION CLIENT
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Apprentissage Non Supervisé / Clustering Comportemental
            </p>
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
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
                  OBJECTIFS MARKETING
                </h3>
                <div className="text-slate-600 leading-relaxed space-y-4">
                  <p>
                    Identifier des profils clients homogènes pour personnaliser
                    les campagnes marketing et optimiser le retour sur
                    investissement des actions commerciales.
                  </p>
                  {contextPage?.insights.slice(0, 2).map((insight, i) => (
                    <p key={i}>{insight}</p>
                  ))}
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
              className="flex flex-col gap-6"
            >
              <InsightsList
                title="Analyses exploratoires"
                insights={edaPage?.insights ?? []}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                    Distribution des revenus
                  </h3>
                  {clusterEda?.income_distribution?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={clusterEda.income_distribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="range"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="count"
                          name="Clients"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-sm">
                      Analytics non disponibles — exécuter le pipeline.
                    </p>
                  )}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                    Dépenses par canal
                  </h3>
                  {clusterEda?.spending_by_channel?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={clusterEda.spending_by_channel}
                        layout="vertical"
                        margin={{ left: 20 }}
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
                          dataKey="channel"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          width={90}
                        />
                        <RechartsTooltip />
                        <Bar
                          dataKey="avg"
                          name="Dépense moy."
                          fill="#818cf8"
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
              </div>

              {campaignData.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-md">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                    Réponse aux campagnes
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={campaignData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar
                        dataKey="count"
                        name="Clients"
                        fill="#a78bfa"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <FullWidthChartList figures={edaPage?.figures ?? []} />
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
                <p className="text-slate-500 text-sm mb-4">
                  {prepPage?.subtitle}
                </p>
              </div>
              <InsightsList
                title="Étapes de préparation"
                insights={prepPage?.insights ?? []}
                variant="numbered"
              />
            </motion.div>
          )}

          {activeTab === "MODELING" && (
            <motion.div
              key="modeling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {clusterMeta && (
                <MetricsCards
                  metrics={[
                    {
                      label: "Silhouette",
                      value: clusterMeta.silhouette.toFixed(3),
                      color: "text-indigo-600",
                    },
                    {
                      label: "Davies-Bouldin",
                      value: clusterMeta.davies_bouldin.toFixed(3),
                      color: "text-indigo-500",
                    },
                    {
                      label: "K optimal",
                      value: String(clusterMeta.best_k),
                      color: "text-indigo-400",
                    },
                    {
                      label: "Algorithme",
                      value: clusterMeta.model_name.toUpperCase(),
                      color: "text-indigo-600",
                    },
                  ]}
                />
              )}

              <InsightsList
                title="Modélisation & sélection de k"
                insights={modelPage?.insights ?? []}
              />

              {scatterByCluster.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                    Projection PCA 2D — {clusterNames.join(" / ")}
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart
                      margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="PC1"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="PC2"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <ZAxis range={[40, 160]} />
                      <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} />
                      {scatterByCluster.map((group) => (
                        <Scatter
                          key={group.name}
                          name={group.name}
                          data={group.data}
                          fill={CLUSTER_COLORS[group.name] ?? "#64748b"}
                        >
                          {group.data.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CLUSTER_COLORS[group.name] ?? "#64748b"}
                            />
                          ))}
                        </Scatter>
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              <FullWidthChartList figures={modelPage?.figures ?? []} />
            </motion.div>
          )}

          {activeTab === "INTERPRETATION" && (
            <motion.div
              key="interpretation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {profileRows.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase">
                      Profils clients → actions marketing
                    </h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold">
                          Cluster
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Profil
                        </th>
                        <th className="text-left px-5 py-3 font-semibold">
                          Actions recommandées
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100">
                          <td className="px-5 py-3 text-slate-500">{row.id}</td>
                          <td className="px-5 py-3 font-semibold text-indigo-700">
                            {row.profile}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {row.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <InsightsList
                title="Évaluation des clusters"
                insights={evalPage?.insights ?? []}
                variant="indigo"
              />

              <FullWidthChartList figures={interpretPage?.figures ?? []} />

              <InsightsList
                title="Recommandations business"
                insights={interpretPage?.insights ?? []}
              />

              {interpretPage?.insights.length ? (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-sm">
                  <strong>Synthèse :</strong>{" "}
                  {interpretPage.insights[interpretPage.insights.length - 1]}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PredictSegmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
