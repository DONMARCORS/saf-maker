import { expect, it } from 'vitest';
import { parseFileRefValue, hasFileRefParams } from './refs';

it('separa el parámetro bundle: del nombre', () => {
  const ref = parseFileRefValue('ATTO (Amazon Tall Tower Observatory).jpg__bundle:THUMBNAIL');
  expect(ref.name).toBe('ATTO (Amazon Tall Tower Observatory).jpg');
  expect(ref.bundle).toBe('THUMBNAIL');
});

it('es tolerante a mayúsculas en bundle:', () => {
  const ref = parseFileRefValue('foto.png__Bundle:thumbnail');
  expect(ref.name).toBe('foto.png');
  expect(ref.bundle).toBe('THUMBNAIL');
});

it('nombre sin parámetros queda intacto', () => {
  const ref = parseFileRefValue('doc.pdf');
  expect(ref).toEqual({ name: 'doc.pdf', bundle: undefined, primary: undefined, description: undefined });
});

it('reconoce primary y description', () => {
  const ref = parseFileRefValue('f1.jpg__primary:true__description:La portada');
  expect(ref.primary).toBe(true);
  expect(ref.description).toBe('La portada');
  expect(ref.name).toBe('f1.jpg');
});

it('conserva nombres con __ que no son parámetros', () => {
  const ref = parseFileRefValue('informe__final.pdf');
  expect(ref.name).toBe('informe__final.pdf');
  expect(ref.bundle).toBeUndefined();
});

it('no interpreta parámetros desconocidos', () => {
  const ref = parseFileRefValue('a.pdf__foo:bar');
  expect(ref.name).toBe('a.pdf__foo:bar');
});

it('detecta si hay parámetros de archivo', () => {
  expect(hasFileRefParams('a.pdf')).toBe(false);
  expect(hasFileRefParams('a.pdf__bundle:TEXT')).toBe(true);
});