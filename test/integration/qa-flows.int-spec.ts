import { readFileSync } from 'node:fs';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as qaLabEntities from '../../src/modules/qa_lab/entities';
import * as qaExecutionEntities from '../../src/modules/qa_execution/entities';
import { QaRunsService } from '../../src/modules/qa_lab/services/qa-runs.service';
import {
  QaCatalogRepository,
  QaRunsRepository,
} from '../../src/modules/qa_lab/repositories';
import { QaExecutionService } from '../../src/modules/qa_execution/services/qa-execution.service';
import { GuardedHttpClient } from '../../src/modules/qa_execution/infrastructure/guarded-http.client';
import { QaFlowsSeedService } from '../../src/common/seed/qa-flows-seed.service';
import { QaFlowsService } from '../../src/modules/qa_lab/services/qa-flows.service';
import { FLOW_CATALOG } from '../../src/modules/qa_lab/flows';
import {
  casesOf,
  suiteCode,
  type FlowDefinition,
} from '../../src/modules/qa_lab/domain/flow-catalog';
import {
  CONCEPTS,
  SEED,
  runWithTenant,
  type AuthenticatedUser,
} from '../../src/common';

/**
 * Catálogo de flujos sembrado en `qa_lab` y ejecutado por el runner M68, contra
 * PostgreSQL real (DDL canónico del módulo 36 + patch v4.2.20).
 *
 * El destino es un servidor HTTP de prueba que **hace de la API** (regla 65: un
 * doble declarado). Contesta, para cada petición, el estado que el artefacto dice
 * haber observado en la API real; que esos estados sean los reales lo comprueba
 * otra cosa (los 27 casos se ejercieron contra la API el 2026-10-17).
 * Acá se prueba la tubería: sembrar → planificar → aprobar → ejecutar → evaluar.
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL` (base desechable). Recrea `qa_lab` y `qa_execution`.
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const root = process.cwd();
const ENABLED = { enabled: true, allowProduction: false, nodeEnv: 'test' };

const requester: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['QA_ENGINEER'],
};
const approver: AuthenticatedUser = { id: randomUUID(), roles: ['QA_ADMIN'] };
const worker: AuthenticatedUser = { id: randomUUID(), roles: ['SYSTEM'] };
const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const FLOW = FLOW_CATALOG.find((f) => f.id === '1.3')!;
const FLOW_CASES = casesOf(FLOW);
const TOTAL_CASES = FLOW_CATALOG.reduce((n, f) => n + casesOf(f).length, 0);

/**
 * Lo que la API real contestó a cada caso: `MÉTODO url [con organización]` → estado.
 * La cabecera cuenta en la clave porque el mismo GET responde 200 con ella y 422 sin ella.
 */
const keyOf = (method: string, url: string, tenant: boolean) =>
  `${method} ${url} ${tenant ? 'T' : '-'}`;
const OBSERVED = new Map(
  FLOW_CATALOG.flatMap((f) =>
    casesOf(f).map((c) => [
      keyOf(
        c.qaCase.method,
        c.qaCase.path,
        !!c.qaCase.headers?.['x-tenant-id'],
      ),
      c.qaCase.expectedStatus,
    ]),
  ),
);

/**
 * Corre cada método del objeto dentro del tenant de plataforma, como lo deja el
 * `TenantContextInterceptor` para un usuario QA. Las suites del seed son de ese
 * tenant (`SEED.tenantId`): `qa_lab` ya no resuelve por UUID lo que no es del
 * tenant activo.
 */
function inPlatformTenant<T extends object>(target: T): T {
  return new Proxy(target, {
    get(object, property, receiver) {
      const value = Reflect.get(object, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(SEED.tenantId, () => value.apply(object, args));
    },
  });
}

describeIfDb('Catálogo de flujos en qa_lab (integración real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  let seed: QaFlowsSeedService;
  let flows: QaFlowsService;
  let service: QaExecutionService;
  let server: Server;
  let port: number;
  const received: Array<{
    method: string;
    url: string;
    headers: IncomingHttpHeaders;
    body: string;
  }> = [];
  /** Estados que el destino fuerza en vez del observado. */
  const forced = new Map<string, number>();
  const envId = randomUUID();
  const envReadOnly = randomUUID();

  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);

  async function runPlan(suiteId: string, key: string) {
    const { plan } = await service.createPlan(
      { suiteId, environmentId: envId },
      key,
      requester,
    );
    await service.approve(
      plan.id,
      {
        decision: 'APPROVED',
        planHash: plan.planHash,
        reason: 'Revisado: sólo contra el destino de prueba local',
      },
      approver,
    );
    await service.runNext(worker);
    return { plan, done: await service.getPlan(plan.id) };
  }

  const suiteId = async (code: string) =>
    (await sql('SELECT id FROM qa_lab.test_suites WHERE code = $1', [code]))
      .rows[0].id as string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const key = keyOf(
          req.method ?? '',
          req.url ?? '',
          !!req.headers['x-tenant-id'],
        );
        received.push({
          method: req.method ?? '',
          url: req.url ?? '',
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
        const status = forced.get(key) ?? OBSERVED.get(key) ?? 404;
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ stub: true }));
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    port = (server.address() as AddressInfo).port;
    process.env.QA_TARGET_FLOWS_IT_TOKEN = 'Bearer qa-flows-it';

    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await sql('DROP SCHEMA IF EXISTS qa_execution, qa_lab CASCADE');
    await sql('CREATE SCHEMA IF NOT EXISTS iam');
    await sql('CREATE TABLE IF NOT EXISTS iam.users (id uuid PRIMARY KEY)');
    for (const file of ['01_schema.sql', '02_tables.sql', '04_indexes.sql']) {
      await sql(
        readFileSync(join(root, 'database/SQL/36_qa_lab', file), 'utf8'),
      );
    }
    await sql(
      readFileSync(
        join(root, 'database/SQL/patches/2026-09-18_v4220_qa_execution.sql'),
        'utf8',
      ),
    );
    for (const user of [requester, approver, worker]) {
      await sql('INSERT INTO iam.users (id) VALUES ($1)', [user.id]);
    }
    for (const [id, code] of [
      [envId, 'FLOWS-IT'],
      [envReadOnly, 'FLOWS-IT-RO'],
    ]) {
      await sql(
        `INSERT INTO qa_lab.test_environments (id, code, name, environment_concept_id, base_url,
           is_production_safe, state_concept_id, tenant_id, created_at, updated_at, row_version)
         VALUES ($1, $2, $2, $3, $4, false, $5, $6, now(), now(), 1)`,
        [
          id,
          code,
          CONCEPTS.QA_ENV_DEV,
          `http://127.0.0.1:${port}`,
          CONCEPTS.STATE_ACTIVE,
          SEED.tenantId,
        ],
      );
    }

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: [
        ...Object.values(qaLabEntities),
        ...Object.values(qaExecutionEntities),
      ],
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
    const em = orm.em.fork();
    const runs = new QaRunsService(
      em,
      new QaRunsRepository(),
      new QaCatalogRepository(),
      silent,
    );
    service = inPlatformTenant(
      new QaExecutionService(em, runs, new GuardedHttpClient(), silent),
    );
    seed = new QaFlowsSeedService(orm, silent);
    // El índice de rutas no es lo que se prueba acá: lo prueba su propia suite.
    flows = new QaFlowsService(orm.em.fork(), { all: () => [] } as never);

    // Los flujos llevan POST (cuerpos inválidos, ids inexistentes): el destino debe admitir mutaciones.
    for (const [id, allowMutations] of [
      [envId, true],
      [envReadOnly, false],
    ] as const) {
      await service.upsertTarget(
        id,
        {
          scheme: 'http',
          host: '127.0.0.1',
          port,
          allowedPathPrefixes: ['/'],
          allowPrivateNetwork: true,
          allowMutations,
          authSecretRef: 'QA_TARGET_FLOWS_IT_TOKEN',
          minIntervalMs: 0,
        } as never,
        approver,
      );
    }
  }, 120_000);

  afterAll(async () => {
    delete process.env.QA_TARGET_FLOWS_IT_TOKEN;
    await orm?.close(true);
    await client?.end();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('siembra una suite por flujo, un caso por rama con qaCase y una aserción por caso', async () => {
    const result = await seed.run(ENABLED);

    expect(result).toMatchObject({
      suitesCreated: FLOW_CATALOG.length,
      casesCreated: TOTAL_CASES,
      assertionsCreated: TOTAL_CASES,
    });
    const count = async (text: string) => Number((await sql(text)).rows[0].n);
    expect(
      await count(
        `SELECT count(*) AS n FROM qa_lab.test_suites WHERE code LIKE 'FLOW-%'`,
      ),
    ).toBe(FLOW_CATALOG.length);
    expect(await count('SELECT count(*) AS n FROM qa_lab.test_cases')).toBe(
      TOTAL_CASES,
    );
    // Ningún caso sin aserción ni código repetido dentro de su suite.
    expect(
      await count(
        `SELECT count(*) AS n FROM qa_lab.test_cases c
          WHERE NOT EXISTS (SELECT 1 FROM qa_lab.test_assertions a WHERE a.test_case_id = c.id)`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*) AS n FROM (SELECT suite_id, code FROM qa_lab.test_cases
          GROUP BY 1, 2 HAVING count(*) > 1) d`,
      ),
    ).toBe(0);
  });

  it('la segunda corrida no inserta ni reescribe nada', async () => {
    const before = await sql(
      `SELECT (SELECT sum(row_version) FROM qa_lab.test_suites)::int AS s,
              (SELECT sum(row_version) FROM qa_lab.test_cases)::int AS c,
              (SELECT sum(row_version) FROM qa_lab.test_assertions)::int AS a`,
    );

    const second = await seed.run(ENABLED);

    expect(second).toMatchObject({
      suitesCreated: 0,
      casesCreated: 0,
      assertionsCreated: 0,
      changed: { suites: 0, cases: 0, assertions: 0, retiredCases: 0 },
    });
    const after = await sql(
      `SELECT (SELECT sum(row_version) FROM qa_lab.test_suites)::int AS s,
              (SELECT sum(row_version) FROM qa_lab.test_cases)::int AS c,
              (SELECT sum(row_version) FROM qa_lab.test_assertions)::int AS a`,
    );
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it('el preflight lista los casos en orden de recorrido y no filtra el árbol al plan', async () => {
    const preflight = await service.preflight({
      suiteId: await suiteId(suiteCode(FLOW.id)),
      environmentId: envId,
    });

    expect(preflight.executable).toBe(true);
    expect(preflight.steps.map((s) => s.url)).toEqual(
      FLOW_CASES.map((c) => `http://127.0.0.1:${port}${c.qaCase.path}`),
    );
    // `setup_json.flow` es del catálogo; el plan no lo lleva.
    expect(JSON.stringify(preflight)).not.toContain('sourceRef');
  });

  it('un destino que no admite mutaciones no puede correr los POST del flujo', async () => {
    const before = received.length;

    const preflight = await service.preflight({
      suiteId: await suiteId(suiteCode(FLOW.id)),
      environmentId: envReadOnly,
    });

    const posts = FLOW_CASES.filter((c) => c.qaCase.method === 'POST');
    expect(preflight.executable).toBe(false);
    expect(
      preflight.violations
        .filter((v) => v.code === 'MUTATION_NOT_ALLOWED')
        .map((v) => v.caseCode)
        .sort(),
    ).toEqual(posts.map((c) => c.code).sort());
    expect(received.length).toBe(before);
  });

  it('el runner ejecuta el flujo 1.3: cada caso pasa y el destino sólo recibe lo del request', async () => {
    const before = received.length;

    const { plan, done } = await runPlan(
      await suiteId(suiteCode(FLOW.id)),
      'flows-it-1',
    );

    expect(done.counters).toEqual({
      requestsSent: FLOW_CASES.length,
      casesPassed: FLOW_CASES.length,
      casesFailed: 0,
      casesNotRun: 0,
    });
    const calls = received.slice(before);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(
      FLOW_CASES.map((c) => `${c.qaCase.method} ${c.qaCase.path}`),
    );
    // La credencial es la del destino, nunca la del artefacto.
    expect(
      calls.every((c) => c.headers.authorization === 'Bearer qa-flows-it'),
    ).toBe(true);
    // Las cabeceras del caso viajan; el caso 422 prueba justamente su ausencia.
    for (const [i, c] of FLOW_CASES.entries()) {
      const wanted = c.qaCase.headers?.['x-tenant-id'];
      expect(calls[i].headers['x-tenant-id']).toBe(wanted);
      expect(calls[i].body).toBe(
        c.qaCase.body === undefined ? '' : JSON.stringify(c.qaCase.body),
      );
    }
    expect(JSON.stringify(calls.map((c) => [c.headers, c.body]))).not.toContain(
      'sourceRef',
    );
    expect(plan.status).toBeDefined();

    // La lectura del portal ve el veredicto de cada rama contra la base real.
    const detail = await flows.detail(FLOW.id);
    const verdicts = detail.nodes
      .flatMap((n) => n.branches)
      .map((b) => b.qaCase)
      .filter((q) => q !== null);
    expect(verdicts).toHaveLength(FLOW_CASES.length);
    for (const q of verdicts) {
      expect(q.seeded).toBe(true);
      expect(q.drifted).toBe(false);
      expect(q.lastResult).toMatchObject({
        status: 'RESULT_PASSED',
        observedStatus: q.expectedStatus,
      });
    }
    expect(detail.qa).toMatchObject({
      casesLinked: FLOW_CASES.length,
      casesMissing: 0,
      passed: FLOW_CASES.length,
      failed: 0,
    });
  });

  it('si la API cambia de respuesta, la rama falla con el valor observado', async () => {
    const broken = FLOW_CASES.find(
      (c) => c.code === 'FLOW-1.3-ver-disponibilidad-NEGATIVE-01',
    )!;
    forced.set(
      keyOf(
        broken.qaCase.method,
        broken.qaCase.path,
        !!broken.qaCase.headers?.['x-tenant-id'],
      ),
      200,
    );

    const { plan, done } = await runPlan(
      await suiteId(suiteCode(FLOW.id)),
      'flows-it-2',
    );
    forced.clear();

    expect(done.counters).toMatchObject({
      casesPassed: FLOW_CASES.length - 1,
      casesFailed: 1,
    });
    const verdict = await sql(
      `SELECT c.code, ar.passed, ar.actual_value, ar.message
         FROM qa_lab.assertion_results ar
         JOIN qa_lab.test_case_results r ON r.id = ar.test_case_result_id
         JOIN qa_lab.test_cases c ON c.id = r.test_case_id
        WHERE r.test_run_id = $1 AND ar.passed = false`,
      [plan.runId],
    );
    expect(verdict.rows).toEqual([
      {
        code: broken.code,
        passed: false,
        actual_value: '200',
        message: 'Se esperaba 400',
      },
    ]);

    // La rama rota aparece como fallida con el estado que la API devolvió.
    const detail = await flows.detail(FLOW.id);
    const branch = detail.nodes
      .find((n) => n.id === 'ver-disponibilidad')!
      .branches.find((b) => b.kind === 'NEGATIVE')!;
    expect(branch.qaCase?.lastResult).toMatchObject({
      status: 'RESULT_FAILED',
      observedStatus: 200,
      message: 'Se esperaba 400',
    });
    expect(detail.qa).toMatchObject({
      passed: FLOW_CASES.length - 1,
      failed: 1,
    });
  });

  it('una rama que sale del artefacto pasa a borrador, no se corre más y conserva su historial', async () => {
    const edited = structuredClone(FLOW_CATALOG) as unknown as FlowDefinition[];
    const flow = edited.find((f) => f.id === '1.3')!;
    const branch = flow.nodes.find((n) => n.id === 'buscar-api')!.branches[1];
    delete (branch as { qaCase?: unknown }).qaCase;
    (branch as { reason?: string }).reason = 'retirada en la prueba';
    const retired = 'FLOW-1.3-buscar-api-EDGE-01';
    const historyBefore = Number(
      (await sql('SELECT count(*) AS n FROM qa_lab.test_case_results')).rows[0]
        .n,
    );

    const result = await seed.run(ENABLED, edited);

    expect(result.changed.retiredCases).toBe(1);
    const row = await sql(
      'SELECT state_concept_id FROM qa_lab.test_cases WHERE code = $1',
      [retired],
    );
    expect(row.rows[0].state_concept_id).toBe(CONCEPTS.CASE_DRAFT);
    const preflight = await service.preflight({
      suiteId: await suiteId('FLOW-1.3'),
      environmentId: envId,
    });
    expect(preflight.steps).toHaveLength(FLOW_CASES.length - 1);
    expect(
      Number(
        (await sql('SELECT count(*) AS n FROM qa_lab.test_case_results'))
          .rows[0].n,
      ),
    ).toBe(historyBefore);
  });
});
