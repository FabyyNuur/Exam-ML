export interface CsvPreviewData {
  columns: string[];
  rowCount: number;
  sampleRows: string[][];
  hasIsFraud: boolean;
}

const MAX_PREVIEW_ROWS = 5;
const MAX_CLIENT_BYTES = 8 * 1024 * 1024;

export function parseCsvPreview(text: string): CsvPreviewData {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { columns: [], rowCount: 0, sampleRows: [], hasIsFraud: false };
  }

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const columns = lines[0].split(delimiter).map((c) => c.trim());
  const sampleRows = lines.slice(1, 1 + MAX_PREVIEW_ROWS).map((line) =>
    line.split(delimiter).map((c) => c.trim()),
  );

  return {
    columns,
    rowCount: Math.max(lines.length - 1, 0),
    sampleRows,
    hasIsFraud: columns.some((c) => c.toLowerCase() === 'isfraud'),
  };
}

export async function readCsvPreview(file: File): Promise<CsvPreviewData> {
  if (file.size > MAX_CLIENT_BYTES) {
    throw new Error('Fichier trop volumineux (max 8 Mo)');
  }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Seuls les fichiers .csv sont acceptés');
  }
  const text = await file.text();
  return parseCsvPreview(text);
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(';'),
    ...rows.map((row) => row.map((cell) => escape(String(cell))).join(';')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function templateUrl(kind: 'fraud' | 'segment') {
  const base = import.meta.env.VITE_API_URL ?? '';
  return `${base}/predict/templates/${kind}`;
}
