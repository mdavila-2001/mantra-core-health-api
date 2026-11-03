import { describe, it, expect, jest } from '@jest/globals';
import { QaFlowsService } from './qa-flows.service';
import { CONCEPTS } from '../../../../common/constants/concepts';
import {
  AssertionResults,
  TestCaseResults,
  TestCases,
  TestSuites,
} from '../../entities';
import { branchCaseCode, casesOf } from '../../domain/flow-catalog';
import { FLOW_CATALOG } from '../../domain/flows';

type Row = Record<string, any>;

/** Rutas que «monta» la API en esta prueba: el nombre del parámetro no coincide a propósito. */
const ROUTES = [
  ['GET', '/public/search/practitioners', 'DirectoryController_search'],
  ['POST', '/scheduling/slots/:slotId/holds', 'SchedulingController_placeHold'],
  ['GET', '/practitioners/:profileId/insurance-networks', 'X_networks'],
] as const;

function build(
  data: {
    suites?: Row[];
    cases?: Row[];
    runs?: Row[];
    results?: Row[];
    verdicts?: Row[];
  } = {},
) {
  const byEntity = new Map<unknown, Row[]>([
    [TestSuites, data.suites ?? []],
    [TestCases, data.cases ?? []],
    [TestCaseResults, data.results ?? []],
    [AssertionResults, data.verdicts ?? []],
  ]);
  const em = {
    find: jest.fn((entity: unknown) =>
      Promise.resolve(byEntity.get(entity) ?? []),
    ),
    getConnection: () => ({
      execute: jest.fn(() => Promise.resolve(data.runs ?? [])),
    }),
  } as any;
  const routes = {
    all: () =>
      ROUTES.map(([method, template, operationId]) => ({
        method,
        template,
        operationId,
      })),
  } as any;
  return { service: new QaFlowsService(em, routes), em };
}

const flow13 = FLOW_CATALOG.find((f) => f.id === '1.3')!;
const nodeOf = (id: string) => flow13.nodes.find((n) => n.id === id)!;
const codeOf = (nodeId: string, kind: string, index = 0) => {
  const node = nodeOf(nodeId);
  return branchCaseCode(
    '1.3',
    node,
    node.branches.filter((b) => b.kind === kind)[index],
  );
};

describe('QaFlowsService.list', () => {
  it('lista los flujos declarados, sin sembrar, con sus conteos', async () => {
    const { service } = build();

    const { items, modules } = await service.list();

    expect(items.map((i) => i.id)).toEqual(FLOW_CATALOG.map((f) => f.id));
    expect(modules).toEqual(['1 · Paciente', '2 · Médico']);
    const first = items[0];
    expect(first.qa).toMatchObject({
      suiteCode: 'FLOW-1.3',
      suiteId: null,
      seeded: false,
      casesLinked: 0,
      casesMissing: first.qa.casesExpected,
      lastRun: null,
    });
    expect(first.counts.apiCalls).toBeGreaterThan(0);
  });

  it('el contrato se juzga contra las rutas montadas, sin atender el nombre del parámetro', async () => {
    const { service } = build();

    const detail = await service.detail('1.3');
    const endpoints = Object.fromEntries(
      detail.nodes.filter((n) => n.endpoint).map((n) => [n.id, n.endpoint!]),
    );

    expect(endpoints['buscar-api']).toMatchObject({
      contract: 'DECLARED',
      operationId: 'DirectoryController_search',
    });
    // El artefacto dice `{id}`, la API monta `:slotId`: es la misma ruta.
    expect(endpoints['tomar-cupo']).toMatchObject({
      contract: 'DECLARED',
      operationId: 'SchedulingController_placeHold',
    });
    expect(endpoints['ver-disponibilidad']).toMatchObject({
      contract: 'MISSING',
      operationId: null,
    });
    const summary = (await service.list()).items.find((i) => i.id === '1.3')!;
    expect(summary.contract.declared + summary.contract.missing).toBe(
      summary.contract.endpoints,
    );
    expect(summary.contract.declared).toBe(3);
  });

  it('filtra por módulo, texto y cobertura', async () => {
    const { service } = build();

    expect((await service.list({ module: '2 · Médico' })).items).toHaveLength(
      2,
    );
    expect(
      (await service.list({ search: 'FACTURACIÓN' })).items.map((i) => i.id),
    ).toEqual(['2.7']);
    expect(
      (await service.list({ search: '2.6' })).items.map((i) => i.id),
    ).toEqual(['2.6']);
    expect((await service.list({ coverage: 'SEEDED' })).items).toEqual([]);
    expect((await service.list({ coverage: 'NOT_SEEDED' })).items).toHaveLength(
      3,
    );
    expect((await service.list({ coverage: 'NEVER_RAN' })).items).toHaveLength(
      3,
    );
    expect((await service.list({ coverage: 'RAN' })).items).toEqual([]);
  });
});

describe('QaFlowsService.detail', () => {
  it('un flujo desconocido o mal formado es un 404', async () => {
    const { service } = build();

    await expect(service.detail('9.9')).rejects.toThrow('Flujo no encontrado');
    await expect(service.detail('../etc')).rejects.toThrow(
      'Flujo no encontrado',
    );
  });

  it('devuelve el árbol: la raíz sin padre, cada nodo con el suyo, en orden de recorrido', async () => {
    const { service } = build();

    const detail = await service.detail('1.3');

    expect(detail.nodes[0]).toMatchObject({
      id: 'buscar-medicos',
      parentId: null,
    });
    const parent = Object.fromEntries(
      detail.nodes.map((n) => [n.id, n.parentId]),
    );
    expect(parent['buscar-api']).toBe('buscar-medicos');
    expect(parent['lista-espera']).toBe('hay-cita');
    expect(parent['tomar-cupo']).toBe('hay-cita');
    // Todo nodo salvo la raíz tiene un padre que existe.
    for (const n of detail.nodes.slice(1)) {
      expect(detail.nodes.some((p) => p.id === n.parentId)).toBe(true);
    }
  });

  it('una rama sin caso explica por qué y un paso sin endpoint dice su `gap`', async () => {
    const { service } = build();

    const detail = await service.detail('1.3');
    const gapNode = detail.nodes.find((n) => n.id === 'datos-facturacion')!;
    const decision = detail.nodes.find((n) => n.id === 'hay-cita')!;

    expect(gapNode.gap).toMatch(/No se encontró/);
    expect(gapNode.endpoint).toBeNull();
    for (const branch of decision.branches) {
      expect(branch.qaCase).toBeNull();
      expect(branch.reason).toBeTruthy();
    }
  });

  it('no expone cuerpos, cabeceras ni la organización de los casos', async () => {
    const { service } = build();

    const text = JSON.stringify(await service.detail('1.3'));

    expect(text).not.toMatch(/1befcfea|"headers"|"body"/);
  });

  it('con la suite sembrada y una corrida, cada rama trae su caso y su último veredicto', async () => {
    const wanted = casesOf(flow13);
    const suite = { id: 's-1', code: 'FLOW-1.3' };
    const cases = wanted.map((c, i) => ({
      id: `c-${i}`,
      suiteId: suite.id,
      code: c.code,
      stateConceptId: CONCEPTS.CASE_ACTIVE,
      expectedHttpStatus: c.qaCase.expectedStatus,
      requestPath: c.qaCase.path,
    }));
    const target = codeOf('buscar-api', 'HAPPY_PATH');
    const targetId = cases.find((c) => c.code === target)!.id;
    const { service } = build({
      suites: [suite],
      cases,
      runs: [
        {
          suite_id: suite.id,
          id: 'run-1',
          run_number: 'R-0001',
          status_concept_id: CONCEPTS.RUN_PASSED,
          finished_at: new Date('2026-10-17T10:00:00Z'),
        },
      ],
      results: [
        {
          id: 'r-1',
          testRunId: 'run-1',
          testCaseId: targetId,
          statusConceptId: CONCEPTS.CASE_RESULT_PASSED,
        },
      ],
      verdicts: [
        { testCaseResultId: 'r-1', actualValue: '200', message: null },
      ],
    });

    const detail = await service.detail('1.3');
    const branch = detail.nodes
      .find((n) => n.id === 'buscar-api')!
      .branches.find((b) => b.kind === 'HAPPY_PATH')!;

    expect(branch.qaCase).toMatchObject({
      code: target,
      seeded: true,
      drifted: false,
      lastResult: {
        runNumber: 'R-0001',
        status: 'RESULT_PASSED',
        observedStatus: 200,
      },
    });
    expect(detail.qa).toMatchObject({
      seeded: true,
      suiteId: 's-1',
      casesMissing: 0,
      passed: 1,
      failed: 0,
      lastRun: { runNumber: 'R-0001', status: 'RUN_PASSED' },
    });
    expect(
      (await service.list({ coverage: 'RAN' })).items.map((i) => i.id),
    ).toEqual(['1.3']);
  });

  it('detecta lo sembrado que ya no coincide con el artefacto y el caso retirado', async () => {
    const wanted = casesOf(flow13);
    const suite = { id: 's-1', code: 'FLOW-1.3' };
    const cases = wanted.map((c, i) => ({
      id: `c-${i}`,
      suiteId: suite.id,
      code: c.code,
      stateConceptId: CONCEPTS.CASE_ACTIVE,
      expectedHttpStatus: c.qaCase.expectedStatus,
      requestPath: c.qaCase.path,
    }));
    cases[0].expectedHttpStatus = 500;
    cases[1].stateConceptId = CONCEPTS.CASE_DRAFT;
    const { service } = build({ suites: [suite], cases });

    const detail = await service.detail('1.3');
    const branches = detail.nodes
      .find((n) => n.id === 'buscar-api')!
      .branches.map((b) => b.qaCase!);

    expect(branches[0]).toMatchObject({ seeded: true, drifted: true });
    expect(branches[1]).toMatchObject({ seeded: false });
    expect(detail.qa.casesMissing).toBe(1);
    expect(detail.qa.lastRun).toBeNull();
  });
});
