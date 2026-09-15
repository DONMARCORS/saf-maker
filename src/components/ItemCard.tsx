import { useEffect, useMemo, useState } from 'react';
import type { Item, ItemFile } from '../types';
import type { ItemReport } from '../lib/validate';
import { pendingRefs } from '../lib/files';
import { fileSizeLabel } from '../lib/files';
import DropZone from './DropZone';

interface Props {
  item: Item;
  index: number;
  prefix: string;
  digits: number;
  report: ItemReport;
  unmatched: File[];
  onAddFiles: (key: number, files: File[], bundle: string) => void;
  onRemoveFile: (key: number, fileId: string) => void;
}

export default function ItemCard({
  item,
  index,
  prefix,
  digits,
  report,
  unmatched,
  onAddFiles,
  onRemoveFile,
}: Props) {
  const [open, setOpen] = useState(false);
  const label = `${prefix}${String(index).padStart(digits, '0')}`;
  const title = item.metadata.find((m) => m.schema === 'dc' && m.element === 'title' && !m.qualifier)?.value
    ?? item.metadata.find((m) => m.schema === 'dc' && m.element === 'title')?.value
    ?? `Item ${index + 1}`;
  const pending = pendingRefs(item);
  const status = report.errors.length
    ? 'bad'
    : report.warnings.length
      ? 'warn'
      : 'ok';

  const files = item.files;
  const originals = files.filter((f) => f.bundle === 'ORIGINAL' || !f.bundle);
  const thumbs = files.filter((f) => f.bundle === 'THUMBNAIL');
  const others = files.filter((f) => f.bundle !== 'ORIGINAL' && f.bundle !== 'THUMBNAIL');

  return (
    <article className={`card ${status}`}>
      <header className="card-head" onClick={() => setOpen((o) => !o)}>
        <span className="card-title">{title}</span>
        <span className="card-meta">
          <span className="badge label">{label}</span>
          <span className="badge files">{files.length} archivo(s)</span>
          {pending.length > 0 && <span className="badge pending">faltan {pending.length}</span>}
          <span className={`badge dot ${status}`} />
        </span>
      </header>

      {open && (
        <div className="card-body">
          {(report.errors.length > 0 || report.warnings.length > 0) && (
            <ul className="msg-list">
              {report.errors.map((e, i) => (
                <li key={`e${i}`} className="error">{e}</li>
              ))}
              {report.warnings.map((w, i) => (
                <li key={`w${i}`} className="warn">{w}</li>
              ))}
            </ul>
          )}

          {pending.length > 0 && (
            <div className="pending-refs">
              <span className="muted">Referencias sin archivo (arrástralo sobre este item):</span>
              <div className="chips">
                {pending.map((p, i) => (
                  <span key={i} className="chip pending-chip">{(p.bundle !== 'ORIGINAL' ? `[${p.bundle}] ` : '') + p.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="files-grid">
            <section className="files-section">
              <h4>Archivos ({originals.length})</h4>
              <FileList files={originals} itemKey={item.key} onRemoveFile={onRemoveFile} />
              <DropZone
                label="+ Añadir archivos (bundle ORIGINAL)"
                hint="suelta archivos o una carpeta aquí"
                unmatched={unmatched}
                onFiles={(files) => onAddFiles(item.key, files, 'ORIGINAL')}
                onUnmatchedDrop={(file) => onAddFiles(item.key, [file], 'ORIGINAL')}
                className="compact"
              />
            </section>
            <section className="files-section">
              <h4>Miniaturas ({thumbs.length})</h4>
              <FileList files={thumbs} itemKey={item.key} onRemoveFile={onRemoveFile} />
              <DropZone
                label="+ Añadir miniatura (bundle THUMBNAIL)"
                hint="suelta la imagen miniatura"
                unmatched={unmatched}
                onFiles={(files) => onAddFiles(item.key, files, 'THUMBNAIL')}
                onUnmatchedDrop={(file) => onAddFiles(item.key, [file], 'THUMBNAIL')}
                className="compact"
              />
            </section>
            {others.length > 0 && (
              <section className="files-section">
                <h4>Otros bundles</h4>
                <FileList files={others} itemKey={item.key} onRemoveFile={onRemoveFile} />
              </section>
            )}
          </div>

          <div className="metadata-preview">
            <h4>Metadatos ({item.metadata.length})</h4>
            {item.metadata.length === 0 && <span className="muted">Sin metadatos</span>}
            <ul className="meta-list">
              {item.metadata.slice(0, 12).map((m, i) => (
                <li key={i}>
                  <code className="dc">
                    {m.schema}.{m.element}
                    {m.qualifier ? `.${m.qualifier}` : ''}
                  </code>
                  <span className="dc-value">{m.value}</span>
                </li>
              ))}
              {item.metadata.length > 12 && <li className="muted">… {item.metadata.length - 12} más</li>}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}

function FileList({
  files,
  itemKey,
  onRemoveFile,
}: {
  files: ItemFile[];
  itemKey: number;
  onRemoveFile: (key: number, fileId: string) => void;
}) {
  if (files.length === 0) return <p className="muted empty">Ninguno.</p>;
  return (
    <ul className="file-list">
      {files.map((f) => (
        <li key={f.id}>
          {f.bundle === 'THUMBNAIL' && <PreviewThumb blob={f.blob} />}
          <span className="file-name">{f.name}</span>
          <span className="muted">{fileSizeLabel(f.blob.size)}</span>
          <button
            type="button"
            className="link danger"
            onClick={() => onRemoveFile(itemKey, f.id)}
          >
            quitar
          </button>
        </li>
      ))}
    </ul>
  );
}

function PreviewThumb({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img className="thumb-preview" src={url} alt="" />;
}