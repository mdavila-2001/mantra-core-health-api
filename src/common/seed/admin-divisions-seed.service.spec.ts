import { jest } from '@jest/globals';

import { AdminDivisionsSeedService } from './admin-divisions-seed.service';
import {
  ADMIN_DIVISION_VALUE_SET,
  adminDivisionValueSetId,
  adminDivisionVersionId,
  allAdminDivisions,
  boProvinceConceptId,
} from './admin-divisions.catalog';
import {
  boDepartmentConceptId,
  boMunicipalityConceptId,
} from './bo-geography.catalog';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El sembrador contra un `em` en memoria, con el mismo patrón que
 * `bo-geography-seed.service.spec.ts`: responde `find`/`findOne`/`create`/
 * `flush` sin una base real. `existing` son los ids que la base ya tiene.
 */
function build(existing: Set<string> = new Set()) {
  const created: { entity: string; data: any }[] = [];
  const em = {
    find: mockFn((_entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
      );
    }),
    findOne: mockFn((entity: any) => {
      if (entity?.name === 'ValueSets') {
        return Promise.resolve(
          existing.has(adminDivisionValueSetId())
            ? { id: adminDivisionValueSetId() }
            : null,
        );
      }
      if (entity?.name === 'ValueSetVersions') {
        return Promise.resolve(
          existing.has(adminDivisionVersionId())
            ? { id: adminDivisionVersionId() }
            : null,
        );
      }
      return Promise.resolve(null);
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      existing.add(data.id);
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AdminDivisionsSeedService(orm as any, logger as any);
  return {
    service,
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
  };
}

const TODAS = allAdminDivisions().length; // 9 + 112 + 340
const PROVINCIAS = 112;
const DEPARTAMENTOS = 9;

describe('AdminDivisionsSeedService (ADR-0028)', () => {
  it('correcto: sobre una base vacía crea el conjunto, su versión vigente y el árbol', async () => {
    const { service, rowsOf } = build();

    const counters = await service.run();

    expect(counters).toEqual({
      valueSets: 1,
      versions: 1,
      // Sólo las provincias: departamentos y municipios ya los siembra
      // BoGeographySeedService con los mismos ids.
      concepts: PROVINCIAS,
      designations: PROVINCIAS,
      // País y nivel de todas; padre de todas menos los departamentos.
      properties: TODAS * 2 + (TODAS - DEPARTAMENTOS),
      memberships: TODAS,
    });
    expect(rowsOf('ValueSets')[0]).toMatchObject({
      internalCode: ADMIN_DIVISION_VALUE_SET,
    });
    expect(rowsOf('ValueSetVersions')[0]).toMatchObject({ isDefault: true });
  });

  it('correcto: la provincia nace con su nombre y apunta a su departamento', async () => {
    const { service, rowsOf } = build();
    await service.run();

    const andresIbanez = rowsOf('CatalogConcepts').find(
      (row) => row.id === boProvinceConceptId('0701'),
    );
    expect(andresIbanez).toMatchObject({
      code: 'geo:bo:province:0701',
      display: 'Andrés Ibáñez',
      selectable: true,
    });
    const padre = rowsOf('ConceptProperties').find(
      (row) =>
        row.conceptId === boProvinceConceptId('0701') &&
        row.propertyCode === 'geo:parent',
    );
    expect(padre?.valueJson).toBe(boDepartmentConceptId('SC'));
  });

  it('límite: nunca crea un concepto de departamento o municipio', async () => {
    const { service, rowsOf } = build();
    await service.run();

    const ids = new Set(rowsOf('CatalogConcepts').map((row) => row.id));
    expect(ids.has(boDepartmentConceptId('SC'))).toBe(false);
    expect(ids.has(boMunicipalityConceptId('070101'))).toBe(false);
    // Pero el municipio sí queda colgado de su provincia.
    const padre = rowsOf('ConceptProperties').find(
      (row) =>
        row.conceptId === boMunicipalityConceptId('070101') &&
        row.propertyCode === 'geo:parent',
    );
    expect(padre?.valueJson).toBe(boProvinceConceptId('0701'));
  });

  it('límite: la segunda corrida no inserta nada (idempotente)', async () => {
    const existing = new Set<string>();
    await build(existing).service.run();

    const segunda = await build(existing).service.run();

    expect(segunda).toEqual({
      valueSets: 0,
      versions: 0,
      concepts: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    });
  });

  it('límite: la expansión conserva el orden del catálogo en su ordinal', async () => {
    const { service, rowsOf } = build();
    await service.run();

    const ordinales = rowsOf('ValueSetMembers').map((row) => row.ordinal);
    expect(ordinales).toEqual([...Array(TODAS).keys()]);
    // Primero los 9 departamentos.
    expect(rowsOf('ValueSetMembers')[0].conceptId).toBe(
      boDepartmentConceptId('CH'),
    );
  });
});
