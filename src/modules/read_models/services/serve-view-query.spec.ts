import { BadRequestException } from '@nestjs/common';
import { parseServeViewQuery } from './serve-view-query';

const UUID = '55555555-5555-5555-5555-555555555555';

describe('parseServeViewQuery', () => {
  it('sin parámetros: ninguna restricción pedida y sin filtros', () => {
    expect(parseServeViewQuery(undefined)).toEqual({
      cursor: undefined,
      limit: undefined,
      sort: undefined,
      purposeOfUse: undefined,
      patientProfileId: undefined,
      filters: {},
    });
  });

  it('las claves reservadas se interpretan y el resto son filtros', () => {
    const parsed = parseServeViewQuery({
      limit: '25',
      sort: 'name_asc',
      cursor: 'a.b',
      purposeOfUse: UUID,
      patientProfileId: UUID,
      status: 'ACTIVE',
    });
    expect(parsed).toMatchObject({
      limit: 25,
      sort: 'name_asc',
      cursor: 'a.b',
      purposeOfUse: UUID,
      patientProfileId: UUID,
      filters: { status: 'ACTIVE' },
    });
  });

  it.each([
    ['limit no numérico', { limit: 'abc' }],
    ['limit cero', { limit: '0' }],
    ['limit fraccionario', { limit: '1.5' }],
    ['purposeOfUse que no es uuid', { purposeOfUse: 'TREATMENT' }],
    ['patientProfileId que no es uuid', { patientProfileId: '1 OR 1=1' }],
    ['filtro con arreglo', { status: ['a', 'b'] }],
    ['filtro con objeto', { status: { $ne: 'x' } }],
    ['filtro vacío', { status: '' }],
    ['cursor demasiado largo', { cursor: 'x'.repeat(2000) }],
  ])('rechaza %s con 400', (_name, raw) => {
    expect(() => parseServeViewQuery(raw as any)).toThrow(BadRequestException);
  });
});
