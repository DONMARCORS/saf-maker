import { useMemo, useState } from 'react';
import type { HeaderColumn } from './lib/columns';
import { classifyHeader } from './lib/columns';
import { parseCsv, decodeCsvBuffer } from './lib/csv';
import { buildFreshItems } from './lib/items';
import { mkItemFile, isRefSatisfied, normalize, basename } from './lib/files';
import { validateItems } from './lib/validate';
import type { ItemReport } from './lib/validate';
import type { Item, ItemFile, Settings } from './types';
import { defaultSettings } from './types';
import CsvUpload from './components/CsvUpload';
import type { CsvUploadInfo } from './components/CsvUpload';
import SettingsPanel from './components/SettingsPanel';
import ColumnMapping from './components/ColumnMapping';
import UnassignedTray from './components/UnassignedTray';
import ItemList from './components/ItemList';
import type { ItemReportMap } from './components/ItemList';
import ExportPanel from './components/ExportPanel';
import DropZone from './components/DropZone';

interface ParsedData {
  headers: string[];
  rows: string[][];
}

export default function App() {
  const [stage, setStage] = useState<'upload' | 'work'>('upload');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [columns, setColumns] = useState<HeaderColumn[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [unmatched, setUnmatched] = useState<File[]>([]);
  const [filesStore, setFilesStore] = useState<Map<number, ItemFile[]>>(() => new Map());

  const items: Item[] = useMemo(() => {
    if (!parsed || columns.length === 0) return [];
    const fresh = buildFreshItems(columns, parsed.rows, settings.multiSep);
    return fresh.map((f, i) => ({
      ...f,
      key: i,
      csvRow: i + 2,
      files: filesStore.get(i) ?? [],
    }));
  }, [parsed, columns, settings.multiSep, filesStore]);

  const reports: ItemReportMap = useMemo(() => {
    const map = new Map<number, ItemReport>();
    for (const r of validateItems(items)) map.set(r.key, r);
    return map;
  }, [items]);

  function handleApply(info: CsvUploadInfo) {
    const { text } = decodeCsvBuffer(info.buffer, info.encoding);
    const { headers, rows } = parseCsv(text, info.delimiter, settings.multiSep);
    if (headers.length === 0) {
      window.alert('El CSV no tiene cabeceras válidas.');
      return;
    }
    setFilesStore(new Map());
    setParsed({ headers, rows });
    setColumns(headers.map(classifyHeader));
    setCsvFileName(info.fileName);
    setUnmatched([]);
    setStage('work');
  }

  function mutateFiles(fn: (m: Map<number, ItemFile[]>) => void) {
    setFilesStore((m) => {
      const next = new Map(m);
      fn(next);
      return next;
    });
  }

  function addFiles(key: number, files: File[], bundle: string) {
    mutateFiles((m) => {
      const existing = [...(m.get(key) ?? [])];
      const taken = new Set(existing.map((f) => f.name));
      const added = files.map((f) => mkItemFile(bundle, f, taken));
      m.set(key, [...existing, ...added]);
    });
  }

  function removeFile(key: number, fileId: string) {
    mutateFiles((m) => {
      const existing = m.get(key);
      if (existing) {
        const rest = existing.filter((f) => f.id !== fileId);
        if (rest.length) m.set(key, rest);
        else m.delete(key);
      }
    });
  }

  function addSourceFiles(files: File[]) {
    const remaining: File[] = [];
    const pending: { key: number; bundle: string; primary?: boolean; description?: string; file: File }[] = [];

    for (const file of files) {
      const base = normalize(basename(file.name));
      const rel = normalize(file.name);
      let key = -1;
      let bundle = 'ORIGINAL';
      let primary: boolean | undefined;
      let description: string | undefined;
      for (const item of items) {
        const ref = item.fileRefs.find(
          (r) =>
            !isRefSatisfied(item, r) &&
            (normalize(r.name) === base || normalize(r.name) === rel),
        );
        if (ref) {
          key = item.key;
          bundle = ref.bundle;
          primary = ref.primary;
          description = ref.description;
          break;
        }
      }
      if (key >= 0) pending.push({ key, bundle, primary, description, file });
      else remaining.push(file);
    }

    mutateFiles((m) => {
      for (const p of pending) {
        const existing = [...(m.get(p.key) ?? [])];
        const taken = new Set(existing.map((f) => f.name));
        m.set(p.key, [
          ...existing,
          mkItemFile(p.bundle, p.file, taken, { primary: p.primary, description: p.description }),
        ]);
      }
    });
    setUnmatched((u) => [...u, ...remaining]);
  }

  function resetAll() {
    setStage('upload');
    setParsed(null);
    setColumns([]);
    setCsvFileName('');
    setFilesStore(new Map());
    setUnmatched([]);
  }

  const completeCount = items.filter(
    (it) => !it.fileRefs.some((r) => !isRefSatisfied(it, r)),
  ).length;

  return (
    <div className="app">
      <header className="app-head">
        <h1>
          <span className="logo">SAF</span> Maker
          <span className="sub">para DSpace · Simple Archive Format</span>
        </h1>
        {stage === 'work' && (
          <button type="button" className="link" onClick={resetAll}>
            ← Nuevo CSV
          </button>
        )}
      </header>

      {stage === 'upload' && <CsvUpload onApply={handleApply} />}

      {stage === 'work' && parsed && (
        <>
          <SettingsPanel settings={settings} onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))} />

          <section className="panel">
            <div className="stats">
              <span className="stat">{items.length} items</span>
              <span className="stat">{completeCount} con todos sus archivos referenciados</span>
              <span className="stat">{unmatched.length} archivos sin asignar</span>
            </div>
            <h3>Asignación masiva de archivos</h3>
            <p className="muted">
              Suelta aquí una carpeta o varios archivos. Se asociarán automáticamente a los
              items según las referencias de <code>filename</code>/<code>bundle:…</code> del CSV.
            </p>
            <DropZone
              label="Asignar archivos automáticamente (matching por nombre)"
              hint="suelta la carpeta de fuentes o selecciona archivos"
              onFiles={addSourceFiles}
            />
          </section>

          <UnassignedTray unmatched={unmatched} onClear={() => setUnmatched([])} />

          <ColumnMapping headers={parsed.headers} columns={columns} onChange={setColumns} />

          <ItemList
            items={items}
            reports={reports}
            unmatched={unmatched}
            prefix={settings.prefix}
            digits={settings.digits}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
          />

          <ExportPanel
            items={items}
            settings={settings}
            reports={reports}
            csvFileName={csvFileName}
          />
        </>
      )}

      {stage === 'work' && !parsed && (
        <p className="muted">No hay datos cargados. Vuelve a cargar el CSV.</p>
      )}
    </div>
  );
}