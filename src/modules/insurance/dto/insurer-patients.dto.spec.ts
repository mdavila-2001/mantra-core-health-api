import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InsurerPatientSearchQueryDto } from './insurer-patients.dto';

/**
 * Filtros del directorio de pacientes de la aseguradora, validados con las
 * opciones del `ValidationPipe` global (`forbidNonWhitelisted`). Los query
 * params llegan como texto, por eso `limit` va en string.
 */
async function propiedadesConError(
  query: Record<string, unknown>,
): Promise<string[]> {
  const errores = await validate(
    plainToInstance(InsurerPatientSearchQueryDto, query),
    { whitelist: true, forbidNonWhitelisted: true },
  );
  return [...new Set(errores.map((e) => e.property))].sort();
}

const UUID = '22222222-2222-4222-8222-222222222222';

describe('InsurerPatientSearchQueryDto', () => {
  it('acepta la combinación completa de filtros', async () => {
    expect(
      await propiedadesConError({
        limit: '25',
        search: 'Pérez',
        genderConceptId: UUID,
        occupation: 'Arquitectura',
        insuranceCarrierId: UUID,
        birthDateFrom: '1980-01-01',
        birthDateTo: '1999-12-31',
        insuranceStatus: 'NO_INSURANCE',
        sortBy: 'birthDate',
        sortDirection: 'desc',
      }),
    ).toEqual([]);
  });

  it('sólo ofrece páginas de 10, 25 o 50', async () => {
    expect(await propiedadesConError({ limit: '7' })).toEqual(['limit']);
    expect(await propiedadesConError({ limit: '500' })).toEqual(['limit']);
  });

  it('rechaza conceptos que no son uuid, fechas inválidas y valores fuera de la lista', async () => {
    expect(
      await propiedadesConError({
        genderConceptId: 'F',
        birthDateFrom: '01/01/1980',
        insuranceStatus: 'MAYBE',
        sortBy: 'insuranceName',
        sortDirection: 'up',
      }),
    ).toEqual([
      'birthDateFrom',
      'genderConceptId',
      'insuranceStatus',
      'sortBy',
      'sortDirection',
    ]);
  });

  it('no deja elegir la aseguradora desde la petición', async () => {
    expect(await propiedadesConError({ insuranceCompanyId: UUID })).toEqual([
      'insuranceCompanyId',
    ]);
  });
});
