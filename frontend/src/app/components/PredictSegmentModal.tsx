import React, { useState } from 'react';
import { Users, Loader2, Lightbulb, Target } from 'lucide-react';
import { CustomerRequest, SegmentBatchResponse } from '@/lib/api';
import { usePredictSegment, usePredictSegmentBatch } from '@/lib/hooks';
import { PredictModalShell, PredictTab } from './PredictModalShell';
import { CsvUploadPanel } from './CsvUploadPanel';
import { BatchResultsPanel } from './BatchResultsPanel';

interface PredictSegmentModalProps {
  open: boolean;
  onClose: () => void;
}

const PROFILE_ACTIONS: Record<string, string> = {
  Premium:
    'Programme fidélité haut de gamme, cross-sell vins/viandes, éviter les promotions agressives.',
  Digital:
    'Offres accessibles ciblées, sollicitations mesurées — segment masse à faible panier.',
  'Promo-sensible': 'Coupons ciblés, offres limitées dans le temps.',
  Dormant: 'Campagne de réactivation, enquête satisfaction.',
};

function TestIntro() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-slate-700 leading-relaxed">
      <p className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
        <Target size={16} /> Ce que fait ce test
      </p>
      <p className="mb-2">
        Le modèle <strong>K-Means (k=4)</strong> reçoit 7 indicateurs client (revenu, âge,
        dépenses, achats web/magasin, récence, enfants), les standardise comme à
        l&apos;entraînement, puis assigne le cluster le plus proche → profil{' '}
        <strong>Premium</strong>, <strong>Digital</strong>, <strong>Promo-sensible</strong> ou{' '}
        <strong>Dormant</strong>.
      </p>
      <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
        <li>
          <strong>Saisie manuelle</strong> : tester un client fictif et voir le profil + action
          marketing recommandée.
        </li>
        <li>
          <strong>Upload CSV</strong> : segmenter un fichier entier, obtenir la répartition
          Premium/Digital/Promo-sensible/Dormant et exporter les résultats.
        </li>
      </ul>
    </div>
  );
}

function ManualSegmentForm() {
  const { predict, loading, error, result } = usePredictSegment();
  const [form, setForm] = useState<CustomerRequest>({
    income: 60000,
    age: 40,
    total_spend: 800,
    num_web_purchases: 6,
    num_store_purchases: 4,
    recency: 20,
    children: 2,
  });

  const fields: { key: keyof CustomerRequest; label: string }[] = [
    { key: 'income', label: 'Revenu annuel' },
    { key: 'age', label: 'Âge' },
    { key: 'total_spend', label: 'Dépenses totales' },
    { key: 'num_web_purchases', label: 'Achats web' },
    { key: 'num_store_purchases', label: 'Achats magasin' },
    { key: 'recency', label: 'Récence (jours)' },
    { key: 'children', label: 'Enfants' },
  ];

  const action =
    result?.profile != null
      ? PROFILE_ACTIONS[result.profile] ?? 'Campagne personnalisée selon le profil.'
      : '';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void predict(form);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-xs text-slate-500">
        Saisissez les caractéristiques d&apos;un client — le modèle compare ce profil aux
        centroïdes Premium (~71 k€ / ~1 233 €) et Digital (~39 k€ / ~178 €).
      </p>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
              {label}
            </label>
            <input
              type="number"
              value={form[key]}
              min={key === 'age' ? 18 : 0}
              max={key === 'age' ? 100 : undefined}
              onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-xl p-4 border bg-indigo-50 border-indigo-200 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                result.profile === 'Premium'
                  ? 'bg-violet-200 text-violet-900'
                  : 'bg-sky-200 text-sky-900'
              }`}
            >
              {result.profile}
            </span>
            <span className="text-sm text-slate-600">Cluster {result.cluster_id}</span>
          </div>

          <p className="text-sm text-slate-700">{result.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/80 rounded-lg px-2 py-1.5 border border-indigo-100">
              <span className="text-slate-500 block">Revenu</span>
              <strong>{form.income.toLocaleString('fr-FR')} €</strong>
            </div>
            <div className="bg-white/80 rounded-lg px-2 py-1.5 border border-indigo-100">
              <span className="text-slate-500 block">Panier</span>
              <strong>{form.total_spend.toLocaleString('fr-FR')} €</strong>
            </div>
            <div className="bg-white/80 rounded-lg px-2 py-1.5 border border-indigo-100">
              <span className="text-slate-500 block">Web / mag.</span>
              <strong>
                {form.num_web_purchases} / {form.num_store_purchases}
              </strong>
            </div>
            <div className="bg-white/80 rounded-lg px-2 py-1.5 border border-indigo-100">
              <span className="text-slate-500 block">Enfants</span>
              <strong>{form.children}</strong>
            </div>
          </div>

          <div className="border-t border-indigo-200 pt-3 flex gap-2">
            <Lightbulb size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-900 uppercase">
                Action marketing recommandée
              </p>
              <p className="text-sm text-slate-700 mt-1">{action}</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Analyse…
          </>
        ) : (
          'SEGMENTER LE CLIENT'
        )}
      </button>
    </form>
  );
}

function buildSegmentBatchInterpretation(result: SegmentBatchResponse): string {
  const dist = result.summary.cluster_distribution;
  const total = result.processed;
  if (total === 0) return '';

  const parts = Object.entries(dist)
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `${label} : ${count} client(s) (${pct} %)`;
    });

  const dominant = Object.entries(dist).sort(([, a], [, b]) => b - a)[0];
  const dominantPct =
    dominant && total > 0 ? ((dominant[1] / total) * 100).toFixed(0) : '—';

  return (
    `${total} client(s) segmenté(s) sur ${result.total} ligne(s) du fichier. ` +
    `Répartition : ${parts.join(' · ')}. ` +
    (dominant
      ? `Le profil ${dominant[0]} domine (${dominantPct} %) — adapter le mix campagnes fidélité premium vs offres accessibles en conséquence.`
      : '')
  );
}

export function PredictSegmentModal({ open, onClose }: PredictSegmentModalProps) {
  const [tab, setTab] = useState<PredictTab>('upload');
  const batch = usePredictSegmentBatch();

  const dist = batch.result?.summary.cluster_distribution ?? {};
  const totalProcessed = batch.result?.processed ?? 0;

  const distCards = Object.entries(dist).map(([label, count]) => ({
    label,
    value:
      totalProcessed > 0
        ? `${count} (${((count / totalProcessed) * 100).toFixed(1)} %)`
        : String(count),
  }));

  const batchRows =
    batch.result?.rows.map((row) => [
      String(row.row_index),
      String(row.cluster_id),
      row.profile,
      row.description,
    ]) ?? [];

  return (
    <PredictModalShell
      open={open}
      onClose={onClose}
      title="Test de Segmentation"
      icon={<Users className="text-indigo-500" size={20} />}
      intro={<TestIntro />}
      loading={batch.loading}
      tab={tab}
      onTabChange={setTab}
      uploadPanel={
        <CsvUploadPanel
          templateKind="segment"
          loading={batch.loading}
          error={batch.error}
          onSubmit={(file) => void batch.predict(file)}
          submitLabel="LANCER LA SEGMENTATION"
        >
          {batch.result && batch.result.processed > 0 && (
            <BatchResultsPanel
              summaryCards={[
                { label: 'Lignes fichier', value: String(batch.result.total) },
                { label: 'Segmentés', value: String(batch.result.processed) },
                ...distCards.slice(0, 4),
              ]}
              headers={['Ligne', 'Cluster', 'Profil', 'Description']}
              rows={batchRows}
              exportFilename="resultats_segmentation.csv"
              errors={batch.result.errors}
              interpretation={buildSegmentBatchInterpretation(batch.result)}
            />
          )}
        </CsvUploadPanel>
      }
      manualPanel={<ManualSegmentForm />}
    />
  );
}
