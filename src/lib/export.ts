import type { Item, ItemFile, Settings } from '../types';
import { itemFolderEntries } from './saf';
import { buildSafZip } from './zip';
import { generateThumbnail } from './thumbnail';

export function isImageBlob(blob: Blob): boolean {
  return (
    blob.type === 'image/jpeg' ||
    blob.type === 'image/png' ||
    blob.type === 'image/webp'
  );
}

function thumbNameFor(name: string): string {
  return `${name}.jpg`;
}

export interface BuildStats {
  thumbnails: number;
  items: number;
}

export async function buildExportZip(
  items: Item[],
  settings: Settings,
): Promise<{ blob: Blob; stats: BuildStats }> {
  const folders = [];
  let thumbnails = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const files: ItemFile[] = [...item.files];

    if (settings.autoThumbs) {
      const missingOriginals = files.filter(
        (f) =>
          f.bundle === 'ORIGINAL' &&
          isImageBlob(f.blob) &&
          !files.some(
            (x) => x.bundle === 'THUMBNAIL' && x.name === thumbNameFor(f.name),
          ),
      );
      for (const original of missingOriginals) {
        const thumb = await generateThumbnail(original.blob, settings.thumbMax);
        if (thumb) {
          files.push({
            id: `${original.id}-thumb`,
            name: thumbNameFor(original.name),
            blob: thumb,
            bundle: 'THUMBNAIL',
          });
          thumbnails += 1;
        }
      }
    }

    folders.push(
      itemFolderEntries({ ...item, files }, i, settings.prefix, settings.digits),
    );
  }

  const blob = await buildSafZip(folders);
  return { blob, stats: { thumbnails, items: items.length } };
}