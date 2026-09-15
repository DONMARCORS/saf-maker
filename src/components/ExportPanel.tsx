import { useState } from 'react';
import type { Item, Settings } from '../types';
import type { ItemReportMap } from './ItemList';
import { aggregate } from '../lib/validate';
import { buildExportZip } from '../lib/export';
import { downloadBlob, zipBaseName } from '../lib/download';

interface Props {
  items: Item[];
  settings: Settings;
  reports: ItemReportMap;
  csvFileName: string;
}

export default function ExportPanel({ items, settings, reports, csvFileName }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const agg = aggregate(items.map((it) => reports.get(it.key) ?? { key: it.key, errors: [], warnings: [] }));
  const errors = items.some((it) => (reports.get(it.key)?.errors.length ?? 0) > 0);

  async function exportZip() {
    if (items.length === 0) return;
    if (errors) {
      const ok = window.confirm(
        `Hay ${agg.errorCount} error(es) en ${agg.itemsWithErrors} item(s). ¿Generar el ZIP de todas formas?`,
      );
      if (!ok) return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { blob, stats } = await buildExportZip(items, settings);
      const base = zipBaseName(csvFileName || 'saf');
      downloadBlob(blob, `${base}-saf.zip`);
      setMessage(
        `ZIP generado con ${stats.items} items` +
          (stats.thumbnails ? ` y ${stats.thumbnails} miniaturas generadas` : ''),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel export">
      <h2>3 · Validar y exportar</h2>
      <div className="stats">
        <span className="stat">{items.length} items</span>
        <span className={`stat ${agg.itemsWithErrors ? 'bad' : 'ok'}`}>
          {agg.itemsWithErrors} con errores ({agg.errorCount})
        </span>
        <span className="stat warn">
          {agg.itemsWithWarnings} con avisos ({agg.warningCount})
        </span>
      </div>
      <p className="muted">
        El ZIP contendrá las carpetas <code>{settings.prefix}000…</code> con{' '}
        <code>dublin_core.xml</code>, <code>contents</code> y los archivos, listo para el
        "Batch Import (ZIP)" de DSpace 7.4+ o la herramienta <code>import</code> de DSpace.
      </p>
      <button className="primary big" onClick={exportZip} disabled={busy || items.length === 0}>
        {busy ? 'Generando ZIP…' : `Generar y descargar ZIP (${items.length} items)`}
      </button>
      {message && <p className="ok-msg">{message}</p>}
    </section>
  );
}