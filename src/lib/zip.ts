import JSZip from 'jszip';
import type { FolderEntry } from './saf';

export async function buildSafZip(
  folders: { dir: string; entries: FolderEntry[] }[],
): Promise<Blob> {
  const zip = new JSZip();
  for (const folder of folders) {
    const dir = zip.folder(folder.dir);
    if (!dir) continue;
    for (const entry of folder.entries) {
      dir.file(entry.path, entry.data);
    }
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}