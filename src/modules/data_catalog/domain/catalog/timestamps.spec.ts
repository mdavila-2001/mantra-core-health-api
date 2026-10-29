import { iso, isoOrNull } from './timestamps';

describe('fechas que salen por la API', () => {
  it.each([
    ['2026-10-21 15:02:26.892+00', '2026-10-21T15:02:26.892Z'],
    ['2026-10-21 15:02:26+00', '2026-10-21T15:02:26.000Z'],
    ['2026-10-21 15:06:56.526993+00', '2026-10-21T15:06:56.526Z'],
    ['2026-10-21 12:02:26.5-03', '2026-10-21T15:02:26.500Z'],
    ['2026-10-21 20:32:26+05:30', '2026-10-21T15:02:26.000Z'],
    ['2026-10-21T15:02:26.892Z', '2026-10-21T15:02:26.892Z'],
  ])('%s → %s', (entrada, esperado) => {
    expect(iso(entrada)).toBe(esperado);
  });

  it('acepta un Date y lo deja en ISO', () => {
    expect(iso(new Date('2026-10-21T15:02:26.892Z'))).toBe(
      '2026-10-21T15:02:26.892Z',
    );
  });

  it('null y undefined siguen siendo null', () => {
    expect(isoOrNull(null)).toBeNull();
    expect(isoOrNull(undefined)).toBeNull();
    expect(isoOrNull('2026-10-21 15:02:26+00')).toBe(
      '2026-10-21T15:02:26.000Z',
    );
  });

  it.each(['', 'ayer', '2026-13-45 99:99:99+00', '21/10/2026'])(
    'un valor que no es fecha (%p) falla en voz alta en vez de salir como basura',
    (basura) => {
      expect(() => iso(basura)).toThrow(TypeError);
    },
  );
});
