import { jest } from '@jest/globals';
import {
  HealthChecks,
  ServiceComponents,
  ToolRegistry,
} from '../../modules/platform_ops/entities';
import { PLATFORM_OPS } from '../../modules/platform_ops/platform_ops.concepts';
import { TOOL_CATALOG } from '../../modules/platform_ops/tools/tool-catalog';
import { CONCEPTS } from '../constants/concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';
import {
  ToolRegistrySeedService,
  toolSeedIds,
} from './tool-registry-seed.service';

/**
 * DOBLE DECLARADO: `em` en memoria que imita `find`/`findOne`/`create`/`flush`
 * (patrón de `legal-entity-types-seed.service.spec.ts`). Demuestra la lógica de
 * idempotencia; NO prueba las restricciones UNIQUE/FK de la base real
 * (BLOQUEADO: requiere PostgreSQL con el DDL aplicado).
 */
function build(preload: { entity: unknown; row: any }[] = []) {
  const store = new Map<unknown, any[]>();
  for (const { entity, row } of preload) {
    store.set(entity, [...(store.get(entity) ?? []), row]);
  }
  const created: { entity: string; data: any }[] = [];
  const flushOrder: string[][] = [];
  let pending: string[] = [];
  const rows = (entity: unknown) => store.get(entity) ?? [];
  const em = {
    find: jest.fn(async (entity: any, where: any) => {
      const codes: string[] | undefined = where?.code?.$in;
      return rows(entity).filter((r) => !codes || codes.includes(r.code));
    }),
    findOne: jest.fn(
      async (entity: any, where: any) =>
        rows(entity).find((r) =>
          Object.entries(where).every(([k, v]) => r[k] === v),
        ) ?? null,
    ),
    create: jest.fn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      pending.push(entity.name);
      // Se «persiste» en el flush; aquí basta con guardarla.
      store.set(entity, [...rows(entity), data]);
      return data;
    }),
    flush: jest.fn(async () => {
      flushOrder.push(pending);
      pending = [];
    }),
  };
  const orm = { em: { fork: jest.fn(() => em) } };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new ToolRegistrySeedService(orm as never, logger as never);
  return { service, em, created, flushOrder };
}

const N = TOOL_CATALOG.length;
const ofEntity = (created: { entity: string; data: any }[], name: string) =>
  created.filter((row) => row.entity === name).map((row) => row.data);

describe('ToolRegistrySeedService', () => {
  it('primera corrida: una herramienta, un componente, un vínculo y un chequeo por entrada', async () => {
    const { service, created } = build();
    const result = await service.run();
    expect(result).toEqual({ tools: N, components: N, links: N, checks: N });
    expect(ofEntity(created, 'ToolRegistry')).toHaveLength(N);
    expect(ofEntity(created, 'ServiceComponents')).toHaveLength(N);
    expect(ofEntity(created, 'ComponentTools')).toHaveLength(N);
    expect(ofEntity(created, 'HealthChecks')).toHaveLength(N);
  });

  it('IDEMPOTENCIA: la segunda corrida no inserta nada', async () => {
    const { service, created, em } = build();
    await service.run();
    const afterFirst = created.length;
    const second = await service.run();
    expect(second).toEqual({ tools: 0, components: 0, links: 0, checks: 0 });
    expect(created).toHaveLength(afterFirst);
    expect(em.create).toHaveBeenCalledTimes(afterFirst);
  });

  it('LÍMITE: parcial (la herramienta existe, falta su componente) completa solo lo que falta', async () => {
    const postgres = TOOL_CATALOG.find((e) => e.code === 'postgresql')!;
    const ids = toolSeedIds(postgres.code);
    const { service, created } = build([
      { entity: ToolRegistry, row: { id: ids.tool, code: postgres.code } },
    ]);
    const result = await service.run();
    expect(result.tools).toBe(N - 1);
    expect(result.components).toBe(N);
    const link = ofEntity(created, 'ComponentTools').find(
      (l) => l.serviceComponentId === ids.component,
    );
    expect(link.toolId).toBe(ids.tool);
  });

  it('LÍMITE: una fila previa con el mismo código pero otro id no se duplica ni se pisa', async () => {
    const { service, created } = build([
      { entity: ToolRegistry, row: { id: 'id-manual', code: 'redis' } },
      { entity: ServiceComponents, row: { id: 'comp-manual', code: 'redis' } },
      { entity: HealthChecks, row: { id: 'chk-manual', code: 'redis' } },
    ]);
    await service.run();
    expect(
      ofEntity(created, 'ToolRegistry').filter((r) => r.code === 'redis'),
    ).toHaveLength(0);
    expect(
      ofEntity(created, 'HealthChecks').filter((r) => r.code === 'redis'),
    ).toHaveLength(0);
    // El vínculo usa los ids reales de las filas preexistentes.
    const link = ofEntity(created, 'ComponentTools').find(
      (l) => l.toolId === 'id-manual',
    );
    expect(link.serviceComponentId).toBe('comp-manual');
  });

  it('INVÁLIDO/orden: padres se persisten antes que hijos (flush por etapas)', async () => {
    const { service, flushOrder } = build();
    await service.run();
    expect(flushOrder).toHaveLength(2);
    expect(flushOrder[0]).toEqual(
      expect.arrayContaining(['ToolRegistry', 'ServiceComponents']),
    );
    expect(flushOrder[0]).not.toContain('ComponentTools');
    expect(flushOrder[0]).not.toContain('HealthChecks');
    expect(flushOrder[1]).toEqual(
      expect.arrayContaining(['ComponentTools', 'HealthChecks']),
    );
  });

  it('procedencia y criticidad quedan en el componente; el seed no escribe corridas', async () => {
    const { service, created } = build();
    await service.run();
    const components = ofEntity(created, 'ServiceComponents');
    for (const entry of TOOL_CATALOG) {
      const component = components.find((c) => c.code === entry.code);
      expect(component.description).toContain('catálogo interno');
      expect(component.description).toContain('2026-10-30');
      expect(component.description).toContain(entry.source);
      expect(component.criticalityConceptId).toBe(
        entry.isCritical
          ? PLATFORM_OPS.CRITICALITY_CRITICAL
          : PLATFORM_OPS.CRITICALITY_NON_CRITICAL,
      );
      expect(component.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
    }
    expect(created.some((row) => row.entity === 'HealthCheckRuns')).toBe(false);
  });

  it('chequeos: solo nombres de variables en target_ref; NOT_APPLICABLE no admite corridas', async () => {
    const { service, created } = build();
    await service.run();
    const checks = ofEntity(created, 'HealthChecks');
    const gmail = checks.find((c) => c.code === 'gmail-api');
    expect(gmail.targetRef).toBe(
      'GOOGLE_OAUTH_CLIENT_ID,GOOGLE_OAUTH_CLIENT_SECRET,GOOGLE_OAUTH_REFRESH_TOKEN,GOOGLE_SENDER_EMAIL',
    );
    expect(gmail.checkTypeConceptId).toBe(PLATFORM_OPS.CHECK_CONFIGURATION);
    const pg = checks.find((c) => c.code === 'postgresql');
    expect(pg).toMatchObject({
      checkTypeConceptId: PLATFORM_OPS.CHECK_LIVE,
      targetRef: 'readiness:postgresql',
      intervalSeconds: 60,
      timeoutMs: 3000,
      isEnabled: true,
    });
    const planned = checks.find((c) => c.code === 'payment-gateways');
    expect(planned.checkTypeConceptId).toBe(PLATFORM_OPS.CHECK_NOT_APPLICABLE);
    expect(planned.isEnabled).toBe(false);
  });

  it('todos los conceptos que usa están declarados en el agregador de conceptos', () => {
    const declared = new Set(MODULE_CONCEPT_SEEDS.map((s) => s.key));
    for (const name of Object.keys(PLATFORM_OPS)) {
      expect(declared.has(`platform_ops:${name}`)).toBe(true);
    }
  });
});
