import { escapeXml } from './xml';
import type { Item, ItemFile, MetadataField } from '../types';

export function buildSchemaXml(schema: string, fields: MetadataField[]): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push(`<dublin_core schema="${escapeXml(schema)}">`);
  for (const f of fields) {
    const lang = f.language ? ` language="${escapeXml(f.language)}"` : '';
    const qualifier = escapeXml(f.qualifier ?? 'none');
    lines.push(
      `<dcvalue element="${escapeXml(f.element)}" qualifier="${qualifier}"${lang}>${escapeXml(f.value)}</dcvalue>`,
    );
  }
  lines.push('</dublin_core>');
  return lines.join('\n') + '\n';
}

export function buildContents(files: ItemFile[]): string {
  const lines = files.map((f) => {
    let line = f.name;
    const opts: string[] = [];
    const bundle = (f.bundle || 'ORIGINAL').toUpperCase();
    if (bundle !== 'ORIGINAL') opts.push(`bundle:${bundle}`);
    if (f.description) opts.push(`description:${f.description}`);
    if (f.primary) opts.push('primary:true');
    if (opts.length) line += '\t' + opts.join('\t');
    return line;
  });
  return lines.join('\n') + '\n';
}

export function groupedSchemaFields(
  item: Item,
): Map<string, MetadataField[]> {
  const groups = new Map<string, MetadataField[]>();
  for (const f of item.metadata) {
    const key = f.schema || 'dc';
    const arr = groups.get(key);
    if (arr) arr.push(f);
    else groups.set(key, [f]);
  }
  return groups;
}

export interface FolderEntry {
  path: string;
  data: Blob | string;
}

export function itemFolderEntries(item: Item, index: number, prefix: string, digits: number): { dir: string; entries: FolderEntry[] } {
  const dir = `${prefix}${String(index).padStart(digits, '0')}`;
  const entries: FolderEntry[] = [];

  for (const [schema, fields] of groupedSchemaFields(item)) {
    const file = schema === 'dc' ? 'dublin_core.xml' : `metadata_${schema}.xml`;
    entries.push({ path: file, data: buildSchemaXml(schema, fields) });
  }

  for (const f of item.files) {
    entries.push({ path: f.name, data: f.blob });
  }

  entries.push({ path: 'contents', data: buildContents(item.files) });

  if (item.collections.length > 0) {
    entries.push({ path: 'collections', data: item.collections.join('\n') + '\n' });
  }
  if (item.handle) {
    entries.push({ path: 'handle', data: item.handle + '\n' });
  }

  return { dir, entries };
}