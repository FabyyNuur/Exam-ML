import type {
  ClusterEdaAnalytics,
  ClusterEdaRecord,
  ClusterMetadata,
  ClusterSummary,
  FraudEdaAnalytics,
  FraudMetadata,
  FraudModelMetric,
} from "./api";

export interface ClusterProfileStats {
  name: string;
  count: number;
  pct: number;
  income: number;
  totalSpend: number;
  age: number;
  children: number;
  webPurchases: number;
  storePurchases: number;
  wines: number;
  meat: number;
  recency: number;
  campaignAcceptPct: number;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeClusterProfileStats(
  records: ClusterEdaRecord[] | undefined,
  totalCustomers?: number,
): ClusterProfileStats[] {
  if (!records?.length) return [];

  const groups = new Map<string, ClusterEdaRecord[]>();
  for (const record of records) {
    const bucket = groups.get(record.cluster) ?? [];
    bucket.push(record);
    groups.set(record.cluster, bucket);
  }

  const total = totalCustomers ?? records.length;

  return [...groups.entries()]
    .map(([name, rows]) => ({
      name,
      count: rows.length,
      pct: total > 0 ? Math.round((100 * rows.length) / total * 10) / 10 : 0,
      income: mean(rows.map((r) => r.income)),
      totalSpend: mean(rows.map((r) => r.total_spend)),
      age: mean(rows.map((r) => r.age)),
      children: mean(rows.map((r) => r.children)),
      webPurchases: mean(rows.map((r) => r.web_purchases)),
      storePurchases: mean(rows.map((r) => r.store_purchases)),
      wines: mean(rows.map((r) => r.wines ?? 0)),
      meat: mean(rows.map((r) => r.meat ?? 0)),
      recency: mean(rows.map((r) => r.recency)),
      campaignAcceptPct: mean(rows.map((r) => r.response)) * 100,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

function findProfile(
  stats: ClusterProfileStats[],
  name: string,
): ClusterProfileStats | undefined {
  return stats.find((s) => s.name === name);
}

function spendRatio(
  premium: ClusterProfileStats,
  digital: ClusterProfileStats,
): string {
  if (digital.totalSpend <= 0) return "—";
  return (premium.totalSpend / digital.totalSpend).toFixed(0);
}

export function interpretClusterProfile(
  profile: ClusterProfileStats,
  allStats: ClusterProfileStats[],
): string {
  const premium = findProfile(allStats, "Premium");
  const digital = findProfile(allStats, "Digital");
  const ratio =
    premium && digital ? spendRatio(premium, digital) : null;

  if (profile.name === "Premium") {
    return (
      `${fmt(profile.count)} clients (${profile.pct} %) : revenu moyen ${Math.round(profile.income).toLocaleString("fr-FR")} €, ` +
      `panier ${Math.round(profile.totalSpend).toLocaleString("fr-FR")} € (vins ${Math.round(profile.wines)} €, viandes ${Math.round(profile.meat)} €). ` +
      `Achats plus fréquents (${profile.webPurchases.toFixed(1)} web, ${profile.storePurchases.toFixed(1)} magasin), ` +
      `peu d'enfants (${profile.children.toFixed(1)}). ` +
      `Taux d'acceptation campagne ${profile.campaignAcceptPct.toFixed(0)} %. ` +
      `→ Fidélité haut de gamme et cross-sell sur vins/viandes ; éviter les promotions agressives.`
    );
  }

  if (profile.name === "Digital") {
    const webNote =
      premium && profile.webPurchases < premium.webPurchases
        ? ` Malgré le libellé « Digital », ce segment achète moins sur le web (${profile.webPurchases.toFixed(1)} vs ${premium.webPurchases.toFixed(1)} pour Premium) — `
        : " ";
    return (
      `${fmt(profile.count)} clients (${profile.pct} %) : revenu ${Math.round(profile.income).toLocaleString("fr-FR")} €, ` +
      `panier ${Math.round(profile.totalSpend).toLocaleString("fr-FR")} €${ratio ? ` (≈ ${ratio}× moins que Premium)` : ""}.${webNote}` +
      `C'est surtout le segment masse à faible dépense, avec plus d'enfants (${profile.children.toFixed(1)}). ` +
      `Taux d'acceptation campagne ${profile.campaignAcceptPct.toFixed(0)} %. ` +
      `→ Offres accessibles et ciblées ; ne pas sur-solliciter avec des promos massives.`
    );
  }

  return (
    `${fmt(profile.count)} clients (${profile.pct} %) : revenu ${Math.round(profile.income).toLocaleString("fr-FR")} €, ` +
    `panier ${Math.round(profile.totalSpend).toLocaleString("fr-FR")} €.`
  );
}

export function interpretClusterProfilesSummary(
  stats: ClusterProfileStats[],
  meta: ClusterMetadata | null | undefined,
): string {
  if (stats.length < 2) {
    return "Profils clients indisponibles — exécuter le pipeline analytics.";
  }
  const premium = findProfile(stats, "Premium") ?? stats[0];
  const digital = findProfile(stats, "Digital") ?? stats[1];
  const sil = meta?.silhouette?.toFixed(2) ?? "—";
  const ratio = spendRatio(premium, digital);
  return (
    `K-Means avec k=${meta?.best_k ?? 2} sépare deux profils (Silhouette ${sil}) : ` +
    `Premium (${fmt(premium.count)}, panier ${Math.round(premium.totalSpend).toLocaleString("fr-FR")} €) ` +
    `vs Digital (${fmt(digital.count)}, panier ${Math.round(digital.totalSpend).toLocaleString("fr-FR")} €, ≈ ${ratio}× moins). ` +
    `La séparation repose sur le revenu et la dépense totale, pas sur l'âge ni la récence (≈ ${Math.round(premium.recency)} j pour les deux).`
  );
}

export function interpretClusterHeatmapProfiles(
  stats: ClusterProfileStats[],
): string {
  const premium = findProfile(stats, "Premium");
  const digital = findProfile(stats, "Digital");
  if (!premium || !digital) return "Profils par cluster indisponibles.";
  return (
    `Premium domine sur Income et TotalSpend (${Math.round(premium.income).toLocaleString("fr-FR")} € vs ${Math.round(digital.income).toLocaleString("fr-FR")} € ; ` +
    `panier ${Math.round(premium.totalSpend).toLocaleString("fr-FR")} € vs ${Math.round(digital.totalSpend).toLocaleString("fr-FR")} €). ` +
    `Digital se distingue surtout par un panier faible et plus d'enfants (${digital.children.toFixed(1)} vs ${premium.children.toFixed(1)}), ` +
    `pas par davantage d'achats web.`
  );
}

export function interpretClusterRadarProfiles(
  stats: ClusterProfileStats[],
): string {
  const premium = findProfile(stats, "Premium");
  const digital = findProfile(stats, "Digital");
  if (!premium || !digital) return "Radar des profils indisponible.";
  return (
    `Le radar confirme un écart global : Premium surperforme sur revenu, dépenses et fréquence d'achat ; ` +
    `Digital est plus proche de 0 sur ces axes mais plus élevé sur le nombre d'enfants. ` +
    `Les deux profils restent distincts sur plusieurs dimensions — le découpage justifie des parcours marketing séparés.`
  );
}

export function interpretClusterCampaignByProfile(
  stats: ClusterProfileStats[],
): string {
  if (!stats.length) return "Réponse campagne par profil indisponible.";
  const sorted = [...stats].sort(
    (a, b) => b.campaignAcceptPct - a.campaignAcceptPct,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (sorted.length === 1) {
    return `${best.name} : ${best.campaignAcceptPct.toFixed(0)} % d'acceptation moyenne des campagnes.`;
  }
  return (
    `${best.name} accepte davantage les campagnes (${best.campaignAcceptPct.toFixed(0)} %) ` +
    `que ${worst.name} (${worst.campaignAcceptPct.toFixed(0)} %). ` +
    `Prioriser le budget promo sur le segment le plus réceptif plutôt qu'un envoi uniforme à toute la base.`
  );
}

export function interpretClusterBusinessRecommendations(
  stats: ClusterProfileStats[],
  meta: ClusterMetadata | null | undefined,
): string[] {
  const premium = findProfile(stats, "Premium");
  const digital = findProfile(stats, "Digital");
  if (!premium || !digital) {
    return [
      "Personnaliser les campagnes par profil cluster plutôt qu'un envoi massif.",
      "Recalculer les segments régulièrement et suivre la Silhouette en production.",
    ];
  }
  const sorted = [...stats].sort(
    (a, b) => b.campaignAcceptPct - a.campaignAcceptPct,
  );
  const mostReceptive = sorted[0];
  return [
    `Premium (${fmt(premium.count)} clients, panier ${Math.round(premium.totalSpend).toLocaleString("fr-FR")} €) : programme fidélité haut de gamme, cross-sell vins/viandes (≈ ${Math.round(premium.wines)} € / ${Math.round(premium.meat)} €), pas de promotions agressives.`,
    `Digital (${fmt(digital.count)} clients, panier ${Math.round(digital.totalSpend).toLocaleString("fr-FR")} €) : offres accessibles ciblées, sans envoi massif de coupons aux ${fmt(digital.count)} clients à faible panier.`,
    `${mostReceptive.name} répond le mieux aux campagnes (${mostReceptive.campaignAcceptPct.toFixed(0)} % d'acceptation) — prioriser le budget promo sur ce segment.`,
    `Exploitation : recalcul mensuel des segments et suivi de la Silhouette (≈ ${meta?.silhouette?.toFixed(2) ?? "—"}) pour détecter une dérive avant qu'elle n'invalide le ciblage.`,
  ];
}

export function interpretClusterBusinessSynthesis(
  stats: ClusterProfileStats[],
  meta: ClusterMetadata | null | undefined,
): string[] {
  const premium = findProfile(stats, "Premium");
  const digital = findProfile(stats, "Digital");
  if (!premium || !digital) {
    return [
      "Segmenter le portefeuille en profils homogènes permet de concentrer le budget marketing sur les clients les plus réceptifs.",
    ];
  }
  const ratio = spendRatio(premium, digital);
  return [
    `Le clustering (k=${meta?.best_k ?? 2}, Silhouette ≈ ${meta?.silhouette?.toFixed(2) ?? "—"}) distingue deux profils actionnables : Premium (${premium.pct} %, panier ${Math.round(premium.totalSpend).toLocaleString("fr-FR")} €) et Digital (${digital.pct} %, panier ${Math.round(digital.totalSpend).toLocaleString("fr-FR")} €, ≈ ${ratio}× moins).`,
    `Premium concentre la valeur (revenu ${Math.round(premium.income).toLocaleString("fr-FR")} €, vins ${Math.round(premium.wines).toLocaleString("fr-FR")} €) ; Digital est le segment masse (plus d'enfants : ${digital.children.toFixed(1)} vs ${premium.children.toFixed(1)}), sans sur-représentation web.`,
    `Même budget marketing, meilleur ROI : fidélité et cross-sell premium d'un côté, offres ciblées et mesurées de l'autre — plutôt qu'une campagne unique à toute la base (${fmt((premium.count + digital.count))} clients).`,
  ];
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function interpretFraudClassBalance(
  eda: FraudEdaAnalytics | null | undefined,
): string {
  const rows = eda?.class_balance ?? [];
  const fraud = rows.find((r) => r.label === "Fraude");
  const legit = rows.find((r) => r.label === "Légitime");
  if (!fraud || !legit) return "Répartition des classes indisponible.";
  return (
    `Sur ${fmt(eda?.total_transactions ?? legit.count + fraud.count)} transactions, ` +
    `seules ${fmt(fraud.count)} sont frauduleuses (${fraud.pct} %). ` +
    `Un modèle naïf atteindrait ${legit.pct} % d'accuracy en ignorant la fraude — ` +
    `d'où l'usage du ROC-AUC et du recall plutôt que l'accuracy brute.`
  );
}

export function interpretFraudByType(
  eda: FraudEdaAnalytics | null | undefined,
): string {
  const rows = eda?.fraud_by_type ?? [];
  if (!rows.length) return "Répartition par type indisponible.";
  const total = rows.reduce((sum, row) => sum + row.fraud, 0);
  const sorted = [...rows].sort((a, b) => b.fraud - a.fraud);
  const [top, second] = sorted;
  const share =
    total > 0 ? Math.round(((top.fraud + (second?.fraud ?? 0)) / total) * 100) : 0;
  return (
    `${top.type} (${fmt(top.fraud)} cas) et ${second?.type ?? "—"} ` +
    `(${fmt(second?.fraud ?? 0)}) concentrent ${share} % des ${fmt(total)} fraudes recensées. ` +
    `Les flux PAYMENT et CASH_IN sont quasi absents du signal frauduleux — ` +
    `le modèle doit surtout discriminer TRANSFER et CASH_OUT.`
  );
}

export function interpretFraudCvRoc(
  models: FraudModelMetric[] | undefined,
): string {
  if (!models?.length) return "Comparaison CV indisponible — lancer le pipeline avec --with-cv.";
  const sorted = [...models].sort((a, b) => b.roc - a.roc);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return (
    `${best.name} obtient ${best.roc.toFixed(1)} % de ROC-AUC en validation croisée, ` +
    `soit +${(best.roc - worst.roc).toFixed(1)} pts vs ${worst.name} (${worst.roc.toFixed(1)} %). ` +
    `XGBoost est retenu pour cette marge, complétée par SMOTE et un seuil abaissé à 30 %.`
  );
}

export function interpretFraudTestMetrics(
  meta: FraudMetadata | null | undefined,
): string {
  if (!meta) return "Métriques test indisponibles — modèle non entraîné ou metadata absent.";
  const roc = (meta.roc_auc * 100).toFixed(1);
  const recall = (meta.recall * 100).toFixed(1);
  const prec = (meta.precision * 100).toFixed(1);
  const f1 = (meta.f1 * 100).toFixed(1);
  const cv =
    meta.cv_roc_auc_mean != null
      ? ` (CV ROC-AUC ${(meta.cv_roc_auc_mean * 100).toFixed(1)} %).`
      : ".";
  return (
    `${meta.model_name.toUpperCase()} au seuil 30 % : ROC-AUC ${roc} %, recall ${recall} %, ` +
    `precision ${prec} %, F1 ${f1} %${cv} ` +
    `Le recall prioritaire réduit les fraudes non détectées ; la precision modérée reflète le déséquilibre extrême (≈ 0,1 % de fraudes).`
  );
}

export function interpretClusterIncome(
  eda: ClusterEdaAnalytics | null | undefined,
): string {
  const rows = eda?.income_distribution ?? [];
  if (!rows.length) return "Distribution des revenus indisponible.";
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  const core = rows
    .filter((r) => /25|50|75/.test(r.range) && !r.range.includes("150"))
    .reduce((sum, r) => sum + r.pct, 0);
  const high = rows
    .filter((r) => r.range.includes("100") || r.range.includes("150"))
    .reduce((sum, r) => sum + r.pct, 0);
  return (
    `${fmt(eda?.total_customers ?? 0)} clients : ${core.toFixed(1)} % gagnent entre 25 et 100 k€ ` +
    `(pics ${sorted[0].range} ${sorted[0].pct} %, ${sorted[1].range} ${sorted[1].pct} %). ` +
    `Seulement ${high.toFixed(1)} % dépassent 100 k€ — la tranche Premium du clustering ne couvrira pas les outliers > 600 k€, ` +
    `déjà exclus au nettoyage.`
  );
}

export function interpretClusterSpending(
  eda: ClusterEdaAnalytics | null | undefined,
): string {
  const rows = eda?.spending_by_channel ?? [];
  if (!rows.length) return "Dépenses par canal indisponibles.";
  const sorted = [...rows].sort((a, b) => b.avg - a.avg);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const ratio = low.avg > 0 ? (top.avg / low.avg).toFixed(0) : "—";
  return (
    `${top.channel} domine avec ${top.avg.toFixed(0)} € de dépense moyenne, ` +
    `contre ${low.avg.toFixed(0)} € pour ${low.channel} (≈ ${ratio}×). ` +
    `Viandes et vins structurent l'essentiel du panier ; les postes faibles (fruits, sucreries) ` +
    `ne suffiront pas seuls à séparer Premium et Digital.`
  );
}

export function interpretClusterCampaign(
  eda: ClusterEdaAnalytics | null | undefined,
): string {
  const rows = eda?.campaign_response ?? [];
  if (!rows.length) return "Réponse aux campagnes indisponible.";
  const accept = rows.find((r) => r.label === "1" || r.label === "1.0");
  const refuse = rows.find((r) => r.label === "0" || r.label === "0.0");
  if (!accept || !refuse) return "Libellés de réponse campagne non reconnus.";
  return (
    `${refuse.pct} % des clients (${fmt(refuse.count)}) refusent les promotions, ` +
    `contre ${accept.pct} % d'acceptation (${fmt(accept.count)}). ` +
    `Avant tout envoi massif, cibler les ~${fmt(accept.count)} réceptifs plutôt que les ` +
    `${fmt(refuse.count)} réfractaires évite de diluer le ROI marketing.`
  );
}

export function interpretClusterPca(
  clusterData: ClusterSummary | null | undefined,
  clusterMeta: ClusterMetadata | null | undefined,
  clusterCounts: { name: string; count: number }[],
): string {
  if (!clusterData?.points?.length) return "Projection PCA indisponible.";
  const ev = clusterData.explained_variance;
  const evText =
    ev && ev.length >= 2
      ? `PC1–PC2 expliquent ${(ev[0] + ev[1]).toFixed(1)} % de la variance. `
      : "";
  const sil = clusterMeta?.silhouette?.toFixed(2) ?? "—";
  const sizes = clusterCounts.map((c) => `${c.name} n=${fmt(c.count)}`).join(", ");
  return (
    `${evText}Les nuages ${sizes} se séparent nettement en 2D malgré une Silhouette modérée (${sil}). ` +
    `k=${clusterMeta?.best_k ?? 2} reste lisible pour le marketing : Premium (revenus/dépenses élevés) ` +
    `vs Digital (segment masse à panier plus léger).`
  );
}
