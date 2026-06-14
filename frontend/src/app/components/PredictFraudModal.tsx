import React, { useState } from 'react';
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { FraudBatchResponse, FraudRequest } from '@/lib/api';
import { usePredictFraud, usePredictFraudBatch } from '@/lib/hooks';
import { PredictModalShell, PredictTab } from './PredictModalShell';
import { CsvUploadPanel } from './CsvUploadPanel';
import { BatchResultsPanel } from './BatchResultsPanel';
import { EvaluationSummary } from './EvaluationSummary';

const TX_TYPES = ['PAYMENT', 'TRANSFER', 'CASH_OUT', 'DEBIT', 'CASH_IN'] as const;
const FRAUD_THRESHOLD_PCT = 30;

interface PredictFraudModalProps {
  open: boolean;
  onClose: () => void;
}

function TestIntro() {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-slate-700 leading-relaxed">
      <p className="font-semibold text-red-900 mb-2 flex items-center gap-2">
        <Target size={16} /> Ce que fait ce test
      </p>
      <p className="mb-2">
        Le modèle <strong>XGBoost</strong> calcule une probabilité de fraude à partir du type de
        transaction, du montant et des soldes. Au-delà de{' '}
        <strong>{FRAUD_THRESHOLD_PCT} %</strong>, la transaction est classée frauduleuse (seuil
        abaissé volontairement pour privilégier le <strong>recall</strong>).
      </p>
      <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
        <li>
          <strong>Saisie manuelle</strong> : scorer une transaction et voir probabilité, décision et
          niveau de risque.
        </li>
        <li>
          <strong>Upload CSV</strong> : scoring batch + répartition des risques ; si la colonne{' '}
          <code>isFraud</code> est présente, métriques d&apos;évaluation automatiques (ROC-AUC,
          precision, recall, matrice de confusion).
        </li>
      </ul>
    </div>
  );
}

function ManualFraudForm() {
  const { predict, loading, error, result } = usePredictFraud();
  const [form, setForm] = useState<FraudRequest>({
    step: 100,
    type: 'TRANSFER',
    amount: 5000,
    oldbalanceOrg: 10000,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 5000,
  });

  const field = (key: keyof FraudRequest, label: string, type: 'number' | 'select' = 'number') => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">{label}</label>
      {type === 'select' ? (
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as FraudRequest['type'] })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          {TX_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={form[key] as number}
          min={key === 'step' ? 1 : 0}
          onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );

  const probaPct = result ? (result.probability * 100).toFixed(1) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void predict(form);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-xs text-slate-500">
        Les types <strong>TRANSFER</strong> et <strong>CASH_OUT</strong> concentrent la majorité
        des fraudes dans le jeu d&apos;entraînement — testez différents montants et soldes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('step', 'Step')}
        {field('type', 'Type', 'select')}
        {field('amount', 'Montant')}
        {field('oldbalanceOrg', 'Solde émetteur (avant)')}
        {field('newbalanceOrig', 'Solde émetteur (après)')}
        {field('oldbalanceDest', 'Solde destinataire (avant)')}
        {field('newbalanceDest', 'Solde destinataire (après)')}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </p>
      )}

      {result && (
        <div
          className={`rounded-xl p-4 border space-y-3 ${
            result.is_fraud ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.is_fraud ? (
              <AlertTriangle className="text-red-600" size={20} />
            ) : (
              <CheckCircle2 className="text-emerald-600" size={20} />
            )}
            <p className="font-bold text-slate-800">
              {result.is_fraud ? 'FRAUDE DÉTECTÉE' : 'TRANSACTION LÉGITIME'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/80 rounded-lg px-2 py-2 border">
              <span className="text-slate-500 block">Probabilité</span>
              <strong className="text-base">{probaPct} %</strong>
            </div>
            <div className="bg-white/80 rounded-lg px-2 py-2 border">
              <span className="text-slate-500 block">Seuil</span>
              <strong className="text-base">{FRAUD_THRESHOLD_PCT} %</strong>
            </div>
            <div className="bg-white/80 rounded-lg px-2 py-2 border">
              <span className="text-slate-500 block">Risque</span>
              <strong className="text-base capitalize">{result.risk_level}</strong>
            </div>
          </div>

          <p className="text-sm text-slate-700">
            {result.is_fraud
              ? `Probabilité ${probaPct} % ≥ seuil ${FRAUD_THRESHOLD_PCT} % → transaction signalée pour revue manuelle (priorité recall).`
              : `Probabilité ${probaPct} % < seuil ${FRAUD_THRESHOLD_PCT} % → transaction classée légitime ; surveiller si risque « moyen » ou « élevé ».`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t pt-3">
            <div>
              <span className="text-slate-500">Type : </span>
              <strong>{form.type}</strong>
            </div>
            <div>
              <span className="text-slate-500">Montant : </span>
              <strong>{form.amount.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Analyse…
          </>
        ) : (
          'SCORER LA TRANSACTION'
        )}
      </button>
    </form>
  );
}

function buildFraudBatchInterpretation(result: FraudBatchResponse): string {
  const { summary, evaluation } = result;
  const parts = [
    `${summary.fraud_count} fraude(s) détectée(s) sur ${result.processed} transaction(s) scorée(s) ` +
      `(${(summary.fraud_rate * 100).toFixed(1)} % du batch).`,
  ];

  const riskEntries = Object.entries(summary.risk_distribution ?? {}).filter(
    ([, count]) => count > 0,
  );
  if (riskEntries.length) {
    parts.push(
      `Répartition des risques : ${riskEntries.map(([k, v]) => `${k} (${v})`).join(', ')}.`,
    );
  }

  if (evaluation) {
    parts.push(
      `Évaluation vs isFraud : accuracy ${evaluation.accuracy.toFixed(3)}, ROC-AUC ${evaluation.roc_auc.toFixed(3)}, recall ${evaluation.recall.toFixed(3)}, precision ${evaluation.precision.toFixed(3)} — le modèle retrouve ${evaluation.recall * 100}% des fraudes réelles du fichier.`,
    );
  } else {
    parts.push(
      'Ajoutez une colonne isFraud au CSV pour activer l\'évaluation automatique (ROC-AUC, matrice de confusion).',
    );
  }

  return parts.join(' ');
}

export function PredictFraudModal({ open, onClose }: PredictFraudModalProps) {
  const [tab, setTab] = useState<PredictTab>('upload');
  const batch = usePredictFraudBatch();

  const batchRows =
    batch.result?.rows.map((row) => [
      String(row.row_index),
      row.is_fraud ? 'Oui' : 'Non',
      (row.probability * 100).toFixed(1) + '%',
      row.risk_level,
    ]) ?? [];

  const riskDist = batch.result?.summary.risk_distribution ?? {};

  return (
    <PredictModalShell
      open={open}
      onClose={onClose}
      title="Test de Détection"
      icon={<ShieldAlert className="text-red-500" size={20} />}
      intro={<TestIntro />}
      loading={batch.loading}
      tab={tab}
      onTabChange={setTab}
      uploadPanel={
        <CsvUploadPanel
          templateKind="fraud"
          loading={batch.loading}
          error={batch.error}
          onSubmit={(file) => void batch.predict(file)}
          submitLabel="LANCER LE SCORING"
        >
          {batch.result && batch.result.processed > 0 && (
            <BatchResultsPanel
              summaryCards={[
                { label: 'Lignes fichier', value: String(batch.result.total) },
                { label: 'Scorées', value: String(batch.result.processed) },
                {
                  label: 'Fraudes',
                  value: `${batch.result.summary.fraud_count} (${(batch.result.summary.fraud_rate * 100).toFixed(1)}%)`,
                },
                { label: 'Risque élevé', value: String(riskDist['élevé'] ?? 0) },
              ]}
              headers={['Ligne', 'Fraude', 'Probabilité', 'Risque']}
              rows={batchRows}
              exportFilename="resultats_fraude.csv"
              errors={batch.result.errors}
              interpretation={buildFraudBatchInterpretation(batch.result)}
              extra={
                batch.result.evaluation ? (
                  <EvaluationSummary evaluation={batch.result.evaluation} />
                ) : undefined
              }
            />
          )}
        </CsvUploadPanel>
      }
      manualPanel={<ManualFraudForm />}
    />
  );
}
