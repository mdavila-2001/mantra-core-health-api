import { describe, it, expect, jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { QaFlowsSeedService, loadQaFlowsEnv } from './qa-flows-seed.service';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  TestAssertions,
  TestCases,
  TestSuites,
} from '../../modules/qa_lab/entities';
import {
  casesOf,
  suiteCode,
  type FlowDefinition,
} from '../../modules/qa_lab/domain/flow-catalog';
import { FLOW_CATALOG } from '../../modules/qa_lab/domain/flows';

const ENABLED = {
  enabled: true,
  allowProduction: false,
  nodeEnv: 'development',
};

type Row = Record<string, any>;

/** `EntityManager` en memoria: lo justo para ejercitar el seed sin base. */
function build(rls = false) {
  const previous = process.env.RLS_ENFORCE;
  process.env.RLS_ENFORCE = rls ? 'true' : 'false';
  const store = new Map<unknown, Row[]>([
    [TestSuites, []],
    [TestCases, []],
    [TestAssertions, []],
  ]);
  const matches = (row: Row, where: Row) =>
    Object.entries(where).every(([key, value]) => row[key] === value);
  const execute = jest.fn((..._args: unknown[]) => Promise.resolve([]));
  const tx = {
    execute,
    flush: jest.fn(() => Promise.resolve()),
    findOne: jest.fn((entity: unknown, where: Row) =>
      Promise.resolve(
        store.get(entity)!.find((r) => matches(r, where)) ?? null,
      ),
    ),
    find: jest.fn((entity: unknown, where: Row) =>
      Promise.resolve(store.get(entity)!.filter((r) => matches(r, where))),
    ),
    create: jest.fn((entity: unknown, data: Row) => {
      const row = { id: randomUUID(), ...data };
      store.get(entity)!.push(row);
      return row;
    }),
  };
  const transactional = jest.fn((fn: (t: typeof tx) => Promise<unknown>) =>
    fn(tx),
  );
  const orm = { em: { fork: () => ({ transactional }) } } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new QaFlowsSeedService(orm, logger);
  if (previous === undefined) delete process.env.RLS_ENFORCE;
  else process.env.RLS_ENFORCE = previous;
  return { service, store, tx, transactional, logger };
}

const totalCases = FLOW_CATALOG.reduce((n, f) => n + casesOf(f).length, 0);

describe('loadQaFlowsEnv', () => {
  it('sólo el literal "true" habilita el seed y la producción', () => {
    expect(loadQaFlowsEnv({ SEED_QA_FLOWS: 'true' } as any).enabled).toBe(true);
    expect(loadQaFlowsEnv({ SEED_QA_FLOWS: '1' } as any).enabled).toBe(false);
    expect(loadQaFlowsEnv({} as any).enabled).toBe(false);
    expect(
      loadQaFlowsEnv({ SEED_QA_FLOWS_ALLOW_PRODUCTION: 'yes' } as any)
        .allowProduction,
    ).toBe(false);
  });
});

describe('QaFlowsSeedService', () => {
  it('sin SEED_QA_FLOWS no abre ni una transacción', async () => {
    const { service, transactional } = build();

    const result = await service.run({ ...ENABLED, enabled: false });

    expect(result.skipped).toBe('not-enabled');
    expect(transactional).not.toHaveBeenCalled();
  });

  it('se niega en producción sin permiso explícito, y corre con él', async () => {
    const denied = build();
    const production = { ...ENABLED, nodeEnv: 'production' };

    expect((await denied.service.run(production)).skipped).toBe(
      'production-not-allowed',
    );
    expect(denied.transactional).not.toHaveBeenCalled();
    expect(denied.logger.warn).toHaveBeenCalled();

    const allowed = build();
    const result = await allowed.service.run({
      ...production,
      allowProduction: true,
    });
    expect(result.skipped).toBeUndefined();
    expect(result.suitesCreated).toBe(FLOW_CATALOG.length);
  });

  it('crea una suite por flujo, un caso por rama con qaCase y una aserción por caso', async () => {
    const { service, store } = build();

    const result = await service.run(ENABLED);

    expect(result.suitesCreated).toBe(FLOW_CATALOG.length);
    expect(result.casesCreated).toBe(totalCases);
    expect(result.assertionsCreated).toBe(totalCases);
    expect(
      store
        .get(TestSuites)!
        .map((s) => s.code)
        .sort(),
    ).toEqual(FLOW_CATALOG.map((f) => suiteCode(f.id)).sort());
    for (const suite of store.get(TestSuites)!) {
      expect(suite.tenantId).toBe(SEED.tenantId);
      expect(suite.stateConceptId).toBe(CONCEPTS.SUITE_ACTIVE);
    }
  });

  it('un caso lleva método, ruta, estado esperado, tipo y su aserción de estado', async () => {
    const { service, store } = build();
    await service.run(ENABLED);

    const flow = FLOW_CATALOG.find((f) => f.id === '1.3')!;
    const expected = casesOf(flow).find(
      (c) => c.code === 'FLOW-1.3-ver-horario-lugar-NEGATIVE-01',
    )!;
    const row = store.get(TestCases)!.find((c) => c.code === expected.code)!;

    expect(row.httpMethodConceptId).toBe(CONCEPTS.HTTP_GET);
    expect(row.caseTypeConceptId).toBe(CONCEPTS.CASE_TYPE_NEGATIVE);
    expect(row.requestPath).toBe(expected.qaCase.path);
    expect(row.expectedHttpStatus).toBe(422);
    expect(row.stateConceptId).toBe(CONCEPTS.CASE_ACTIVE);
    expect(row.setupJson.flow).toMatchObject({
      id: '1.3',
      node: 'ver-horario-lugar',
      branch: 'NEGATIVE',
    });
    // Este caso prueba justamente la ausencia de la cabecera de organización.
    expect(row.setupJson.request).toEqual({});
    const assertion = store
      .get(TestAssertions)!
      .find((a) => a.testCaseId === row.id)!;
    expect(assertion).toMatchObject({
      assertionTypeConceptId: CONCEPTS.ASSERTION_STATUS_CODE,
      operatorConceptId: CONCEPTS.OPERATOR_EQUALS,
      expectedValue: '422',
    });
  });

  it('las cabeceras y el cuerpo del artefacto viajan en setup_json.request', async () => {
    const { service, store } = build();
    await service.run(ENABLED);

    const row = store
      .get(TestCases)!
      .find((c) => c.code === 'FLOW-1.3-lista-espera-NEGATIVE-01')!;

    expect(row.setupJson.request.body).toEqual({});
    expect(row.setupJson.request.headers).toHaveProperty('x-tenant-id');
  });

  it('el ordinal sigue el recorrido del árbol, sin repetirse dentro de la suite', async () => {
    const { service, store } = build();
    await service.run(ENABLED);

    for (const flow of FLOW_CATALOG) {
      const suite = store
        .get(TestSuites)!
        .find((s) => s.code === suiteCode(flow.id))!;
      const cases = store.get(TestCases)!.filter((c) => c.suiteId === suite.id);
      const byOrdinal = [...cases].sort((a, b) => a.ordinal - b.ordinal);
      expect(byOrdinal.map((c) => c.code)).toEqual(
        casesOf(flow).map((c) => c.code),
      );
      expect(new Set(cases.map((c) => c.ordinal)).size).toBe(cases.length);
    }
  });

  it('la segunda corrida no inserta ni cambia nada (idempotencia)', async () => {
    const { service } = build();
    await service.run(ENABLED);

    const second = await service.run(ENABLED);

    expect(second).toMatchObject({
      suitesCreated: 0,
      casesCreated: 0,
      assertionsCreated: 0,
      suitesExisting: FLOW_CATALOG.length,
      casesExisting: totalCases,
      assertionsExisting: totalCases,
      changed: { suites: 0, cases: 0, assertions: 0, retiredCases: 0 },
    });
  });

  it('si cambia el estado esperado en el artefacto, reescribe el caso y la aserción', async () => {
    const { service, store } = build();
    await service.run(ENABLED);
    const edited = structuredClone(FLOW_CATALOG) as unknown as FlowDefinition[];
    const node = edited[0].nodes.find((n) => n.id === 'buscar-api')!;
    (node.branches[0].qaCase as { expectedStatus: number }).expectedStatus =
      204;

    const result = await service.run(ENABLED, edited);

    expect(result.changed.cases).toBe(1);
    expect(result.changed.assertions).toBe(1);
    expect(result.casesCreated).toBe(0);
    const row = store
      .get(TestCases)!
      .find((c) => c.code === 'FLOW-1.3-buscar-api-HAPPY_PATH-01')!;
    expect(row.expectedHttpStatus).toBe(204);
  });

  it('un caso que el artefacto ya no trae pasa a borrador y no se borra', async () => {
    const { service, store } = build();
    await service.run(ENABLED);
    const before = store.get(TestCases)!.length;
    const edited = structuredClone(FLOW_CATALOG) as unknown as FlowDefinition[];
    const node = edited[0].nodes.find((n) => n.id === 'buscar-api')!;
    delete (node.branches[1] as { qaCase?: unknown }).qaCase;
    (node.branches[1] as { reason?: string }).reason = 'retirado en la prueba';

    const result = await service.run(ENABLED, edited);

    expect(result.changed.retiredCases).toBe(1);
    expect(store.get(TestCases)!).toHaveLength(before);
    const row = store
      .get(TestCases)!
      .find((c) => c.code === 'FLOW-1.3-buscar-api-EDGE-01')!;
    expect(row.stateConceptId).toBe(CONCEPTS.CASE_DRAFT);
  });

  it('sobre una suite existente sólo toca nombre y descripción, no su estado', async () => {
    const { service, store } = build();
    await service.run(ENABLED);
    const suite = store.get(TestSuites)!.find((s) => s.code === 'FLOW-1.3')!;
    suite.stateConceptId = CONCEPTS.SUITE_DRAFT;
    suite.version = 7;

    await service.run(ENABLED);

    expect(suite.stateConceptId).toBe(CONCEPTS.SUITE_DRAFT);
    expect(suite.version).toBe(7);
  });

  it('con RLS_ENFORCE=true fija el tenant de plataforma dentro de su transacción', async () => {
    const { service, tx } = build(true);

    await service.run(ENABLED);

    expect(tx.execute).toHaveBeenCalledWith(
      "select set_config('app.current_tenant_id', ?, true)",
      [SEED.tenantId],
    );
  });

  it('sin RLS no ejecuta set_config', async () => {
    const { service, tx } = build(false);

    await service.run(ENABLED);

    expect(tx.execute).not.toHaveBeenCalled();
  });
});
