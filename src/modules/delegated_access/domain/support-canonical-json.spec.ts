import { canonicalJson, sha256Hex } from './support-canonical-json';

describe('canonicalJson · JSON canónico con claves ordenadas', () => {
  it('ordena las claves de forma recursiva y conserva el orden de las listas', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, 1, 2], c: null } })).toBe(
      '{"a":{"c":null,"d":[3,1,2]},"b":1}',
    );
  });

  it('descarta propiedades `undefined`, y en listas las vuelve null', () => {
    expect(canonicalJson({ a: undefined, b: [undefined, 1] })).toBe(
      '{"b":[null,1]}',
    );
  });

  it('serializa fechas en ISO 8601 UTC', () => {
    expect(canonicalJson({ at: new Date('2026-11-03T10:30:00-04:00') })).toBe(
      '{"at":"2026-11-03T14:30:00.000Z"}',
    );
  });

  it.each([
    ['NaN', { a: Number.NaN }],
    ['Infinity', { a: Number.POSITIVE_INFINITY }],
    ['función', { a: () => 1 }],
    ['símbolo', { a: Symbol('x') }],
    ['bigint', { a: BigInt(1) }],
  ])('rechaza un valor que no es JSON: %s', (_name, value) => {
    expect(() => canonicalJson(value)).toThrow(TypeError);
  });

  it('rechaza referencias circulares', () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(() => canonicalJson(a)).toThrow(TypeError);
  });

  it('propiedad: barajar las claves no cambia el JSON ni el hash', () => {
    const keys = ['uno', 'dos', 'tres', 'cuatro', 'cinco'];
    const base = Object.fromEntries(
      keys.map((k, i) => [k, { n: i, l: [i, `x${i}`] }]),
    );
    const expected = canonicalJson(base);
    for (let seed = 1; seed <= 50; seed += 1) {
      const shuffled = [...keys].sort(
        (a, b) =>
          ((a.charCodeAt(0) * seed) % 7) - ((b.charCodeAt(0) * seed) % 7),
      );
      const other = Object.fromEntries(shuffled.map((k) => [k, base[k]]));
      expect(canonicalJson(other)).toBe(expected);
      expect(sha256Hex(canonicalJson(other))).toBe(sha256Hex(expected));
    }
  });

  it('sha256Hex da 64 hexadecimales (vector conocido)', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
