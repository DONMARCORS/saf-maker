const UNMATCHED_MIME = 'application/x-saf-unmatched';

interface Props {
  unmatched: File[];
  onClear: () => void;
}

export default function UnassignedTray({ unmatched, onClear }: Props) {
  if (unmatched.length === 0) return null;
  return (
    <section className="panel tray">
      <div className="tray-head">
        <h2>Archivos sin asignar ({unmatched.length})</h2>
        <button type="button" className="link danger" onClick={onClear}>
          vaciar
        </button>
      </div>
      <p className="muted">
        Sus nombres no coincidieron con las referencias del CSV. Arrástralos sobre un item para
        asignarlos manualmente.
      </p>
      <div className="chips">
        {unmatched.map((f, i) => (
          <span
            key={i}
            className="chip"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(UNMATCHED_MIME, String(i));
              e.dataTransfer.setData('text/plain', f.name);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            {f.name}
          </span>
        ))}
      </div>
    </section>
  );
}