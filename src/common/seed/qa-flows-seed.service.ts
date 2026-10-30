import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { isDeepStrictEqual } from 'node:util';
import {
  TestAssertions,
  TestCases,
  TestSuites,
} from '../../modules/qa_lab/entities';
import {
  casesOf,
  suiteCode,
  type FlowBranchKind,
  type FlowDefinition,
  type FlowHttpMethod,
} from '../../modules/qa_lab/domain/flow-catalog';
import { FLOW_CATALOG } from '../../modules/qa_lab/domain/flows';
import { CONCEPTS, SEED } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';

/** Configuración del seed leída del entorno. */
export interface QaFlowsEnv {
  /** Sin `SEED_QA_FLOWS=true` el seed no hace nada. */
  enabled: boolean;
  /** Permiso explícito para sembrar en `NODE_ENV=production`. */
  allowProduction: boolean;
  nodeEnv?: string;
}

/**
 * Lee la configuración del seed.
 *
 * @param source - Origen de variables; `process.env` salvo en pruebas.
 */
export function loadQaFlowsEnv(
  source: NodeJS.ProcessEnv = process.env,
): QaFlowsEnv {
  return {
    enabled: source.SEED_QA_FLOWS === 'true',
    allowProduction: source.SEED_QA_FLOWS_ALLOW_PRODUCTION === 'true',
    nodeEnv: source.NODE_ENV,
  };
}

/** Qué hizo una pasada. Los contadores `...Existing` no cuentan como filas nuevas. */
export interface QaFlowsResult {
  skipped?: 'not-enabled' | 'production-not-allowed';
  suitesCreated: number;
  suitesExisting: number;
  casesCreated: number;
  casesExisting: number;
  assertionsCreated: number;
  assertionsExisting: number;
  /** Filas que ya estaban y se reescribieron porque el artefacto cambió. */
  changed: {
    suites: number;
    cases: number;
    assertions: number;
    /** Casos que dejaron de estar en el artefacto y pasaron a borrador. */
    retiredCases: number;
  };
}

const EMPTY: QaFlowsResult = {
  suitesCreated: 0,
  suitesExisting: 0,
  casesCreated: 0,
  casesExisting: 0,
  assertionsCreated: 0,
  assertionsExisting: 0,
  changed: { suites: 0, cases: 0, assertions: 0, retiredCases: 0 },
};

const CASE_TYPE: Record<FlowBranchKind, string> = {
  HAPPY_PATH: CONCEPTS.CASE_TYPE_HAPPY_PATH,
  EDGE: CONCEPTS.CASE_TYPE_EDGE,
  NEGATIVE: CONCEPTS.CASE_TYPE_NEGATIVE,
};

const HTTP_METHOD: Record<FlowHttpMethod, string> = {
  GET: CONCEPTS.HTTP_GET,
  POST: CONCEPTS.HTTP_POST,
  PUT: CONCEPTS.HTTP_PUT,
  PATCH: CONCEPTS.HTTP_PATCH,
  DELETE: CONCEPTS.HTTP_DELETE,
};

/**
 * Igualdad por valor JSON: ignora el orden de claves (el `jsonb` las reordena) y el
 * prototipo del objeto (el que devuelve el driver no siempre es `Object.prototype`).
 */
function sameJson(a: unknown, b: unknown): boolean {
  const normalize = (value: unknown): unknown =>
    value === undefined ? null : JSON.parse(JSON.stringify(value));
  return isDeepStrictEqual(normalize(a), normalize(b));
}

/** Asigna sólo lo que cambió; dice si hubo algo. */
function assignChanged<T extends object>(
  target: T,
  patch: Partial<T>,
): boolean {
  let changed = false;
  for (const [key, value] of Object.entries(patch) as [keyof T, T[keyof T]][]) {
    if (!sameJson(target[key], value)) {
      target[key] = value;
      changed = true;
    }
  }
  return changed;
}

/**
 * Siembra los flujos del catálogo como suites de `qa_lab` (H3.2).
 *
 * Una suite `FLOW-<id>` por flujo y un caso `FLOW-<id>-<nodo>-<TIPO>-<nn>` por rama
 * con `qaCase`, con su aserción de estado HTTP. Así el runner M68 puede ejecutarlos
 * contra un destino aprobado y el detalle del flujo muestra el veredicto por rama.
 *
 * - **Opt-in**: sin `SEED_QA_FLOWS=true` no hace nada.
 * - **Se niega en producción** salvo `SEED_QA_FLOWS_ALLOW_PRODUCTION=true`.
 * - **Idempotente y sin `DELETE`**: la segunda corrida no inserta ni cambia nada. Un caso
 *   que el artefacto ya no trae pasa a borrador; el historial de sus corridas se conserva.
 * - **El artefacto manda sobre los casos**: si coincide por código, se reescribe con lo del
 *   JSON (incluido reactivarlo). Sobre una suite que ya existe sólo se tocan nombre y
 *   descripción: su estado y versión son de quien la administra.
 * - La suite queda en el tenant de plataforma (`SEED.tenantId`), el mismo de las series de
 *   tráfico. Con `RLS_ENFORCE=true` el seed fija ese tenant en su transacción.
 */
@Injectable()
export class QaFlowsSeedService {
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QaFlowsSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @param env - Configuración; por defecto, la del proceso.
   * @param flows - Flujos a sembrar; por defecto, el catálogo real.
   */
  async run(
    env: QaFlowsEnv = loadQaFlowsEnv(),
    flows: readonly FlowDefinition[] = FLOW_CATALOG,
  ): Promise<QaFlowsResult> {
    if (!env.enabled) return { ...EMPTY, skipped: 'not-enabled' };
    if (env.nodeEnv === 'production' && !env.allowProduction) {
      this.logger.warn(
        { operation: 'seed.qa_flows' },
        'SEED_QA_FLOWS se ignora en producción sin SEED_QA_FLOWS_ALLOW_PRODUCTION=true',
      );
      return { ...EMPTY, skipped: 'production-not-allowed' };
    }

    const result: QaFlowsResult = {
      ...EMPTY,
      changed: { ...EMPTY.changed },
    };
    await this.orm.em.fork().transactional(async (tx) => {
      if (this.enforceRls) {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [SEED.tenantId],
        );
      }
      for (const flow of flows) await this.seedFlow(tx, flow, result);
    });

    this.logger.info(
      { operation: 'seed.qa_flows', flows: flows.length, ...result },
      'Flujos del catálogo sembrados en qa_lab',
    );
    return result;
  }

  private async seedFlow(
    tx: EntityManager,
    flow: FlowDefinition,
    result: QaFlowsResult,
  ): Promise<void> {
    const code = suiteCode(flow.id);
    const name = `Flujo ${flow.id} · ${flow.title}`;
    const description = `${flow.module}. Fuente: ${flow.source.section}. Generado desde el catálogo de flujos; no se edita a mano.`;

    let suite = await tx.findOne(TestSuites, { code });
    if (!suite) {
      suite = tx.create(
        TestSuites,
        {
          code,
          name,
          description,
          tenantId: SEED.tenantId,
          suiteTypeConceptId: CONCEPTS.SUITE_TYPE_REGRESSION,
          version: 1,
          stateConceptId: CONCEPTS.SUITE_ACTIVE,
          ...createdBy(undefined),
        },
        { partial: true },
      );
      result.suitesCreated += 1;
    } else {
      result.suitesExisting += 1;
      if (assignChanged(suite, { name, description })) {
        suite.updatedAt = new Date();
        result.changed.suites += 1;
      }
    }
    await tx.flush();

    const existing = await tx.find(TestCases, { suiteId: suite.id });
    const byCode = new Map(existing.map((c) => [c.code, c]));
    const wanted = casesOf(flow);

    for (const [index, item] of wanted.entries()) {
      const { qaCase, branch } = item;
      const node = flow.nodes.find((n) => n.id === item.nodeId)!;
      const fields = {
        name: `${node.title} — ${branch.condition}`,
        caseTypeConceptId: CASE_TYPE[branch.kind],
        httpMethodConceptId: HTTP_METHOD[qaCase.method],
        requestPath: qaCase.path,
        expectedHttpStatus: qaCase.expectedStatus,
        setupJson: {
          flow: {
            id: flow.id,
            node: node.id,
            branch: branch.kind,
            sourceRef: node.sourceRef,
          },
          request: {
            ...(qaCase.body !== undefined ? { body: qaCase.body } : {}),
            ...(qaCase.headers ? { headers: { ...qaCase.headers } } : {}),
          },
        },
        ordinal: index + 1,
        stateConceptId: CONCEPTS.CASE_ACTIVE,
      };

      let testCase = byCode.get(item.code);
      if (!testCase) {
        testCase = tx.create(
          TestCases,
          {
            suiteId: suite.id,
            code: item.code,
            ...fields,
            ...createdBy(undefined),
          },
          { partial: true },
        );
        result.casesCreated += 1;
      } else {
        result.casesExisting += 1;
        if (assignChanged(testCase, fields)) {
          testCase.updatedAt = new Date();
          result.changed.cases += 1;
        }
      }
      await tx.flush();
      await this.seedAssertion(tx, testCase.id, qaCase.expectedStatus, result);
    }

    // Lo que el artefacto ya no trae no se borra: pasa a borrador y conserva sus corridas.
    const keep = new Set(wanted.map((w) => w.code));
    for (const testCase of existing) {
      if (
        testCase.code.startsWith(`${code}-`) &&
        !keep.has(testCase.code) &&
        testCase.stateConceptId === CONCEPTS.CASE_ACTIVE
      ) {
        testCase.stateConceptId = CONCEPTS.CASE_DRAFT;
        testCase.updatedAt = new Date();
        result.changed.retiredCases += 1;
      }
    }
    await tx.flush();
  }

  private async seedAssertion(
    tx: EntityManager,
    testCaseId: string,
    expectedStatus: number,
    result: QaFlowsResult,
  ): Promise<void> {
    const fields = {
      operatorConceptId: CONCEPTS.OPERATOR_EQUALS,
      expectedValue: String(expectedStatus),
      ordinal: 1,
    };
    const found = await tx.findOne(TestAssertions, {
      testCaseId,
      assertionTypeConceptId: CONCEPTS.ASSERTION_STATUS_CODE,
    });
    if (!found) {
      tx.create(
        TestAssertions,
        {
          testCaseId,
          assertionTypeConceptId: CONCEPTS.ASSERTION_STATUS_CODE,
          ...fields,
          ...createdBy(undefined),
        },
        { partial: true },
      );
      result.assertionsCreated += 1;
    } else {
      result.assertionsExisting += 1;
      if (assignChanged(found, fields)) {
        found.updatedAt = new Date();
        result.changed.assertions += 1;
      }
    }
    await tx.flush();
  }
}
