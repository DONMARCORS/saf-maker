export interface ParsedFileRef {
  name: string;
  bundle?: string;
  primary?: boolean;
  description?: string;
}

const KNOWN_PREFIXES = ['bundle:', 'primary:', 'description:'];

export function parseFileRefValue(raw: string): ParsedFileRef {
  const tokens = raw.split('__');
  let name = tokens[0];
  let bundle: string | undefined;
  let primary: boolean | undefined;
  let description: string | undefined;
  const extra: string[] = [];

  for (const t of tokens.slice(1)) {
    const lower = t.trim().toLowerCase();
    if (lower.startsWith('bundle:')) {
      bundle = t.slice(7).trim().toUpperCase();
    } else if (lower.startsWith('primary:')) {
      primary = t.slice(8).trim().toLowerCase() === 'true';
    } else if (lower.startsWith('description:')) {
      description = t.slice(12).trim();
    } else {
      extra.push(t);
    }
  }

  if (extra.length > 0) name = `${name}__${extra.join('__')}`;
  const trimmed = name.trim();
  if (trimmed === '') return { name: '', bundle: undefined, primary, description };
  return { name: trimmed, bundle, primary, description };
}

export function hasFileRefParams(raw: string): boolean {
  const tokens = raw.split('__').slice(1);
  return tokens.some((t) => {
    const lower = t.trim().toLowerCase();
    return KNOWN_PREFIXES.some((p) => lower.startsWith(p));
  });
}