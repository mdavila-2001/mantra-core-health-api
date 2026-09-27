import { toE164 } from './phone-e164';

/**
 * Tres niveles: lo que debe normalizar (correcto), los bordes del contrato
 * E.164 y del número boliviano (límite), y lo que debe rechazar sin adivinar
 * (inválido).
 */
describe('toE164', () => {
  describe('correcto', () => {
    it.each([
      ['71234567', '+59171234567'],
      ['7123 4567', '+59171234567'],
      ['(2) 2123456', '+59122123456'],
      ['+591 71234567', '+59171234567'],
      ['+591-7-123-4567', '+59171234567'],
      ['0059171234567', '+59171234567'],
      ['59171234567', '+59171234567'],
      ['+54 9 11 2345 6789', '+5491123456789'],
    ])('%s → %s', (entrada, esperado) => {
      expect(toE164(entrada)).toBe(esperado);
    });
  });

  describe('límite', () => {
    it('acepta el E.164 más largo (15 dígitos) y rechaza 16', () => {
      expect(toE164('+123456789012345')).toBe('+123456789012345');
      expect(toE164('+1234567890123456')).toBeNull();
    });

    it('acepta 8 dígitos tras el + y rechaza 7', () => {
      expect(toE164('+12345678')).toBe('+12345678');
      expect(toE164('+1234567')).toBeNull();
    });

    it('un nacional boliviano tiene exactamente 8 dígitos', () => {
      expect(toE164('7123456')).toBeNull();
      expect(toE164('712345678')).toBeNull();
    });

    it('con +591 exige además un nacional boliviano válido', () => {
      expect(toE164('+591 7123456')).toBeNull();
      expect(toE164('+591 81234567')).toBeNull();
    });

    it('recorta espacios alrededor', () => {
      expect(toE164('  71234567  ')).toBe('+59171234567');
    });
  });

  describe('inválido', () => {
    it.each([
      [undefined],
      [null],
      [''],
      ['   '],
      ['abc'],
      ['7123456a'],
      ['+0591712345678'],
      ['++59171234567'],
      ['81234567'],
      ['11234567'],
    ])('%p → null', (entrada) => {
      expect(toE164(entrada as string | null | undefined)).toBeNull();
    });
  });
});
