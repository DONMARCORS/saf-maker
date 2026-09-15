import type { HeaderColumn } from '../lib/columns';
import { DEFAULT_BUNDLES } from '../lib/columns';

interface Props {
  headers: string[];
  columns: HeaderColumn[];
  onChange: (columns: HeaderColumn[]) => void;
}

export default function ColumnMapping({ headers, columns, onChange }: Props) {
  function update(index: number, patch: Partial<HeaderColumn>) {
    const next = columns.map((c, i) => (i === index ? ({ ...c, ...patch } as HeaderColumn) : c));
    onChange(next);
  }

  function setKind(index: number, kind: HeaderColumn['kind']) {
    const source = headers[index] ?? '';
    if (kind === 'metadata') {
      update(index, classifyAsMeta(source));
    } else if (kind === 'files') {
      update(index, { kind: 'files', source, bundle: 'ORIGINAL' });
    } else {
      update(index, { kind, source });
    }
  }

  return (
    <section className="panel">
      <h2>Mapeo de columnas</h2>
      <p className="muted">
        Revisa cómo se interpreta cada columna del CSV. Los cambios se aplican en cuanto editas.
      </p>
      <div className="table-wrap">
        <table className="mapping">
          <thead>
            <tr>
              <th>Columna CSV</th>
              <th>Tipo</th>
              <th>Campo DSpace / bundle</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr key={i}>
                <td>
                  <code className="col-source">{col.source}</code>
                </td>
                <td>
                  <select value={col.kind} onChange={(e) => setKind(i, e.target.value as HeaderColumn['kind'])}>
                    <option value="metadata">Metadato DC</option>
                    <option value="files">Archivos</option>
                    <option value="collections">Colecciones</option>
                    <option value="handle">Handle</option>
                    <option value="ignore">Ignorar</option>
                  </select>
                </td>
                <td>
                  {col.kind === 'metadata' && (
                    <span className="meta-editor">
                      <input
                        value={col.schema}
                        placeholder="schema"
                        onChange={(e) => update(i, { schema: e.target.value })}
                      />
                      <input
                        value={col.element}
                        placeholder="elemento"
                        onChange={(e) => update(i, { element: e.target.value })}
                      />
                      <input
                        value={col.qualifier ?? ''}
                        placeholder="calificador (vacío = none)"
                        onChange={(e) => update(i, { qualifier: e.target.value || null })}
                      />
                    </span>
                  )}
                  {col.kind === 'files' && (
                    <select
                      value={col.bundle}
                      onChange={(e) => update(i, { bundle: e.target.value })}
                    >
                      {[...DEFAULT_BUNDLES, col.bundle].filter((v, idx, arr) => arr.indexOf(v) === idx).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                  {col.kind === 'collections' && <span className="muted">Handle de colección (1 por línea, la primera es propietaria)</span>}
                  {col.kind === 'handle' && <span className="muted">Handle para el item</span>}
                  {col.kind === 'ignore' && <span className="muted">Se descarta</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function classifyAsMeta(source: string): HeaderColumn {
  const parts = source.split('.');
  if (parts.length >= 2) {
    const [schema, element, ...rest] = parts;
    return { kind: 'metadata', source, schema, element, qualifier: rest.length ? rest.join('.') : null };
  }
  return { kind: 'metadata', source, schema: 'dc', element: source, qualifier: null };
}