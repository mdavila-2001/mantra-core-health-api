import { parseResourceIds } from './scheduling-bookings.controller';

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('parseResourceIds (TX-27)', () => {
  it('sin el parámetro no hay filtro', () => {
    expect(parseResourceIds(undefined)).toBeUndefined();
  });

  it('separa por coma, recorta espacios y quita repetidos', () => {
    expect(parseResourceIds(` ${uuid(1)},${uuid(2)} ,${uuid(1)}`)).toEqual([
      uuid(1),
      uuid(2),
    ]);
  });

  it.each([
    ['vacío', ' , '],
    ['un valor que no es uuid', `${uuid(1)},no-es-uuid`],
    ['más de 20', Array.from({ length: 21 }, (_, i) => uuid(i)).join(',')],
  ])('400 con %s', (_label, raw) => {
    expect(() => parseResourceIds(raw)).toThrow(
      'resourceIds debe traer entre 1 y 20 uuid',
    );
  });
});
