import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { ClusterEdaAnalytics, ClusterEdaRecord } from "@/lib/api";

type NumericKey = keyof Pick<
  ClusterEdaRecord,
  | "age"
  | "income"
  | "total_spend"
  | "recency"
  | "web_purchases"
  | "store_purchases"
  | "children"
  | "wines"
  | "meat"
  | "fish"
>;

type ColorBy = "cluster" | "response" | "education";
type GroupBy = "age_bin" | "income_bin" | "education" | "cluster";

const PRESETS: { label: string; x: NumericKey; y: NumericKey }[] = [
  { label: "Revenu × Dépenses", x: "income", y: "total_spend" },
  { label: "Âge × Dépenses", x: "age", y: "total_spend" },
  { label: "Âge × Revenu", x: "age", y: "income" },
  { label: "Web × Magasin", x: "web_purchases", y: "store_purchases" },
  { label: "Récence × Dépenses", x: "recency", y: "total_spend" },
];

const COLOR_MAP: Record<string, string> = {
  Premium: "#8b5cf6",
  Digital: "#0ea5e9",
  "Promo-sensible": "#d946ef",
  Dormant: "#64748b",
  Accepté: "#22c55e",
  Refusé: "#ef4444",
};

const EDU_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#64748b",
];

function incomeBin(income: number): string {
  if (income < 25_000) return "< 25k";
  if (income < 50_000) return "25–50k";
  if (income < 75_000) return "50–75k";
  if (income < 100_000) return "75–100k";
  return "100k+";
}

function ageBin(age: number): string {
  if (age < 35) return "< 35 ans";
  if (age < 50) return "35–49 ans";
  if (age < 65) return "50–64 ans";
  return "65+ ans";
}

function groupLabel(record: ClusterEdaRecord, groupBy: GroupBy): string {
  switch (groupBy) {
    case "age_bin":
      return ageBin(record.age);
    case "income_bin":
      return incomeBin(record.income);
    case "education":
      return record.education;
    default:
      return record.cluster;
  }
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 uppercase">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="normal-case font-medium text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({
  label,
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  format,
}: {
  label: string;
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  format?: (v: number) => string;
}) {
  const fmt = format ?? String;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-600 uppercase">{label}</span>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => onChangeMin(Number(e.target.value))}
          className="flex-1 accent-indigo-600"
        />
        <span className="w-16 text-right tabular-nums">{fmt(valueMin)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChangeMax(Number(e.target.value))}
          className="flex-1 accent-indigo-600"
        />
        <span className="w-16 text-right tabular-nums">{fmt(valueMax)}</span>
      </div>
    </div>
  );
}

export function ClusterInteractiveExplorer({
  data,
}: {
  data: ClusterEdaAnalytics | null | undefined;
}) {
  const records = data?.records ?? [];
  const numericVars = data?.numeric_variables ?? [];

  const bounds = useMemo(() => {
    if (!records.length) {
      return { age: [18, 80] as [number, number], income: [0, 150_000] as [number, number] };
    }
    const ages = records.map((r) => r.age);
    const incomes = records.map((r) => r.income);
    return {
      age: [Math.min(...ages), Math.max(...ages)] as [number, number],
      income: [Math.min(...incomes), Math.max(...incomes)] as [number, number],
    };
  }, [records]);

  const [ageMin, setAgeMin] = useState(bounds.age[0]);
  const [ageMax, setAgeMax] = useState(bounds.age[1]);
  const [incomeMin, setIncomeMin] = useState(bounds.income[0]);
  const [incomeMax, setIncomeMax] = useState(bounds.income[1]);
  const [education, setEducation] = useState("all");
  const [cluster, setCluster] = useState("all");
  const [response, setResponse] = useState("all");
  const [xKey, setXKey] = useState<NumericKey>("income");
  const [yKey, setYKey] = useState<NumericKey>("total_spend");
  const [colorBy, setColorBy] = useState<ColorBy>("cluster");
  const [groupBy, setGroupBy] = useState<GroupBy>("income_bin");
  const [compareMetric, setCompareMetric] = useState<NumericKey>("total_spend");

  React.useEffect(() => {
    setAgeMin(bounds.age[0]);
    setAgeMax(bounds.age[1]);
    setIncomeMin(bounds.income[0]);
    setIncomeMax(bounds.income[1]);
  }, [bounds]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (r.age < ageMin || r.age > ageMax) return false;
      if (r.income < incomeMin || r.income > incomeMax) return false;
      if (education !== "all" && r.education !== education) return false;
      if (cluster !== "all" && r.cluster !== cluster) return false;
      if (response !== "all" && String(r.response) !== response) return false;
      return true;
    });
  }, [records, ageMin, ageMax, incomeMin, incomeMax, education, cluster, response]);

  const scatterGroups = useMemo(() => {
    const groups = new Map<string, ClusterEdaRecord[]>();
    filtered.forEach((r) => {
      let key: string;
      if (colorBy === "cluster") key = r.cluster;
      else if (colorBy === "response") key = r.response === 1 ? "Accepté" : "Refusé";
      else key = r.education;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    return [...groups.entries()].map(([name, pts], gi) => ({
      name,
      data: pts.map((p) => ({
        x: Number(p[xKey] ?? 0),
        y: Number(p[yKey] ?? 0),
        ...p,
      })),
      fill: colorBy === "cluster"
        ? COLOR_MAP[name] ?? "#64748b"
        : colorBy === "response"
          ? COLOR_MAP[name] ?? "#64748b"
          : EDU_COLORS[gi % EDU_COLORS.length],
    }));
  }, [filtered, xKey, yKey, colorBy]);

  const comparisonData = useMemo(() => {
    const buckets = new Map<string, { sum: number; n: number }>();
    filtered.forEach((r) => {
      const key = groupLabel(r, groupBy);
      const val = Number(r[compareMetric] ?? 0);
      const cur = buckets.get(key) ?? { sum: 0, n: 0 };
      buckets.set(key, { sum: cur.sum + val, n: cur.n + 1 });
    });
    return [...buckets.entries()]
      .map(([group, { sum, n }]) => ({
        group,
        avg: n ? Math.round(sum / n) : 0,
        count: n,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [filtered, groupBy, compareMetric]);

  const xLabel = numericVars.find((v) => v.key === xKey)?.label ?? xKey;
  const yLabel = numericVars.find((v) => v.key === yKey)?.label ?? yKey;
  const metricLabel = numericVars.find((v) => v.key === compareMetric)?.label ?? compareMetric;

  if (!records.length) {
    return (
      <p className="text-slate-400 text-sm">
        Données interactives non disponibles — exécuter{" "}
        <code className="text-xs bg-slate-100 px-1 rounded">scripts/export_analytics.py</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase">
            Exploration interactive
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {filtered.length} client{filtered.length > 1 ? "s" : ""} sur {records.length}{" "}
            après filtres — croisez âge, revenu et dépenses pour tester vos hypothèses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setXKey(preset.x);
                setYKey(preset.y);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                xKey === preset.x && yKey === preset.y
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <RangeField
          label="Âge"
          min={bounds.age[0]}
          max={bounds.age[1]}
          valueMin={ageMin}
          valueMax={ageMax}
          onChangeMin={(v) => setAgeMin(Math.min(v, ageMax))}
          onChangeMax={(v) => setAgeMax(Math.max(v, ageMin))}
        />
        <RangeField
          label="Revenu"
          min={bounds.income[0]}
          max={bounds.income[1]}
          valueMin={incomeMin}
          valueMax={incomeMax}
          onChangeMin={(v) => setIncomeMin(Math.min(v, incomeMax))}
          onChangeMax={(v) => setIncomeMax(Math.max(v, incomeMin))}
          format={(v) => `${Math.round(v / 1000)}k`}
        />
        <SelectField
          label="Éducation"
          value={education}
          onChange={setEducation}
          options={[
            { value: "all", label: "Tous niveaux" },
            ...(data?.filters.education ?? []).map((e) => ({ value: e, label: e })),
          ]}
        />
        <SelectField
          label="Cluster"
          value={cluster}
          onChange={setCluster}
          options={[
            { value: "all", label: "Tous clusters" },
            ...(data?.filters.clusters ?? []).map((c) => ({ value: c, label: c })),
          ]}
        />
        <SelectField
          label="Réponse campagne"
          value={response}
          onChange={setResponse}
          options={data?.filters.response ?? [
            { value: "all", label: "Toutes réponses" },
            { value: "1", label: "Accepté" },
            { value: "0", label: "Refusé" },
          ]}
        />
        <SelectField
          label="Axe X"
          value={xKey}
          onChange={(v) => setXKey(v as NumericKey)}
          options={numericVars.map((v) => ({ value: v.key, label: v.label }))}
        />
        <SelectField
          label="Axe Y"
          value={yKey}
          onChange={(v) => setYKey(v as NumericKey)}
          options={numericVars.map((v) => ({ value: v.key, label: v.label }))}
        />
        <SelectField
          label="Colorier par"
          value={colorBy}
          onChange={(v) => setColorBy(v as ColorBy)}
          options={[
            { value: "cluster", label: "Cluster" },
            { value: "response", label: "Réponse campagne" },
            { value: "education", label: "Éducation" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">
            Nuage de points — {xLabel} vs {yLabel}
          </h4>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name={xLabel}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yLabel}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <ZAxis range={[40, 120]} />
              <RechartsTooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: number, name: string) => [
                  typeof value === "number" ? value.toLocaleString("fr-FR") : value,
                  name,
                ]}
              />
              <Legend />
              {scatterGroups.map((group) => (
                <Scatter key={group.name} name={group.name} data={group.data} fill={group.fill}>
                  {group.data.map((_, i) => (
                    <Cell key={i} fill={group.fill} />
                  ))}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase flex-1">
              Comparaison — {metricLabel} moyen
            </h4>
            <SelectField
              label="Grouper par"
              value={groupBy}
              onChange={(v) => setGroupBy(v as GroupBy)}
              options={[
                { value: "income_bin", label: "Tranche de revenu" },
                { value: "age_bin", label: "Tranche d'âge" },
                { value: "education", label: "Éducation" },
                { value: "cluster", label: "Cluster" },
              ]}
            />
            <SelectField
              label="Métrique"
              value={compareMetric}
              onChange={(v) => setCompareMetric(v as NumericKey)}
              options={numericVars
                .filter((v) =>
                  ["total_spend", "wines", "meat", "fish", "web_purchases", "store_purchases"].includes(
                    v.key,
                  ),
                )
                .map((v) => ({ value: v.key, label: v.label }))}
            />
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comparisonData} margin={{ left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="group"
                tick={{ fill: "#64748b", fontSize: 10 }}
                angle={-25}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <RechartsTooltip
                formatter={(value: number, _name: string, props) => [
                  `${value.toLocaleString("fr-FR")} (n=${(props.payload as { count: number }).count})`,
                  metricLabel,
                ]}
              />
              <Bar dataKey="avg" name={metricLabel} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-lg text-sm text-indigo-900 leading-relaxed">
        <strong>Interprétation :</strong>{" "}
        {filtered.length < records.length * 0.3
          ? "Les filtres actuels isolent un sous-ensemble restreint — vérifiez si le pattern observé (relation revenu/dépenses, canal dominant) se généralise sur toute la base."
          : `Sur cet échantillon, la relation entre ${xLabel.toLowerCase()} et ${yLabel.toLowerCase()} ${
              scatterGroups.length > 1
                ? "diffère selon le cluster ou le profil sélectionné"
                : "mérite d'être confrontée à une tranche d'âge ou de revenu plus ciblée"
            } : c'est précisément ce type de question que la segmentation doit permettre de trancher avant de lancer une campagne.`}
      </div>
    </div>
  );
}
