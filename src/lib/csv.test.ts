import { expect, it } from 'vitest';
import { decodeCsvBuffer, detectDelimiter, parseCsv, splitValues } from './csv';

it('detecta punto y coma como delimitador', () => {
  const csv = 'dc.title;dc.date.issued\nEl libro;2020\nOtro;2021\n';
  expect(detectDelimiter(csv)).toBe(';');
});

it('detecta la coma', () => {
  const csv = 'a,b,c\n1,2,3\n4,5,6\n';
  expect(detectDelimiter(csv)).toBe(',');
});

it('decodifica UTF-8 correctamente', () => {
  const buf = new TextEncoder().encode('título,autor\nCafé,María\n').buffer;
  const { text, encoding } = decodeCsvBuffer(buf);
  expect(encoding).toBe('UTF-8');
  expect(text).toContain('título');
});

it('detecta Latin-1 cuando no es UTF-8 válido', () => {
  // 'café' como latin1 (e9 = 233)
  const bytes = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
  const { encoding } = decodeCsvBuffer(bytes.buffer as ArrayBuffer);
  expect(encoding).toBe('ISO-8859-1');
});

it('parsea cabeceras y filas', () => {
  const csv = 'dc.title,dc.description.abstract\n"Mi, titulo","Descripción 1"\nSegundo,Otro\n';
  const { headers, rows } = parseCsv(csv, ',', '||');
  expect(headers).toEqual(['dc.title', 'dc.description.abstract']);
  expect(rows).toHaveLength(2);
  expect(rows[0][0]).toBe('Mi, titulo');
  expect(rows[1][1]).toBe('Otro');
});

it('divide valores múltiples con ||', () => {
  expect(splitValues('  A  || B ||   C  ', '||')).toEqual(['A', 'B', 'C']);
  expect(splitValues('   ', '||')).toEqual([]);
});