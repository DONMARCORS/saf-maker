interface DropZoneProps {
  label: string;
  hint?: string;
  className?: string;
  onFiles: (files: File[]) => void;
  onUnmatchedDrop?: (file: File) => void;
  unmatched?: File[];
  children?: ReactNode;
  disabled?: boolean;
}

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { collectFilesFromDataTransfer } from '../lib/files';

const UNMATCHED_MIME = 'application/x-saf-unmatched';

export default function DropZone({
  label,
  hint,
  className,
  onFiles,
  onUnmatchedDrop,
  unmatched,
  children,
  disabled,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const [over, setOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current = 0;
    setOver(false);
    if (disabled) return;
    const data = e.dataTransfer;
    const indexRaw = data.getData(UNMATCHED_MIME);
    if (indexRaw) {
      const file = unmatched?.[Number(indexRaw)];
      if (file) onUnmatchedDrop?.(file);
      return;
    }
    const files = await collectFilesFromDataTransfer(data.items);
    if (files.length) onFiles(files);
  };

  return (
    <button
      type="button"
      className={`dropzone ${over ? 'over' : ''} ${disabled ? 'disabled' : ''} ${className ?? ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current += 1;
        setOver(true);
      }}
      onDragLeave={() => {
        counter.current -= 1;
        if (counter.current <= 0) setOver(false);
      }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      <span className="dzone-label">{label}</span>
      {hint && <span className="dzone-hint">{hint}</span>}
      {children}
    </button>
  );
}