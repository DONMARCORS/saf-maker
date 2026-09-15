export interface HeaderBase {
  source: string;
}

export interface HeaderFileColumn extends HeaderBase {
  kind: 'files';
  bundle: string;
  params?: string;
}

export interface HeaderMetaColumn extends HeaderBase {
  kind: 'metadata';
  schema: string;
  element: string;
  qualifier: string | null;
}

export interface HeaderOtherColumn extends HeaderBase {
  kind: 'collections' | 'handle' | 'ignore';
}

export type HeaderColumn = HeaderFileColumn | HeaderMetaColumn | HeaderOtherColumn;

export const DEFAULT_BUNDLES = ['ORIGINAL', 'THUMBNAIL', 'TEXT', 'LICENSE'];

export function classifyHeader(raw: string): HeaderColumn {
  const h = raw.trim();
  const lower = h.toLowerCase();

  if (lower === 'collections' || lower === 'collection') {
    return { kind: 'collections', source: h };
  }
  if (lower === 'handle') {
    return { kind: 'handle', source: h };
  }
  if (lower === 'id') {
    return { kind: 'ignore', source: h };
  }
  if (lower === 'thumbnail') {
    return { kind: 'files', bundle: 'THUMBNAIL', source: h };
  }
  if (lower === 'filename' || lower === 'bitstreams' || lower === 'bitstream') {
    return { kind: 'files', bundle: 'ORIGINAL', source: h };
  }

  const bundleMatch = /^bundle\s*:(.*)$/i.exec(lower);
  if (bundleMatch) {
    const bundle = (bundleMatch[1] || '').trim().toUpperCase() || 'ORIGINAL';
    return { kind: 'files', bundle, source: h };
  }

  const filenameParams = /^filename__\s*(.*)$/i.exec(lower);
  if (filenameParams) {
    const params = (filenameParams[1] || '').trim();
    const bundleMatch2 = /^bundle\s*:(.*)$/i.exec(params);
    const bundle = bundleMatch2 ? (bundleMatch2[1] || '').trim().toUpperCase() : 'ORIGINAL';
    return { kind: 'files', bundle, params, source: h };
  }

  if (h.includes('.')) {
    const parts = h.split('.');
    const [schema, element, qualifier] = parts as [string, string, string | undefined];
    return {
      kind: 'metadata',
      schema: (schema || 'dc').trim(),
      element: (element || '').trim() || h,
      qualifier: qualifier?.trim() ?? null,
      source: h,
    };
  }

  if (h.length > 0) {
    return { kind: 'metadata', schema: 'dc', element: h, qualifier: null, source: h };
  }

  return { kind: 'ignore', source: h };
}

export function formatDcKey(schema: string, element: string, qualifier: string | null): string {
  const q = qualifier ? `.${qualifier}` : '';
  return `${schema}.${element}${q}`;
}