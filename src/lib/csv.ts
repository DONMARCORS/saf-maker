import Papa from 'papaparse';

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
}

export function decodeCsvBuffer(
  buffer: ArrayBuffer,
  preferred?: string,
): { text: string; encoding: string } {
  if (preferred) {
    return { text: new TextDecoder(preferred).decode(buffer), encoding: preferred };
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { text, encoding: 'UTF-8' };
  } catch {
    const text = new TextDecoder('iso-8859-1').decode(buffer);
    return { text, encoding: 'ISO-8859-1' };
  }
}

export function detectDelimiter(text: string): string {
  const candidates = [';', '\t', ',', '|'];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 25);
  if (lines.length === 0) return ',';
  let best = ',';
  let bestScore = -1;
  for (const d of candidates) {
    const parsed = Papa.parse<string[]>(lines.join('\n'), {
      delimiter: d,
      skipEmptyLines: true,
    });
    const colCounts = parsed.data.map((r) => r.length);
    const primary = mode(colCounts);
    if (primary <= 1) continue;
    const consistency = colCounts.filter((c) => c === primary).length / colCounts.length;
    const score = consistency * 1000 + primary;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter: string, multiSep: string): CsvParseResult {
  const res = Papa.parse<string[]>(text, {
    delimiter,
    header: false,
    skipEmptyLines: true,
  });
  const raw = res.data.filter((r) => r.some((c) => c.trim() !== ''));
  const headers = (raw[0] ?? []).map((h) => (h ?? '').trim());
  const rows = raw.slice(1).map((r) => {
    const out: string[] = [];
    for (let i = 0; i < headers.length; i++) out.push((r[i] ?? '').trim());
    return out;
  });
  void multiSep;
  return { headers, rows };
}

export function splitValues(value: string, sep: string): string[] {
  if (value.trim() === '') return [];
  return value
    .split(sep)
    .map((v) => v.trim())
    .filter((v) => v !== '');
}

export function mode(values: number[]): number {
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best = 0;
  let bestCount = -1;
  for (const [v, c] of freq) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}