import { jest } from '@jest/globals';
import { CONCEPTS } from '../../constants/concepts';
import catalogJson from '../../../modules/system_ops/mutability/data/mutability.catalog.json';
import type { MutabilityCatalog } from '../../../modules/system_ops/mutability/mutability.types';
import { MutabilityRegistrySeedService } from './mutability-registry-seed.service';
import {
  assertable,
  entityRegistryId,
  planMutabilitySeed,
  type SeedExisting,
} from './mutability-registry.plan';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const catalog = catalogJson as unknown as MutabilityCatalog;
const find = (schema: string, table: string) =>
  catalog.records.find((r) => r.schema === schema && r.table === table)!;

type Row = Record<string, any>;

/**
 * Doble declarado de la base: un EntityManager EN MEMORIA que guarda lo que se crea y lo devuelve en
 * las búsquedas. NO es Postgres: prueba la lógica de idempotencia del sembrador, no las FK ni los
 * índices reales (eso queda pendiente contra una base viva).
 */
function memory(
  opts: { conceptsPresent?: boolean; preloaded?: Record<string, Row[]> } = {},
) {
  const store: Record<string, Row[]> = {
    EntityRegistry: [],
    WritePolicies: [],
    SystemOpsRetentionPolicies: [],
    GovernanceChangeLog: [],
    ...opts.preloaded,
  };
  let flushes = 0;
  const em = {
    find: mockFn((entity: any, where: any) => {
      if (entity.name === 'CatalogConcepts') {
        const ids: string[] = where?.id?.$in ?? [];
        return Promise.resolve(
          opts.conceptsPresent === false ? [] : ids.map((id) => ({ id })),
        );
      }
      const rows = store[entity.name] ?? [];
      const like: string | undefined = where?.code?.$like;
      if (!like) return Promise.resolve(rows);
      const prefix = like.replace(/\\/g, '').replace(/%$/, '');
      return Promise.resolve(
        rows.filter((r) => String(r.code).startsWith(prefix)),
      );
    }),
    findOne: mockFn(() => Promise.resolve({ id: 'seed-actor' })),
    create: mockFn((entity: any, data: Row) => {
      (store[entity.name] ??= []).push({ ...data });
      return data;
    }),
    flush: mockFn(() => {
      flushes += 1;
      return Promise.resolve();
    }),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MutabilityRegistrySeedService(
    orm as never,
    logger as never,
  );
  return { service, em, store, logger, flushes: () => flushes };
}

describe('MutabilityRegistrySeedService — primera corrida', () => {
  it('registra TODAS las tablas del catálogo, con ids estables y un rastro por alta', async () => {
    const { service, store } = memory();
    const result = await service.run();

    expect(result.missingConcepts).toEqual([]);
    expect(result.entities).toBe(catalog.records.length);
    expect(store.EntityRegistry).toHaveLength(catalog.records.length);
    const ids = new Set(store.EntityRegistry.map((e) => e.id));
    expect(ids.size).toBe(catalog.records.length);
    expect(
      store.EntityRegistry.find(
        (e) => e.schemaName === 'audit' && e.tableName === 'audit_log',
      )!.id,
    ).toBe(entityRegistryId('audit', 'audit_log'));
    // un rastro de gobierno por cada fila creada (entidades + políticas)
    expect(store.GovernanceChangeLog).toHaveLength(
      result.entities + result.writePolicies + result.retentionPolicies,
    );
    const trace = store.GovernanceChangeLog.find(
      (l) => l.targetType === 'entity_registry',
    )!;
    expect(trace.newSnapshotJson).toMatchObject({
      catalogClass: 'DERIVADO',
      source: expect.stringContaining('mutability.catalog.json'),
    });
  });

  it('sólo afirma lo que la evidencia sostiene: sin evidencia no hay política ni flags', async () => {
    const { service, store } = memory();
    await service.run();
    const byKey = (s: string, t: string) =>
      store.EntityRegistry.find(
        (e) => e.schemaName === s && e.tableName === t,
      )!;

    // barrera física → append-only con política
    const auditLog = byKey('audit', 'audit_log');
    expect(auditLog.isAppendOnly).toBe(true);
    expect(auditLog.writePolicyId).toBeDefined();

    // contradicción → el registro no elige bando: ni flag ni política
    const contested = byKey('chart', 'clinical_note_versions');
    expect(
      find('chart', 'clinical_note_versions').findings.some(
        (f) => f.kind === 'CONTRADICTION',
      ),
    ).toBe(true);
    expect(contested.isAppendOnly).toBe(false);
    expect(contested.writePolicyId).toBeUndefined();

    // UNKNOWN → registrada, sin política
    const unknown = catalog.records.find((r) => r.writeMode === 'UNKNOWN')!;
    const row = byKey(unknown.schema, unknown.table);
    expect(row.writePolicyId).toBeUndefined();
    expect(row.isAppendOnly).toBe(false);

    // INFERRED nunca produce política
    const inferred = catalog.records.find(
      (r) => r.writeModeLevel === 'INFERRED',
    )!;
    expect(
      byKey(inferred.schema, inferred.table).writePolicyId,
    ).toBeUndefined();
    expect(assertable(inferred)).toBe(false);
  });

  it('la evidencia de identidad NO queda append-only (el ciclo de purga la rechazaría) y queda ACTIVE', async () => {
    const { service, store } = memory();
    await service.run();
    const row = store.EntityRegistry.find(
      (e) =>
        e.schemaName === 'identity_assurance' &&
        e.tableName === 'identity_evidence_records',
    )!;
    expect(row.isAppendOnly).toBe(false);
    expect(row.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
    expect(row.id).toBe(
      entityRegistryId('identity_assurance', 'identity_evidence_records'),
    );
  });

  it('retención: plazos sólo los declarados por el modelo, en DRAFT y sin base legal ni jurisdicción', async () => {
    const { service, store } = memory();
    await service.run();
    const policies = store.SystemOpsRetentionPolicies;
    expect(policies.length).toBeGreaterThan(0);
    for (const p of policies) {
      expect(p.code).toMatch(/^MUT_RET_PURGE_/);
      expect(p.name).toContain('PENDIENTE_DE_CUMPLIMIENTO');
      expect(p.legalBasisConceptId).toBeUndefined();
      expect(p.jurisdictionConceptId).toBeUndefined();
      expect(p.stateConceptId).not.toBe(CONCEPTS.STATE_ACTIVE);
    }
    const declared = new Set(
      catalog.records.flatMap((r) =>
        r.retention?.days != null ? [r.retention.days] : [],
      ),
    );
    const seededDays = new Set(
      policies.flatMap((p) =>
        p.retentionPeriodDays ? [p.retentionPeriodDays] : [],
      ),
    );
    expect(seededDays).toEqual(declared);
    expect(
      policies.some(
        (p) =>
          p.code === 'MUT_RET_PURGE_SIN_PLAZO' &&
          p.retentionPeriodDays === undefined,
      ),
    ).toBe(true);
  });

  it('no siembra legal holds ni hace nada destructivo', async () => {
    const { service, store, em } = memory();
    await service.run();
    expect(Object.keys(store)).not.toContain('LegalHolds');
    expect(em.create.mock.calls.map((c: any[]) => c[0].name)).not.toContain(
      'LegalHolds',
    );
    expect((em as any).nativeDelete).toBeUndefined();
    expect((em as any).remove).toBeUndefined();
  });
});

describe('MutabilityRegistrySeedService — segunda corrida', () => {
  it('no inserta ni modifica nada', async () => {
    const { service, store, em } = memory();
    const first = await service.run();
    expect(first.entities).toBeGreaterThan(0);

    const before = JSON.stringify(store);
    const createdBefore = em.create.mock.calls.length;
    const second = await service.run();

    expect(second).toEqual({
      writePolicies: 0,
      retentionPolicies: 0,
      entities: 0,
      changeLog: 0,
      unchanged: catalog.records.length,
      drift: 0,
      missingConcepts: [],
    });
    expect(em.create.mock.calls.length).toBe(createdBefore);
    expect(JSON.stringify(store)).toBe(before);
  });

  it('una tabla ya registrada por la API con OTRO id se respeta: no se duplica ni se pisa', async () => {
    const preloaded = {
      EntityRegistry: [
        {
          id: 'id-puesto-por-la-api',
          schemaName: 'identity_assurance',
          tableName: 'identity_evidence_records',
          isAppendOnly: false,
          isSoftDelete: false,
          writePolicyId: undefined,
          retentionPolicyId: undefined,
        },
      ],
    };
    const { service, store } = memory({ preloaded });
    const result = await service.run();
    const rows = store.EntityRegistry.filter(
      (e) =>
        e.schemaName === 'identity_assurance' &&
        e.tableName === 'identity_evidence_records',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('id-puesto-por-la-api');
    expect(result.entities).toBe(catalog.records.length - 1);
    // la diferencia con lo derivado (hoy tendría política de retención) se informa, no se corrige
    expect(result.drift).toBeGreaterThan(0);
    expect(rows[0].retentionPolicyId).toBeUndefined();
  });

  it('si faltan los conceptos de system_ops no siembra nada y lo dice', async () => {
    const { service, store, logger } = memory({ conceptsPresent: false });
    const result = await service.run();
    expect(result.missingConcepts.length).toBeGreaterThan(0);
    expect(
      result.entities + result.writePolicies + result.retentionPolicies,
    ).toBe(0);
    expect(store.EntityRegistry).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('planMutabilitySeed', () => {
  const empty = (): SeedExisting => ({
    entities: new Map(),
    writePolicyCodes: new Set(),
    retentionPolicyCodes: new Set(),
  });

  it('con todo ya existente el plan es vacío', () => {
    const first = planMutabilitySeed(catalog.records, empty());
    const existing: SeedExisting = {
      entities: new Map(
        first.entities.map((e) => [
          `${e.schemaName}.${e.tableName}`,
          {
            id: e.id,
            count: 1,
            isAppendOnly: e.isAppendOnly,
            isSoftDelete: e.isSoftDelete,
            hasWritePolicy: e.writePolicyCode !== null,
            hasRetentionPolicy: e.retentionPolicyCode !== null,
          },
        ]),
      ),
      writePolicyCodes: new Set(first.writePolicies.map((p) => p.code)),
      retentionPolicyCodes: new Set(first.retentionPolicies.map((p) => p.code)),
    };
    const second = planMutabilitySeed(catalog.records, existing);
    expect(second.entities).toEqual([]);
    expect(second.writePolicies).toEqual([]);
    expect(second.retentionPolicies).toEqual([]);
    expect(second.drift).toEqual([]);
    expect(second.unchanged).toBe(catalog.records.length);
  });

  it('informa filas duplicadas del registro (el modelo no tiene índice único)', () => {
    const plan = planMutabilitySeed([find('audit', 'audit_log')], {
      ...empty(),
      entities: new Map([
        [
          'audit.audit_log',
          {
            id: 'a',
            count: 2,
            isAppendOnly: true,
            isSoftDelete: false,
            hasWritePolicy: true,
            hasRetentionPolicy: false,
          },
        ],
      ]),
    });
    expect(plan.drift.map((d) => d.reason).join('\n')).toContain('2 filas');
  });
});
