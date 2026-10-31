import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { QUALITY_RULES } from '../domain/catalog/governance-insights';
import type { CatalogInsightsRepository } from '../infrastructure/repositories/catalog-insights.repository';
import { CatalogInsightsService } from './catalog-insights.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** DOBLE del repositorio: la consulta real contra PostgreSQL no se ejerce en esta suite. */
function armar() {
  const repo: Record<string, any> = {
    piiColumns: mockFn(async () => []),
    piiBySensitivity: mockFn(async () => []),
    piiTotals: mockFn(async () => ({
      observed_columns: 100,
      classified_columns: 40,
      personal_columns: 12,
      objects_with_personal: 5,
    })),
    registryTotals: mockFn(async () => ({
      entities: 3,
      entities_personal: 2,
      fields: 9,
      fields_personal: 4,
    })),
    qualityIssues: mockFn(async () => []),
    qualityCounts: mockFn(async () => []),
  };
  const em = { fork: () => em } as unknown as EntityManager;
  return {
    repo,
    service: new CatalogInsightsService(
      em,
      repo as unknown as CatalogInsightsRepository,
    ),
  };
}

const COL = '00000000-0000-4000-8000-0000000000c1';
const OBJ = '00000000-0000-4000-8000-0000000000a1';

const filaPii = (extra: Record<string, unknown> = {}) => ({
  column_id: COL,
  object_id: OBJ,
  schema_name: 'iam',
  object_name: 'users',
  column_name: 'email',
  native_type: 'varchar',
  sensitivity: 'PHI_IDENTIFIER',
  review_status: 'AUTO_DETECTED',
  origin: 'AUTO_CLASSIFIER',
  approved: false,
  registry_marks_personal: null,
  rk: -6,
  ...extra,
});

describe('CatalogInsightsService.piiSummary', () => {
  it('ordena los niveles de más a menos sensible y devuelve las cifras del servidor', async () => {
    const { service, repo } = armar();
    repo.piiBySensitivity.mockResolvedValue([
      {
        sensitivity: 'INTERNAL',
        columns: 50,
        approved: 0,
        needs_review: 0,
        auto_detected: 0,
        other: 0,
      },
      {
        sensitivity: 'CREDENTIAL',
        columns: 2,
        approved: 1,
        needs_review: 1,
        auto_detected: 0,
        other: 0,
      },
      {
        sensitivity: 'PERSONAL',
        columns: 10,
        approved: 0,
        needs_review: 3,
        auto_detected: 7,
        other: 0,
      },
    ]);
    const r = await service.piiSummary();
    expect(r.bySensitivity.map((n) => n.sensitivity)).toEqual([
      'CREDENTIAL',
      'PERSONAL',
      'INTERNAL',
    ]);
    expect(r).toMatchObject({
      observedColumns: 100,
      classifiedColumns: 40,
      personalColumns: 12,
      objectsWithPersonalColumns: 5,
      declaredRegistry: {
        entities: 3,
        entitiesPersonal: 2,
        fields: 9,
        fieldsPersonal: 4,
      },
    });
  });

  it('declara en notMeasured el registro de campos vacío y la falta de escaneo; nunca lo inventa', async () => {
    const { service, repo } = armar();
    repo.piiTotals.mockResolvedValue({
      observed_columns: 0,
      classified_columns: 0,
      personal_columns: 0,
      objects_with_personal: 0,
    });
    repo.registryTotals.mockResolvedValue({
      entities: 0,
      entities_personal: 0,
      fields: 0,
      fields_personal: 0,
    });
    const r = await service.piiSummary();
    expect(r.notMeasured.map((n) => n.field)).toEqual([
      'catalog',
      'declaredRegistry.fields',
      'dataValues',
    ]);
    expect(r.bySensitivity).toEqual([]);
    expect(r.personalColumns).toBe(0);
  });

  it('con registro y escaneo sólo queda declarado que no se leen valores', async () => {
    const { service } = armar();
    expect(
      (await service.piiSummary()).notMeasured.map((n) => n.field),
    ).toEqual(['dataValues']);
  });
});

describe('CatalogInsightsService.piiColumns', () => {
  it('por omisión pide PERSONAL o superior, orden por nombre y 50 por página', async () => {
    const { service, repo } = armar();
    await service.piiColumns({});
    expect(repo.piiColumns.mock.calls[0][1]).toMatchObject({
      minRank: 5,
      sort: 'name',
      limit: 50,
      cursor: undefined,
    });
  });

  it('pedir PSEUDONYMIZED baja el mínimo de la escala', async () => {
    const { service, repo } = armar();
    await service.piiColumns({ minSensitivity: 'PSEUDONYMIZED' });
    expect(repo.piiColumns.mock.calls[0][1].minRank).toBe(4);
  });

  it('sólo expone los campos del contrato aunque la fila traiga más', async () => {
    const { service, repo } = armar();
    repo.piiColumns.mockResolvedValue([
      filaPii({
        sample_value: 'ana@example.com',
        column_comment: 'texto libre',
        definition: 'x',
      }),
    ]);
    const r = await service.piiColumns({});
    expect(Object.keys(r.items[0]).sort()).toEqual(
      [
        'approved',
        'columnId',
        'columnName',
        'nativeType',
        'objectId',
        'objectName',
        'origin',
        'registryMarksPersonal',
        'reviewStatus',
        'schemaName',
        'sensitivity',
      ].sort(),
    );
    expect(JSON.stringify(r)).not.toContain('ana@example.com');
    expect(r.items[0].registryMarksPersonal).toBeNull();
  });

  it('pagina: pide limit+1, recorta y emite un cursor que el mismo orden acepta', async () => {
    const { service, repo } = armar();
    repo.piiColumns.mockResolvedValue([
      filaPii({ column_name: 'a' }),
      filaPii({ column_name: 'b' }),
      filaPii({ column_name: 'c' }),
    ]);
    const p1 = await service.piiColumns({ limit: 2 });
    expect(p1.items.map((i) => i.columnName)).toEqual(['a', 'b']);
    expect(p1.nextCursor).toEqual(expect.any(String));
    await service.piiColumns({ limit: 2, cursor: p1.nextCursor as string });
    expect(repo.piiColumns.mock.calls[1][1].cursor).toEqual({
      rk: undefined,
      s: 'iam',
      o: 'users',
      c: 'b',
    });
  });

  it('última página: sin cursor', async () => {
    const { service, repo } = armar();
    repo.piiColumns.mockResolvedValue([filaPii()]);
    expect((await service.piiColumns({ limit: 2 })).nextCursor).toBeNull();
  });

  it('el cursor del orden por sensibilidad lleva la posición y no sirve para el orden por nombre', async () => {
    const { service, repo } = armar();
    repo.piiColumns.mockResolvedValue([
      filaPii(),
      filaPii({ column_name: 'z' }),
    ]);
    const p1 = await service.piiColumns({ limit: 1, sort: 'sensitivity' });
    await service.piiColumns({
      limit: 1,
      sort: 'sensitivity',
      cursor: p1.nextCursor as string,
    });
    expect(repo.piiColumns.mock.calls[1][1].cursor).toMatchObject({ rk: -6 });
    await expect(
      service.piiColumns({ sort: 'name', cursor: p1.nextCursor as string }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['sin la clave de columna', encodeKeysetCursor({ m: 'n', s: 'a', o: 'b' })],
    [
      'con tipos que no son texto',
      encodeKeysetCursor({ m: 'n', s: 1, o: 2, c: 3 }),
    ],
    [
      'con el orden por sensibilidad sin posición',
      encodeKeysetCursor({ m: 's', s: 'a', o: 'b', c: 'c' }),
    ],
  ])('un cursor %s es un 400, no un 500', async (_caso, cursor) => {
    const { service } = armar();
    await expect(
      service.piiColumns({ sort: 'name', cursor }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.piiColumns({ sort: 'sensitivity', cursor }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un cursor que no es base64url de un objeto es un 400', async () => {
    const { service } = armar();
    await expect(service.piiColumns({ cursor: '%%%' })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('CatalogInsightsService.quality', () => {
  it('las reglas salen de la tabla declarativa, con sus incidencias abiertas', async () => {
    const { service, repo } = armar();
    repo.qualityCounts.mockResolvedValue([
      { rule_code: 'CAT-PII-UNREVIEWED', severity: 'HIGH', issues: 7 },
    ]);
    const r = await service.qualityRules();
    expect(r.rules.map((x) => x.code)).toEqual(
      QUALITY_RULES.map((x) => x.code),
    );
    expect(
      r.rules.find((x) => x.code === 'CAT-PII-UNREVIEWED')?.openIssues,
    ).toBe(7);
    expect(
      r.rules.find((x) => x.code === 'CAT-OBJECT-NO-ANNOTATION')?.openIssues,
    ).toBe(0);
    expect(r.notMeasured[0].field).toBe('dataValueQuality');
  });

  it('el resumen cuenta con los filtros pero sin paginar y viene con todas las claves', async () => {
    const { service, repo } = armar();
    repo.qualityCounts.mockResolvedValue([
      { rule_code: 'CAT-PII-UNREVIEWED', severity: 'HIGH', issues: 3 },
      { rule_code: 'CAT-OBJECT-NO-ANNOTATION', severity: 'LOW', issues: 4 },
    ]);
    const r = await service.qualityIssues({ severity: 'HIGH', limit: 10 });
    expect(r.summary).toEqual({
      total: 7,
      bySeverity: { HIGH: 3, MEDIUM: 0, LOW: 4 },
      byRule: {
        'CAT-PII-UNREVIEWED': 3,
        'CAT-PII-NO-OWNER': 0,
        'CAT-OBJECT-NOT-OBSERVED': 0,
        'CAT-OBJECT-NO-ANNOTATION': 4,
      },
    });
    expect(repo.qualityCounts.mock.calls[0][1]).toEqual({
      rule: undefined,
      severity: 'HIGH',
      schema: undefined,
      q: undefined,
    });
    expect(r.derived).toBe(true);
    expect(r.notMeasured[0].field).toBe('resolutionState');
  });

  it('pagina con la clave (regla, schema, objeto, columna) y trata la columna nula como vacía', async () => {
    const { service, repo } = armar();
    const fila = (o: string) => ({
      rule_code: 'CAT-OBJECT-NO-ANNOTATION',
      severity: 'LOW',
      schema_name: 'iam',
      object_name: o,
      column_name: null,
      object_id: OBJ,
      column_id: null,
      sensitivity: null,
      review_status: null,
      affected: 0,
    });
    repo.qualityIssues.mockResolvedValue([fila('a'), fila('b')]);
    const p = await service.qualityIssues({ limit: 1 });
    expect(p.items).toHaveLength(1);
    await service.qualityIssues({ limit: 1, cursor: p.nextCursor as string });
    expect(repo.qualityIssues.mock.calls[1][1].cursor).toEqual({
      r: 'CAT-OBJECT-NO-ANNOTATION',
      s: 'iam',
      o: 'a',
      c: '',
    });
  });

  it('un cursor mal formado es un 400', async () => {
    const { service } = armar();
    await expect(
      service.qualityIssues({ cursor: encodeKeysetCursor({ r: 'x' }) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
