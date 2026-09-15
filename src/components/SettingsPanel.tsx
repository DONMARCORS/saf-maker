import type { Settings } from '../types';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  return (
    <details className="panel settings">
      <summary>Configuración SAF</summary>
      <div className="settings-grid">
        <label>
          Prefijo de carpeta
          <input
            value={settings.prefix}
            onChange={(e) => onChange({ prefix: e.target.value })}
            placeholder="item_"
          />
        </label>
        <label>
          Dígitos (000)
          <input
            type="number"
            min={2}
            max={8}
            value={settings.digits}
            onChange={(e) => onChange({ digits: clamp(e.target.valueAsNumber, 2, 8) })}
          />
        </label>
        <label>
          Separador de valores múltiples
          <input
            value={settings.multiSep}
            onChange={(e) => onChange({ multiSep: e.target.value })}
            placeholder="||"
          />
        </label>
        <label>
          Tamaño máximo de miniatura (px)
          <input
            type="number"
            min={80}
            max={1200}
            value={settings.thumbMax}
            onChange={(e) => onChange({ thumbMax: clamp(e.target.valueAsNumber, 80, 1200) })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.autoThumbs}
            onChange={(e) => onChange({ autoThumbs: e.target.checked })}
          />
          Generar miniatura automática (imágenes jpg/png/webp de ORIGINAL)
        </label>
      </div>
    </details>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}