import { expect, it } from 'vitest';
import JSZip from 'jszip';
import type { Item } from '../types';
import { buildSchemaXml, buildContents, itemFolderEntries } from './saf';
import { buildSafZip } from './zip';
import { buildExportZip } from './export';

function makeItem(over: Partial<Item> = {}): Item {
  return {
    key: 0,
    csvRow: 2,
    metadata: [
      { schema: 'dc', element: 'title', qualifier: null, value: 'A & B <C>' },
      { schema: 'dc', element: 'description', qualifier: 'abstract', value: 'Resumen' },
      { schema: 'etd', element: 'degree', qualifier: 'level', value: 'Maestría' },
    ],
    fileRefs: [],
    files: [
      { id: 'a', name: 'doc.pdf', blob: new Blob(['pdf-data'], { type: 'application/pdf' }), bundle: 'ORIGINAL' },
      { id: 'b', name: 'doc.pdf.jpg', blob: new Blob(['jpg-data'], { type: 'image/jpeg' }), bundle: 'THUMBNAIL' },
    ],
    collections: ['123456789/1'],
    handle: '',
    ...over,
  };
}

it('genera dublin_core.xml correcto', () => {
  const xml = buildSchemaXml('dc', [
    { schema: 'dc', element: 'title', qualifier: null, value: 'A & B <C>' },
    { schema: 'dc', element: 'title', qualifier: 'alternative', value: 'Alt', language: 'fr' },
  ]);
  expect(xml).toContain('<dublin_core schema="dc">');
  expect(xml).toContain('<dcvalue element="title" qualifier="none">A &amp; B &lt;C&gt;</dcvalue>');
  expect(xml).toContain('<dcvalue element="title" qualifier="alternative" language="fr">Alt</dcvalue>');
});

it('genera metadata de esquema propio', () => {
  const xml = buildSchemaXml('etd', [{ schema: 'etd', element: 'degree', qualifier: 'level', value: 'M' }]);
  expect(xml).toContain('<dublin_core schema="etd">');
});

it('genera el contents con el bundle THUMBNAIL', () => {
  const contents = buildContents(makeItem().files);
  expect(contents.split('\n')).toEqual(['doc.pdf', 'doc.pdf.jpg\tbundle:THUMBNAIL', '']);
});

it('soporta description y primary en contents', () => {
  const contents = buildContents([
    { id: 'a', name: 'f1.jpg', blob: new Blob(['x']), bundle: 'ORIGINAL', description: 'La portada', primary: true },
  ]);
  expect(contents).toContain('f1.jpg\tdescription:La portada\tprimary:true');
});

it('construye un ZIP SAF válido descomprimible', async () => {
  const item = makeItem();
  const { dir, entries } = itemFolderEntries(item, 0, 'item_', 3);
  expect(dir).toBe('item_000');

  const blob = await buildSafZip([{ dir, entries }]);
  const zip = await JSZip.loadAsync(blob);

  const names = Object.keys(zip.files);
  expect(names).toContain('item_000/dublin_core.xml');
  expect(names).toContain('item_000/metadata_etd.xml');
  expect(names).toContain('item_000/contents');
  expect(names).toContain('item_000/collections');
  expect(names).toContain('item_000/doc.pdf');
  expect(names).toContain('item_000/doc.pdf.jpg');

  const contents = await zip.file('item_000/contents')!.async('text');
  expect(contents).toBe('doc.pdf\ndoc.pdf.jpg\tbundle:THUMBNAIL\n');

  const dc = await zip.file('item_000/dublin_core.xml')!.async('text');
  expect(dc).toContain('A &amp; B &lt;C&gt;');

await expect(zip.file('item_000/doc.pdf')!.async('text')).resolves.toBe('pdf-data');
});

it('exporta con buildExportZip manteniendo estructura', async () => {
  const item = makeItem();
  const { blob, stats } = await buildExportZip([item, makeItem({ key: 1, csvRow: 3 })], {
    prefix: 'item_',
    digits: 3,
    multiSep: '||',
    autoThumbs: false,
    thumbMax: 360,
  });
  expect(stats.items).toBe(2);
  const zip = await JSZip.loadAsync(blob);
  expect(Object.keys(zip.files)).toContain('item_001/dublin_core.xml');
});