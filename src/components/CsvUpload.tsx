import { useState } from 'react';
import DropZone from './DropZone';
import { decodeCsvBuffer, detectDelimiter } from '../lib/csv';

export interface CsvUploadInfo {
  buffer: ArrayBuffer;
  fileName: string;
  size: number;
  delimiter: string;
  encoding: string;
}

const ENCODINGS = [
  { value: '', label: 'Auto (detectar)' },
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'iso-8859-1', label: 'ISO-8859-1 / Windows-1252' },
];

export default function CsvUpload({ onApply }: { onApply: (info: CsvUploadInfo) => void }) {
  const [fileName, setFileName] = useState('');
  const [size, setSize] = useState(0);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [detectedDelim, setDetectedDelim] = useState(',');
  const [detectedEnc, setDetectedEnc] = useState('UTF-8');
  const [delimiter, setDelimiter] = useState('');
  const [encoding, setEncoding] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const { text, encoding: enc } = decodeCsvBuffer(buf);
      const delim = detectDelimiter(text);
      setFileName(file.name);
      setSize(file.size);
      setBuffer(buf);
      setDetectedDelim(delim);
      setDetectedEnc(enc);
      setDelimiter('');
      setEncoding('');
      setPreview(text.split(/\r?\n/).slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo');
    }
  }

  function apply() {
    if (!buffer) return;
    onApply({
      buffer,
      fileName,
      size,
      delimiter: delimiter || detectedDelim,
      encoding: encoding || (detectedEnc === 'UTF-8' ? 'utf-8' : 'iso-8859-1'),
    });
  }

  const ready = buffer !== null;

  return (
    <section className="panel">
      <h2>1 · Cargar CSV de metadatos</h2>
      <p className="muted">
        El CSV debe tener una fila de cabecera. Las cabeceras tipo{' '}
        <code>dc.title</code> o <code>dc.description.abstract</code> se interpretan como
        metadatos Dublin Core; <code>filename</code> / <code>bundle:THUMBNAIL</code>{' '}
        / <code>collections</code> se interpretan como archivos y colecciones.
      </p>
      <DropZone
        label="Arrastra aquí tu archivo .csv"
        hint="o haz clic para seleccionarlo"
        onFiles={(files) => files[0] && handleFile(files[0])}
      />
      {error && <p className="error">{error}</p>}
      {ready && (
        <div className="csv-preview">
          <div className="csv-info">
            <span className="file-name">{fileName}</span>
            <span className="muted">{(size / 1024).toFixed(1)} KB</span>
          </div>
          <pre>{preview.join('\n')}</pre>
          <div className="row opts">
            <label>
              Delimitador detectado: <b>{detectedDelim === '\t' ? 'TAB' : `"${detectedDelim}"`}</b>
              <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
                <option value="">Auto ({detectedDelim === '\t' ? 'TAB' : detectedDelim})</option>
                <option value=";">Punto y coma (;)</option>
                <option value=",">Coma (,)</option>
                <option value="\t">TAB</option>
              </select>
            </label>
            <label>
              Codificación detectada: <b>{detectedEnc}</b>
              <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                {ENCODINGS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary" onClick={apply}>
            Cargar CSV
          </button>
        </div>
      )}
    </section>
  );
}