import type { Item, ItemFile, PendingFileRef } from '../types';

let fileSeq = 0;

export function nextFileId(): string {
  fileSeq += 1;
  return `f${fileSeq}`;
}

export function normalize(name: string): string {
  return name.trim().replace(/\\/g, '/').toLowerCase();
}

export function basename(path: string): string {
  const p = path.replace(/\\/g, '/');
  const i = p.lastIndexOf('/');
  return i >= 0 ? p.slice(i + 1) : p;
}

export function sanitizeItemFileName(name: string): string {
  const base = basename(name).trim();
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f\u007f]/g, '_').trim();
}

export function uniqueName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let i = 1;
  let candidate = `${stem}_${i}${ext}`;
  while (taken.has(candidate)) {
    i += 1;
    candidate = `${stem}_${i}${ext}`;
  }
  return candidate;
}

export function mkItemFile(
  bundle: string,
  file: File,
  taken: Set<string>,
  extra?: { primary?: boolean; description?: string },
): ItemFile {
  const name = uniqueName(sanitizeItemFileName(file.name), taken);
  taken.add(name);
  return {
    id: nextFileId(),
    name,
    blob: file,
    bundle: (bundle || 'ORIGINAL').toUpperCase(),
    ...(extra?.primary ? { primary: true } : {}),
    ...(extra?.description ? { description: extra.description } : {}),
  };
}

export function isRefSatisfied(item: Item, ref: PendingFileRef): boolean {
  return item.files.some(
    (f) => normalize(f.name) === normalize(ref.name),
  );
}

export function pendingRefs(item: Item): PendingFileRef[] {
  return item.fileRefs.filter((r) => !isRefSatisfied(item, r));
}

export function attachByRefs(items: Item[], files: File[]): File[] {
  const unmatched: File[] = [];
  for (const file of files) {
    const base = normalize(basename(file.name));
    const rel = normalize(file.name);
    let attached = false;
    for (const item of items) {
      const taken = new Set(item.files.map((f) => f.name));
      const ref = item.fileRefs.find((r) => {
        if (isRefSatisfied(item, r)) return false;
        const refName = normalize(r.name);
        return refName === base || refName === rel;
      });
      if (ref) {
        item.files.push(
          mkItemFile(ref.bundle, file, taken, {
            primary: ref.primary,
            description: ref.description,
          }),
        );
        attached = true;
        break;
      }
    }
    if (!attached) unmatched.push(file);
  }
  return unmatched;
}

export async function collectFilesFromDataTransfer(
  items: DataTransferItemList,
): Promise<File[]> {
  const out: File[] = [];
  const queue: { entry: FileSystemEntry; path: string }[] = [];
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) queue.push({ entry, path: '' });
  }
  while (queue.length) {
    const { entry, path } = queue.shift()!;
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      const rel = path ? `${path}/${file.name}` : file.name;
      const withPath = new File([file], rel, {
        type: file.type,
        lastModified: file.lastModified,
      });
      out.push(withPath);
    } else if (entry.isDirectory) {
      const entries = await new Promise<FileSystemEntry[]>((resolve) => {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        const collected: FileSystemEntry[] = [];
        const readAll = () => {
          reader.readEntries((batch) => {
            if (batch.length) {
              collected.push(...batch);
              readAll();
            } else {
              resolve(collected);
            }
          });
        };
        readAll();
      });
      for (const e of entries) {
        queue.push({ entry: e, path: `${path}/${entry.name}` });
      }
    }
  }
  return out;
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}