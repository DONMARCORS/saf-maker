import { expect, it } from 'vitest';
import { parseCsv } from './csv';
import { classifyHeader } from './columns';
import { buildFreshItems } from './items';
import { attachByRefs, isRefSatisfied, pendingRefs } from './files';
import { buildContents } from './saf';

it('interpreta valores tipo SAFCreator (caso real OCEAL)', () => {
  const csv = 'dc.title;filename\nATTO;ATTO (Amazon Tall Tower Observatory).jpg__bundle:THUMBNAIL\n';
  const { headers, rows } = parseCsv(csv, ';', '||');
  const columns = headers.map(classifyHeader);
  expect(columns[1].kind).toBe('files');

  const fresh = buildFreshItems(columns, rows, '||');
  const items = fresh.map((f, i) => ({ ...f, key: i, csvRow: i + 2, files: [] as never[] }));

  expect(items[0].fileRefs).toEqual([
    {
      bundle: 'THUMBNAIL',
      name: 'ATTO (Amazon Tall Tower Observatory).jpg',
      primary: undefined,
      description: undefined,
    },
  ]);

  const unmatched = attachByRefs(items as never, [
    new File(['img'], 'ATTO (Amazon Tall Tower Observatory).jpg', { type: 'image/jpeg' }),
  ]);
  expect(unmatched).toHaveLength(0);
  expect(pendingRefs(items[0] as never)).toHaveLength(0);
  expect(isRefSatisfied(items[0] as never, items[0].fileRefs[0])).toBe(true);

  expect(buildContents(items[0].files)).toBe('ATTO (Amazon Tall Tower Observatory).jpg\tbundle:THUMBNAIL\n');
});

it('las columnas id se ignoran y collection se mapea', () => {
  expect(classifyHeader('id').kind).toBe('ignore');
  expect(classifyHeader('collection').kind).toBe('collections');
  expect(classifyHeader('collections').kind).toBe('collections');
});