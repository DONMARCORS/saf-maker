import { expect, it } from 'vitest';
import { escapeXml } from './xml';

it('escapa los caracteres XML', () => {
  expect(escapeXml('A & B < C > D " E \' F')).toBe('A &amp; B &lt; C &gt; D &quot; E &apos; F');
});

it('deja textos normales iguales', () => {
  expect(escapeXml('hola mundo 123')).toBe('hola mundo 123');
});

it('escapa URLs con ampersands', () => {
  expect(escapeXml('https://x.test/a?b=1&c=2')).toBe('https://x.test/a?b=1&amp;c=2');
});