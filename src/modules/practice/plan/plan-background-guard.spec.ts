import { makePngForTest } from './plan-background-guard.testing';
import { verifyBackgroundBytes } from './plan-background-guard';

describe('verifyBackgroundBytes · el tipo sale del contenido, nunca de lo declarado', () => {
  it('acepta un PNG y devuelve el tipo real y las dimensiones', () => {
    expect(verifyBackgroundBytes(makePngForTest(120, 80))).toEqual({
      mimeType: 'image/png',
      width: 120,
      height: 80,
    });
  });

  it.each([
    ['HTML con script', '<!doctype html><script>alert(document.cookie)</script>'],
    ['SVG con script', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['JavaScript', 'fetch("/steal?c="+document.cookie)'],
    ['texto vacío de firma', ''],
  ])('rechaza %s aunque se haya subido como image/png', (_name, body) => {
    expect(() => verifyBackgroundBytes(Buffer.from(body))).toThrow(
      expect.objectContaining({ status: 422 }),
    );
  });

  it('rechaza un GIF (imagen válida pero fuera de la lista cerrada)', () => {
    expect(() =>
      verifyBackgroundBytes(Buffer.from('GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'latin1')),
    ).toThrow(expect.objectContaining({ status: 422 }));
  });

  it('rechaza un PNG con la cabecera truncada (sin dimensiones legibles)', () => {
    const cortado = makePngForTest(10, 10).subarray(0, 14);
    expect(() => verifyBackgroundBytes(cortado)).toThrow(
      expect.objectContaining({ status: 422 }),
    );
  });
});
