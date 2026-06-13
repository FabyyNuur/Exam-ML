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
import type { FraudEdaAnalytics, FraudEdaRecord } from "@/lib/api";
import { buildFraudExplorerInterpretation } from "@/lib/chartInterpretations";

type NumericKey = keyof Pick<
  FraudEdaRecord,
  | "amount"
  | "step"
  | "oldbalance_org"
  | "newbalance_orig"
  | "oldbalance_dest"
  | "newbalance_dest"
  | "error_balance_orig"
  | "error_balance_dest"
>;

type ColorBy = "is_fraud" | "type";
type GroupBy = "type" | "is_fraud";

const PRESETS: { label: string; x: NumericKey; y: NumericKey }[] = [
  { label: "Montant × Solde émetteur", x: "amount", y: "oldbalance_org" },
  { label: "Montant × Erreur solde", x: "amount", y: "error_balance_orig" },
  { label: "Step × Montant", x: "step", y: "amount" },
  { label: "Solde dest. × Montant", x: "oldbalance_dest", y: "amount" },
];

const TYPE_COLORS: Record<string, string> = {
  PAYMENT: "#6366f1",
  TRANSFER: "#ef4444",
  CASH_OUT: "#f97316",
  DEBIT: "#64748b",
  CASH_IN: "#14b8a6",
};

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
        className="normal-case font-medium text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-200"
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
          className="flex-1 accent-red-600"
        />
        <span className="w-20 text-right tabular-nums text-xs">{fmt(valueMin)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChangeMax(Number(e.target.value))}
          className="flex-1 accent-red-600"
        />
        <span className="w-20 text-right tabular-nums text-xs">{fmt(valueMax)}</span>
      </div>
    </div>
  );
}

function fraudLabel(isFraud: number): string {
  return isFraud === 1 ? "Fraude" : "Légitime";
}

export function FraudInteractiveExplorer({
  data,
}: {
  data: FraudEdaAnalytics | null | undefined;
}) {
  const records = data?.records ?? [];
  const numericVars = data?.numeric_variables ?? [];

  const bounds = useMemo(() => {
    if (!records.length) {
      return { amount: [0, 100000] as [number, number] };
    }
    const amounts = records.map((r) => r.amount);
    return {
      amount: [Math.floor(Math.min(...amounts)), Math.ceil(Math.max(...amounts))] as [
        number,
        number,
      ],
    };
  }, [records]);

  const [xKey, setXKey] = useState<NumericKey>("amount");
  const [yKey, setYKey] = useState<NumericKey>("oldbalance_org");
  const [colorBy, setColorBy] = useState<ColorBy>("is_fraud");
  const [groupBy, setGroupBy] = useState<GroupBy>("type");
  const [compareMetric, setCompareMetric] = useState<NumericKey>("amount");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fraudFilter, setFraudFilter] = useState("all");
  const [zeroedFilter, setZeroedFilter] = useState("all");
  const [amountMin, setAmountMin] = useState(bounds.amount[0]);
  const [amountMax, setAmountMax] = useState(bounds.amount[1]);

  React.useEffect(() => {
    setAmountMin(bounds.amount[0]);
    setAmountMax(bounds.amount[1]);
  }, [bounds.amount[0], bounds.amount[1]]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (fraudFilter !== "all" && String(r.is_fraud) !== fraudFilter) return false;
      if (zeroedFilter !== "all" && String(r.orig_zeroed) !== zeroedFilter) return false;
      if (r.amount < amountMin || r.amount > amountMax) return false;
      return true;
    });
  }, [records, typeFilter, fraudFilter, zeroedFilter, amountMin, amountMax]);

  const scatterGroups = useMemo(() => {
    if (colorBy === "type") {
      const types = [...new Set(filtered.map((r) => r.type))].sort();
      return types.map((t) => ({
        name: t,
        fill: TYPE_COLORS[t] ?? "#64748b",
        data: filtered
          .filter((r) => r.type === t)
          .map((r) => ({ x: r[xKey], y: r[yKey], name: t })),
      }));
    }
    return [
      {
        name: "Légitime",
        fill: "#94a3b8",
        data: filtered
          .filter((r) => r.is_fraud === 0)
          .map((r) => ({ x: r[xKey], y: r[yKey], name: "Légitime" })),
      },
      {
        name: "Fraude",
        fill: "#ef4444",
        data: filtered
          .filter((r) => r.is_fraud === 1)
          .map((r) => ({ x: r[xKey], y: r[yKey], name: "Fraude" })),
      },
    ];
  }, [filtered, colorBy, xKey, yKey]);

  const comparisonData = useMemo(() => {
    const buckets = new Map<string, { sum: number; n: number }>();
    filtered.forEach((r) => {
      const key = groupBy === "type" ? r.type : fraudLabel(r.is_fraud);
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

  const interpretation = useMemo(
    () =>
      buildFraudExplorerInterpretation({
        filtered,
        totalCount: records.length,
        xKey,
        yKey,
        typeFilter,
        fraudFilter,
        zeroedFilter,
        comparisonData,
        metricLabel,
        groupBy,
      }),
    [
      filtered,
      records.length,
      xKey,
      yKey,
      typeFilter,
      fraudFilter,
      zeroedFilter,
      comparisonData,
      metricLabel,
      groupBy,
    ],
  );

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
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""} sur{" "}
            {records.length} après filtres — croisez montants, soldes et erreurs de
            balance pour repérer les schémas de fraude.
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
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <RangeField
          label="Montant (€)"
          min={bounds.amount[0]}
          max={bounds.amount[1]}
          valueMin={amountMin}
          valueMax={amountMax}
          onChangeMin={(v) => setAmountMin(Math.min(v, amountMax))}
          onChangeMax={(v) => setAmountMax(Math.max(v, amountMin))}
          format={(v) => v.toLocaleString("fr-FR")}
        />
        <SelectField
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "Tous types" },
            ...(data?.filters?.types ?? []).map((t) => ({ value: t, label: t })),
          ]}
        />
        <SelectField
          label="Classe"
          value={fraudFilter}
          onChange={setFraudFilter}
          options={
            data?.filters?.is_fraud ?? [
              { value: "all", label: "Toutes classes" },
              { value: "1", label: "Fraude uniquement" },
              { value: "0", label: "Légitime uniquement" },
            ]
          }
        />
        <SelectField
          label="Compte vidé"
          value={zeroedFilter}
          onChange={setZeroedFilter}
          options={
            data?.filters?.orig_zeroed ?? [
              { value: "all", label: "Tous comptes" },
              { value: "1", label: "Émetteur vidé" },
              { value: "0", label: "Non vidé" },
            ]
          }
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
            { value: "is_fraud", label: "Fraude / Légitime" },
            { value: "type", label: "Type transaction" },
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
              <ZAxis range={[30, 80]} />
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
                { value: "type", label: "Type transaction" },
                { value: "is_fraud", label: "Fraude / Légitime" },
              ]}
            />
            <SelectField
              label="Métrique"
              value={compareMetric}
              onChange={(v) => setCompareMetric(v as NumericKey)}
              options={numericVars.map((v) => ({ value: v.key, label: v.label }))}
            />
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comparisonData} margin={{ left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="group"
                tick={{ fill: "#64748b", fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                interval={0}
                height={50}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <RechartsTooltip
                formatter={(value: number, _name: string, props) => [
                  `${value.toLocaleString("fr-FR")} (n=${(props.payload as { count: number }).count})`,
                  metricLabel,
                ]}
              />
              <Bar dataKey="avg" name={metricLabel} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-lg text-sm text-red-900 leading-relaxed">
        <strong>Interprétation :</strong> {interpretation}
      </div>
    </div>
  );
}
