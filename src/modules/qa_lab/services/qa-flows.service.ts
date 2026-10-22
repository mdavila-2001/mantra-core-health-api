import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { conceptCode } from '../../../common/constants/concept-code';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  normalizeTemplate,
  RouteIndexService,
} from '../../../observability/route-index/route-index.service';
import {
  AssertionResults,
  TestCaseResults,
  TestCases,
  TestSuites,
} from '../entities';
import {
  branchCaseCode,
  countFlow,
  suiteCode,
  traversalOrder,
  type FlowBranch,
  type FlowCounts,
  type FlowDefinition,
  type FlowNode,
} from '../domain/flow-catalog';
import { FLOW_CATALOG } from '../flows';

/** Cómo está cubierto un flujo: filtro de la lista. */
export const FLOW_COVERAGE = [
  'SEEDED',
  'NOT_SEEDED',
  'RAN',
  'NEVER_RAN',
] as const;
export type FlowCoverage = (typeof FLOW_COVERAGE)[number];

export interface FlowsFilters {
  module?: string;
  search?: string;
  coverage?: FlowCoverage;
}

export type EndpointContract = 'DECLARED' | 'MISSING';

/** Último veredicto de una rama: de la corrida más reciente de su suite. */
export interface BranchResult {
  runId: string;
  runNumber: string;
  status: string | null;
  /** Estado HTTP que la API devolvió en esa corrida. */
  observedStatus: number | null;
  message: string | null;
  finishedAt: string | null;
}

export interface BranchQaCase {
  code: string;
  method: string;
  path: string;
  expectedStatus: number;
  observedOn: string;
  /** `true` si el caso existe en `qa_lab` y está activo. */
  seeded: boolean;
  caseId: string | null;
  /** `true` si lo sembrado ya no coincide con el artefacto: hay que volver a sembrar. */
  drifted: boolean;
  lastResult: BranchResult | null;
}

const iso = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;

/** Nombre de parámetro fuera: `/a/:id/b` y `/a/:slotId/b` son la misma ruta. */
const shape = (method: string, template: string) =>
  `${method.toUpperCase()} ${normalizeTemplate(template).replace(/:\w+/g, ':')}`;

interface QaState {
  suites: Map<string, TestSuites>;
  casesBySuite: Map<string, Map<string, TestCases>>;
  lastRun: Map<
    string,
    {
      id: string;
      runNumber: string;
      status: string | null;
      finishedAt: string | null;
    }
  >;
  results: Map<string, Map<string, BranchResult>>;
}

/**
 * Lectura del catálogo de flujos para el portal (H3.3).
 *
 * Une tres cosas: el artefacto (`flows/catalog`), el contrato real (qué rutas
 * monta esta API ahora mismo) y lo que `qa_lab` sabe (suite sembrada, casos y
 * último veredicto por rama). Es sólo lectura y no devuelve cuerpos de petición
 * ni cabeceras de los casos: el artefacto los guarda, el portal no los necesita.
 */
@Injectable()
export class QaFlowsService {
  private routeShapes: ReadonlyMap<string, string> | null = null;

  constructor(
    private readonly em: EntityManager,
    private readonly routes: RouteIndexService,
  ) {}

  /** Los flujos declarados; las pruebas lo reemplazan por un catálogo propio. */
  private flows: readonly FlowDefinition[] = FLOW_CATALOG;

  /** `operationId` de la ruta que la API monta para ese verbo y plantilla, o `null`. */
  private operationOf(method: string, template: string): string | null {
    if (!this.routeShapes) {
      this.routeShapes = new Map(
        this.routes
          .all()
          .map((r) => [shape(r.method, r.template), r.operationId]),
      );
    }
    return (
      this.routeShapes.get(shape(method, template)) ??
      this.routeShapes.get(shape('ALL', template)) ??
      null
    );
  }

  async list(filters: FlowsFilters = {}) {
    const search = filters.search?.trim().toLowerCase();
    const wanted = this.flows.filter(
      (flow) =>
        (!filters.module || flow.module === filters.module) &&
        (!search ||
          `${flow.id} ${flow.title} ${flow.module}`
            .toLowerCase()
            .includes(search)),
    );
    const state = await this.loadState(wanted);
    const items = wanted
      .map((flow) => this.summary(flow, state))
      .filter((item) => {
        switch (filters.coverage) {
          case 'SEEDED':
            return item.qa.seeded;
          case 'NOT_SEEDED':
            return !item.qa.seeded;
          case 'RAN':
            return item.qa.lastRun !== null;
          case 'NEVER_RAN':
            return item.qa.lastRun === null;
          default:
            return true;
        }
      });
    return {
      items,
      modules: [...new Set(this.flows.map((f) => f.module))].sort(),
    };
  }

  async detail(flowId: string) {
    const flow = this.flows.find((f) => f.id === flowId);
    if (!flow)
      throw new ResourceNotFoundException('Flujo no encontrado', { flowId });
    const state = await this.loadState([flow]);
    const summary = this.summary(flow, state);

    const parent = new Map<string, string>();
    for (const node of traversalOrder(flow)) {
      for (const branch of node.branches) {
        if (branch.next !== undefined && !parent.has(branch.next))
          parent.set(branch.next, node.id);
      }
    }
    parent.delete(flow.root);

    return {
      id: flow.id,
      module: flow.module,
      title: flow.title,
      source: flow.source,
      actors: flow.actors,
      frontRoutes: flow.frontRoutes,
      root: flow.root,
      openQuestions: flow.openQuestions,
      counts: summary.counts,
      contract: summary.contract,
      qa: summary.qa,
      nodes: traversalOrder(flow).map((node) => ({
        id: node.id,
        parentId: parent.get(node.id) ?? null,
        kind: node.kind,
        title: node.title,
        actor: node.actor,
        uiRoute: node.uiRoute ?? null,
        endpoint: node.endpoint ? this.endpointOf(node) : null,
        gap: node.gap ?? null,
        effects: node.effects ?? [],
        sourceRef: node.sourceRef,
        branches: node.branches.map((branch) =>
          this.branchOf(flow, node, branch, state),
        ),
      })),
    };
  }

  private endpointOf(node: FlowNode) {
    const endpoint = node.endpoint!;
    const operationId = this.operationOf(endpoint.method, endpoint.path);
    return {
      method: endpoint.method,
      path: endpoint.path,
      operationId,
      contract: operationId ? 'DECLARED' : 'MISSING',
    };
  }

  private branchOf(
    flow: FlowDefinition,
    node: FlowNode,
    branch: FlowBranch,
    state: QaState,
  ) {
    let qaCase: BranchQaCase | null = null;
    if (branch.qaCase) {
      const code = branchCaseCode(flow.id, node, branch);
      const suite = state.suites.get(suiteCode(flow.id));
      const row = suite
        ? state.casesBySuite.get(suite.id)?.get(code)
        : undefined;
      const active = row?.stateConceptId === CONCEPTS.CASE_ACTIVE;
      qaCase = {
        code,
        method: branch.qaCase.method,
        path: branch.qaCase.path,
        expectedStatus: branch.qaCase.expectedStatus,
        observedOn: branch.qaCase.observedOn,
        seeded: !!row && active,
        caseId: row?.id ?? null,
        drifted:
          !!row &&
          (row.expectedHttpStatus !== branch.qaCase.expectedStatus ||
            row.requestPath !== branch.qaCase.path),
        lastResult: suite
          ? (state.results.get(suite.id)?.get(code) ?? null)
          : null,
      };
    }
    return {
      kind: branch.kind,
      condition: branch.condition,
      expected: branch.expected,
      next: branch.next ?? null,
      loopsTo: branch.loopsTo ?? null,
      reason: branch.reason ?? null,
      qaCase,
    };
  }

  private summary(flow: FlowDefinition, state: QaState) {
    const counts: FlowCounts = countFlow(flow);
    const suite = state.suites.get(suiteCode(flow.id));
    const endpoints = flow.nodes.filter((n) => n.endpoint);
    const declared = endpoints.filter(
      (n) => this.operationOf(n.endpoint!.method, n.endpoint!.path) !== null,
    ).length;

    const caseBranches = flow.nodes.flatMap((node) =>
      node.branches
        .filter((b) => b.qaCase)
        .map((b) => branchCaseCode(flow.id, node, b)),
    );
    const rows = suite ? state.casesBySuite.get(suite.id) : undefined;
    const linked = caseBranches.filter(
      (code) => rows?.get(code)?.stateConceptId === CONCEPTS.CASE_ACTIVE,
    ).length;
    const verdicts: ReadonlyMap<string, BranchResult> = suite
      ? (state.results.get(suite.id) ?? new Map<string, BranchResult>())
      : new Map<string, BranchResult>();
    const withVerdict = caseBranches.filter((c) => verdicts.has(c));

    return {
      id: flow.id,
      module: flow.module,
      title: flow.title,
      source: flow.source,
      actors: flow.actors,
      frontRoutes: flow.frontRoutes,
      counts,
      contract: {
        endpoints: endpoints.length,
        declared,
        missing: endpoints.length - declared,
        gaps: counts.gaps,
      },
      qa: {
        suiteCode: suiteCode(flow.id),
        suiteId: suite?.id ?? null,
        seeded: !!suite,
        casesExpected: caseBranches.length,
        casesLinked: linked,
        casesMissing: caseBranches.length - linked,
        branchesNotRunnable: counts.withoutCase,
        passed: withVerdict.filter(
          (c) => verdicts.get(c)?.status === 'RESULT_PASSED',
        ).length,
        failed: withVerdict.filter(
          (c) => verdicts.get(c)?.status === 'RESULT_FAILED',
        ).length,
        lastRun: suite ? (state.lastRun.get(suite.id) ?? null) : null,
      },
    };
  }

  /** Lo que `qa_lab` sabe de estos flujos, en pocas consultas. */
  private async loadState(flows: readonly FlowDefinition[]): Promise<QaState> {
    const state: QaState = {
      suites: new Map(),
      casesBySuite: new Map(),
      lastRun: new Map(),
      results: new Map(),
    };
    if (flows.length === 0) return state;

    const suites = await this.em.find(TestSuites, {
      code: { $in: flows.map((f) => suiteCode(f.id)) },
    });
    if (suites.length === 0) return state;
    for (const suite of suites) state.suites.set(suite.code, suite);
    const suiteIds = suites.map((s) => s.id);

    const cases = await this.em.find(TestCases, { suiteId: { $in: suiteIds } });
    const codeById = new Map<string, { suiteId: string; code: string }>();
    for (const row of cases) {
      let inSuite = state.casesBySuite.get(row.suiteId);
      if (!inSuite) {
        inSuite = new Map();
        state.casesBySuite.set(row.suiteId, inSuite);
      }
      inSuite.set(row.code, row);
      codeById.set(row.id, { suiteId: row.suiteId, code: row.code });
    }

    const marks = suiteIds.map(() => '?').join(', ');
    const runs = await this.em.getConnection().execute<
      Array<{
        suite_id: string;
        id: string;
        run_number: string;
        status_concept_id: string;
        finished_at: Date | null;
      }>
    >(
      `SELECT DISTINCT ON (suite_id) suite_id, id, run_number, status_concept_id, finished_at
         FROM qa_lab.test_runs WHERE suite_id IN (${marks})
        ORDER BY suite_id, created_at DESC`,
      suiteIds,
      'all',
    );
    for (const run of runs) {
      state.lastRun.set(run.suite_id, {
        id: run.id,
        runNumber: run.run_number,
        status: conceptCode(run.status_concept_id),
        finishedAt: iso(run.finished_at ? new Date(run.finished_at) : null),
      });
    }
    if (runs.length === 0) return state;

    const runById = new Map(runs.map((r) => [r.id, r]));
    const results = await this.em.find(TestCaseResults, {
      testRunId: { $in: runs.map((r) => r.id) },
    });
    const verdictOf = new Map<string, AssertionResults>();
    for (const verdict of await this.em.find(AssertionResults, {
      testCaseResultId: { $in: results.map((r) => r.id) },
    })) {
      // Un caso de flujo tiene una sola aserción (el estado HTTP).
      if (!verdictOf.has(verdict.testCaseResultId))
        verdictOf.set(verdict.testCaseResultId, verdict);
    }
    for (const result of results) {
      const meta = codeById.get(result.testCaseId);
      const run = runById.get(result.testRunId);
      if (!meta || !run) continue;
      const verdict = verdictOf.get(result.id);
      const observed = Number(verdict?.actualValue ?? Number.NaN);
      let inSuite = state.results.get(meta.suiteId);
      if (!inSuite) {
        inSuite = new Map();
        state.results.set(meta.suiteId, inSuite);
      }
      inSuite.set(meta.code, {
        runId: run.id,
        runNumber: run.run_number,
        status: conceptCode(result.statusConceptId),
        observedStatus: Number.isInteger(observed) ? observed : null,
        message: verdict?.message ?? result.errorText ?? null,
        finishedAt: run.finished_at
          ? new Date(run.finished_at).toISOString()
          : null,
      });
    }
    return state;
  }
}
