import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { ClusterInteractiveExplorer } from "./ClusterInteractiveExplorer";
import { PredictSegmentModal } from "./PredictSegmentModal";
import {
  useClusterEda,
  useClusterSummary,
  useMetadata,
  usePageContent,
} from "@/lib/hooks";
import {
  interpretClusterCampaign,
  interpretClusterCampaignByProfile,
  interpretClusterBusinessRecommendations,
  interpretClusterBusinessSynthesis,
  interpretClusterIncome,
  interpretClusterPca,
  interpretClusterProfile,
  interpretClusterProfilesSummary,
  interpretClusterSpending,
  computeClusterProfileStats,
} from "@/lib/chartInterpretations";
import type { PageFigure } from "@/lib/api";

type Tab = "CONTEXT" | "EDA" | "PREPROCESSING" | "MODELING" | "INTERPRETATION";

const PLOTLY_CHART_HEIGHTS: Record<string, number> = {
  "ex2_distributions.png": 480,
  "ex2_interactive_explorer.png": 560,
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

function InterpretationBlock({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-lg text-sm text-indigo-900 leading-relaxed ${className}`}
    >
      <strong>Interprétation :</strong> {text}
    </div>
  );
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

const PROFILE_CARD_COLORS: Record<string, string> = {
  Premium: "border-violet-200 bg-violet-50/50",
  Digital: "border-sky-200 bg-sky-50/50",
};

function ProfileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function SegmentationModule() {
  const [activeTab, setActiveTab] = useState<Tab>("CONTEXT");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getPage } = usePageContent();
  const { data: clusterEda } = useClusterEda();
  const { data: clusterData } = useClusterSummary();
  const { data: metadata } = useMetadata();

  const contextPage = getPage("ex2_context");
  const edaPage = getPage("ex2_eda");
  const prepPage = getPage("ex2_preprocessing");
  const modelPage = getPage("ex2_modeling");
  const interpretPage = getPage("ex2_interpretation");
  const clusterMeta = metadata?.cluster;

  const profileStats = useMemo(
    () =>
      computeClusterProfileStats(
        clusterEda?.records,
        clusterEda?.total_customers,
      ),
    [clusterEda],
  );

  const campaignByProfile = useMemo(
    () =>
      profileStats.map((p) => ({
        profile: p.name,
        acceptPct: Math.round(p.campaignAcceptPct * 10) / 10,
      })),
    [profileStats],
  );

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

  const campaignData = useMemo(
    () =>
      clusterEda?.campaign_response.map((r) => ({
        ...r,
        label:
          r.label === "1" ? "Accepté" : r.label === "0" ? "Refusé" : r.label,
      })) ?? [],
    [clusterEda],
  );

  const chartInterpretations = useMemo(
    () => ({
      income: interpretClusterIncome(clusterEda),
      spending: interpretClusterSpending(clusterEda),
      campaign: interpretClusterCampaign(clusterEda),
      pca: interpretClusterPca(
        clusterData,
        clusterMeta,
        scatterByCluster.map((g) => ({ name: g.name, count: g.data.length })),
      ),
      summary: interpretClusterProfilesSummary(profileStats, clusterMeta),
      campaignByProfile: interpretClusterCampaignByProfile(profileStats),
      recommendations: interpretClusterBusinessRecommendations(
        profileStats,
        clusterMeta,
      ),
      synthesis: interpretClusterBusinessSynthesis(profileStats, clusterMeta),
    }),
    [clusterEda, clusterData, clusterMeta, scatterByCluster, profileStats],
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
            <Link
              to="/rapport/segmentation"
              className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-700 px-4 py-2 font-medium text-sm rounded-lg hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
            >
              <FileText size={16} /> RAPPORT PDF
            </Link>
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
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 uppercase">
                  {contextPage?.title ?? "Contexte"}
                </h3>
                <div className="text-slate-600 leading-relaxed space-y-4">
                  {contextPage?.insights.map((insight, i) => (
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

              <ClusterInteractiveExplorer data={clusterEda} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="flex flex-col gap-3 min-w-0">
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
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} width={36} />
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
                  <InterpretationBlock
                    text={chartInterpretations.income}
                  />
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Dépenses par canal
                    </h3>
                    {clusterEda?.spending_by_channel?.length ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={clusterEda.spending_by_channel}
                          layout="vertical"
                          margin={{ left: 4, right: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fill: "#64748b", fontSize: 10 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="channel"
                            tick={{ fill: "#64748b", fontSize: 9 }}
                            width={72}
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
                  <InterpretationBlock
                    text={chartInterpretations.spending}
                  />
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Réponse aux campagnes
                    </h3>
                    {campaignData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={campaignData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                          />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} width={40} />
                          <RechartsTooltip />
                          <Bar
                            dataKey="count"
                            name="Clients"
                            fill="#a78bfa"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        Données non disponibles.
                      </p>
                    )}
                  </div>
                  <InterpretationBlock
                    text={chartInterpretations.campaign}
                  />
                </div>
              </div>

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
                <div className="flex flex-col gap-3">
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
                  <InterpretationBlock
                    text={chartInterpretations.pca}
                  />
                </div>
              )}

              <FullWidthChartList figures={modelPage?.figures ?? []} />

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Synthèse :</strong> L&apos;exploration révèle des
                  revenus asymétriques, des corrélations fortes entre catégories
                  de dépenses et une réponse hétérogène aux campagnes — autant de
                  signaux qui justifient une segmentation comportementale plutôt
                  qu&apos;un ciblage démographique seul.
                </p>
                <p>
                  Quatre algorithmes ont été comparés (K-Means, DBSCAN,
                  Agglomerative, GMM) : K-Means avec k=2 est retenu pour sa
                  lisibilité métier et la stabilité de ses centroïdes. La
                  Silhouette (~0,32) indique une séparation acceptable pour un
                  usage marketing, même si elle reste inférieure à celle d&apos;un
                  problème de classification supervisée.
                </p>
                <p>
                  Les deux segments identifiés — Premium (revenus et dépenses
                  élevés, ~1 233 € de panier) et Digital (segment masse,
                  ~178 € de panier) — appellent des actions distinctes :
                  fidélité haut de gamme d&apos;un côté, offres accessibles
                  ciblées de l&apos;autre. La question à
                  suivre en production est de savoir si ces profils restent
                  stables dans le temps ou s&apos;ils nécessitent un
                  recalcul mensuel des segments.
                </p>
              </div>
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
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {interpretPage?.title ?? "Interprétabilité"}
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  {interpretPage?.subtitle}
                </p>
                <InterpretationBlock text={chartInterpretations.summary} />
              </div>

              {profileStats.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {profileStats.map((profile) => (
                    <div
                      key={profile.name}
                      className={`border rounded-xl p-5 shadow-sm ${PROFILE_CARD_COLORS[profile.name] ?? "border-slate-200 bg-white"}`}
                    >
                      <h4
                        className={`text-base font-bold mb-4 ${
                          profile.name === "Premium"
                            ? "text-violet-700"
                            : profile.name === "Digital"
                              ? "text-sky-700"
                              : "text-indigo-700"
                        }`}
                      >
                        Profil {profile.name}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        <ProfileMetric
                          label="Effectif"
                          value={`${profile.count.toLocaleString("fr-FR")} (${profile.pct} %)`}
                        />
                        <ProfileMetric
                          label="Revenu moy."
                          value={`${Math.round(profile.income).toLocaleString("fr-FR")} €`}
                        />
                        <ProfileMetric
                          label="Panier moy."
                          value={`${Math.round(profile.totalSpend).toLocaleString("fr-FR")} €`}
                        />
                        <ProfileMetric
                          label="Achats web / mag."
                          value={`${profile.webPurchases.toFixed(1)} / ${profile.storePurchases.toFixed(1)}`}
                        />
                        <ProfileMetric
                          label="Enfants"
                          value={profile.children.toFixed(1)}
                        />
                        <ProfileMetric
                          label="Campagnes"
                          value={`${profile.campaignAcceptPct.toFixed(0)} % accept.`}
                        />
                      </div>
                      <InterpretationBlock
                        text={interpretClusterProfile(profile, profileStats)}
                        className="bg-white/70"
                      />
                    </div>
                  ))}
                </div>
              )}

              {campaignByProfile.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">
                      Réponse aux campagnes par profil
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={campaignByProfile}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="profile"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          width={40}
                          unit="%"
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [`${value} %`, "Acceptation"]}
                        />
                        <Bar
                          dataKey="acceptPct"
                          name="Acceptation"
                          fill="#818cf8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <InterpretationBlock
                    text={chartInterpretations.campaignByProfile}
                  />
                </div>
              )}

              <FullWidthChartList figures={interpretPage?.figures ?? []} />

              <InsightsList
                title="Recommandations business"
                insights={chartInterpretations.recommendations}
              />

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Synthèse :</strong> {chartInterpretations.synthesis[0]}
                </p>
                {chartInterpretations.synthesis.slice(1).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
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
