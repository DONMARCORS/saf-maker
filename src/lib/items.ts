import type { HeaderColumn } from './columns';
import type { Item, MetadataField, PendingFileRef } from '../types';
import { splitValues } from './csv';
import { parseFileRefValue } from './refs';

export function buildFreshItems(
  columns: HeaderColumn[],
  rows: string[][],
  multiSep: string,
): Required<Pick<Item, 'metadata' | 'fileRefs' | 'collections' | 'handle'>>[] {
  return rows.map((row) => {
    const metadata: MetadataField[] = [];
    const fileRefs: PendingFileRef[] = [];
    let collections: string[] = [];
    let handle = '';

    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      const raw = row[ci] ?? '';
      if (raw.trim() === '') continue;
      switch (col.kind) {
        case 'metadata':
          for (const value of splitValues(raw, multiSep)) {
            metadata.push({
              schema: col.schema,
              element: col.element,
              qualifier: col.qualifier,
              value,
            });
          }
          break;
        case 'files':
          for (const value of splitValues(raw, multiSep)) {
            const ref = parseFileRefValue(value);
            if (!ref.name) continue;
            fileRefs.push({
              bundle: ref.bundle ?? col.bundle ?? 'ORIGINAL',
              name: ref.name,
              primary: ref.primary,
              description: ref.description,
            });
          }
          break;
        case 'collections':
          collections = splitValues(raw, multiSep);
          break;
        case 'handle':
          handle = raw.trim();
          break;
        default:
          break;
      }
    }

    return { metadata, fileRefs, collections, handle } as Item;
  });
}