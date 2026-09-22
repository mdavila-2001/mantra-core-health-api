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
import { QaLabReadService } from '../../src/modules/qa_lab/services/qa-lab-read.service';
import { CONCEPTS, type AuthenticatedUser } from '../../src/common';

/**
 * Runner de QA en el servidor contra PostgreSQL real (DDL canónico del
 * módulo 36 + patch v4.2.20) y un servidor HTTP real como destino. El
 * servidor de prueba registra cada petición: así se puede afirmar que un plan
 * bloqueado, cancelado o con deriva NO llamó a nada.
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL` (base desechable). Recrea `qa_lab` y
 * `qa_execution`.
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const root = process.cwd();

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
const SECRET = 'qa-token-canario-7f3e9a';

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return (
      (error as { getStatus?: () => number }).getStatus?.() ??
      `threw ${(error as Error).message}`
    );
  }
}

describeIfDb('QA runner en el servidor (integración real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  let service: QaExecutionService;
  let read: QaLabReadService;
  let firstRunId: string;
  let server: Server;
  let port: number;
  const received: Array<{
    method: string;
    url: string;
    headers: IncomingHttpHeaders;
  }> = [];
  const ids = {
    env: randomUUID(),
    envBlocked: randomUUID(),
    suite: randomUUID(),
    caseOk: randomUUID(),
    caseWrong: randomUUID(),
  };

  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);

  async function drain() {
    // Ejecuta hasta que el worker no encuentre trabajo.
    for (let i = 0; i < 10; i++) {
      const result = await service.runNext(worker);
      if (result.claimed === 0) return;
    }
  }

  beforeAll(async () => {
    server = createServer((req, res) => {
      received.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers,
      });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: req.url }));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    port = (server.address() as AddressInfo).port;
    process.env.QA_TARGET_IT_TOKEN = `Bearer ${SECRET}`;

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
      [ids.env, 'IT-DEV'],
      [ids.envBlocked, 'IT-BLOCKED'],
    ]) {
      await sql(
        `INSERT INTO qa_lab.test_environments (id, code, name, environment_concept_id, base_url,
           is_production_safe, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1, $2, $2, $3, $4, false, $5, now(), now(), 1)`,
        [
          id,
          code,
          CONCEPTS.QA_ENV_DEV,
          `http://127.0.0.1:${port}`,
          CONCEPTS.STATE_ACTIVE,
        ],
      );
    }
    await sql(
      `INSERT INTO qa_lab.test_suites (id, code, name, version, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1, 'IT-SUITE', 'Suite IT', 1, $2, now(), now(), 1)`,
      [ids.suite, CONCEPTS.SUITE_ACTIVE],
    );
    const addCase = async (
      id: string,
      code: string,
      ordinal: number,
      assertions: Array<[string, string, string | null, string]>,
    ) => {
      await sql(
        `INSERT INTO qa_lab.test_cases (id, suite_id, code, name, http_method_concept_id, request_path,
           setup_json, ordinal, state_concept_id, created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, now(), now(), 1)`,
        [
          id,
          ids.suite,
          code,
          CONCEPTS.HTTP_GET,
          `/api/${code.toLowerCase()}`,
          // El caso intenta colar su propia credencial: el runner debe descartarla.
          JSON.stringify({
            request: {
              headers: { authorization: 'Bearer del-caso', 'x-trace': 'it' },
            },
          }),
          ordinal,
          CONCEPTS.CASE_ACTIVE,
        ],
      );
      for (const [
        n,
        [type, operator, path, expected],
      ] of assertions.entries()) {
        await sql(
          `INSERT INTO qa_lab.test_assertions (id, test_case_id, assertion_type_concept_id, json_path,
             operator_concept_id, expected_value, ordinal, created_at, updated_at, row_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), 1)`,
          [randomUUID(), id, type, path, operator, expected, n + 1],
        );
      }
    };
    await addCase(ids.caseOk, 'OK', 1, [
      [CONCEPTS.ASSERTION_STATUS_CODE, CONCEPTS.OPERATOR_EQUALS, null, '200'],
      [CONCEPTS.ASSERTION_JSON_PATH, CONCEPTS.OPERATOR_EQUALS, '$.ok', 'true'],
    ]);
    // Aserción deliberadamente falsa: el servidor responde 200. Con el
    // evaluador anterior (que no miraba la respuesta) este caso "pasaba".
    await addCase(ids.caseWrong, 'WRONG', 2, [
      [CONCEPTS.ASSERTION_STATUS_CODE, CONCEPTS.OPERATOR_EQUALS, null, '500'],
    ]);

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
    service = new QaExecutionService(em, runs, new GuardedHttpClient(), silent);
    read = new QaLabReadService(orm.em.fork());

    await service.upsertTarget(
      ids.env,
      {
        scheme: 'http',
        host: '127.0.0.1',
        port,
        allowedPathPrefixes: ['/api'],
        allowPrivateNetwork: true,
        authSecretRef: 'QA_TARGET_IT_TOKEN',
        minIntervalMs: 0,
      } as never,
      approver,
    );
    await service.upsertTarget(
      ids.envBlocked,
      {
        scheme: 'http',
        host: '127.0.0.1',
        port,
        allowedPathPrefixes: ['/api'],
        allowPrivateNetwork: false,
        minIntervalMs: 0,
      } as never,
      approver,
    );
  }, 120_000);

  afterAll(async () => {
    delete process.env.QA_TARGET_IT_TOKEN;
    await orm?.close(true);
    await client?.end();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('el preflight explica el plan sin llamar a nada', async () => {
    const before = received.length;
    const preflight = await service.preflight({
      suiteId: ids.suite,
      environmentId: ids.env,
    });
    expect(preflight).toMatchObject({
      executable: true,
      requiresApproval: true,
      approvalReasons: ['PRIVATE_NETWORK_TARGET'],
      target: {
        authSecretRef: 'QA_TARGET_IT_TOKEN',
        authSecretConfigured: true,
      },
    });
    expect(preflight.steps.map((s) => s.url)).toEqual([
      `http://127.0.0.1:${port}/api/ok`,
      `http://127.0.0.1:${port}/api/wrong`,
    ]);
    expect(JSON.stringify(preflight)).not.toContain(SECRET);
    expect(received.length).toBe(before);
  });

  it('aprobación: por otra persona, del hash vigente; luego el worker ejecuta y evalúa de verdad', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.env },
      'it-key-1',
      requester,
    );
    expect(plan.status).toBe('PENDING_APPROVAL');
    // Sin aprobación, el worker no lo toma.
    expect(await service.runNext(worker)).toEqual({ claimed: 0 });

    const approval = {
      decision: 'APPROVED' as const,
      planHash: plan.planHash,
      reason: 'Revisado: sólo GET a staging local',
    };
    expect(await statusOf(service.approve(plan.id, approval, requester))).toBe(
      403,
    );
    expect(
      await statusOf(
        service.approve(
          plan.id,
          { ...approval, planHash: '0'.repeat(64) },
          approver,
        ),
      ),
    ).toBe(409);
    expect((await service.approve(plan.id, approval, approver)).status).toBe(
      'QUEUED',
    );

    const before = received.length;
    const result = await service.runNext(worker);
    expect(result).toMatchObject({
      claimed: 1,
      planId: plan.id,
      status: 'FAILED',
    });
    firstRunId = plan.runId;
    const done = await service.getPlan(plan.id);
    expect(done.counters).toEqual({
      requestsSent: 2,
      casesPassed: 1,
      casesFailed: 1,
      casesNotRun: 0,
    });
    expect(done.events.map((e) => e.kind)).toEqual([
      'PLAN_CREATED',
      'PLAN_APPROVED',
      'PLAN_STARTED',
      'CASE_PASSED',
      'CASE_FAILED',
      'PLAN_FINISHED',
    ]);

    // El destino recibió exactamente dos GET con la credencial del destino, no la del caso.
    const calls = received.slice(before);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'GET /api/ok',
      'GET /api/wrong',
    ]);
    expect(
      calls.every((c) => c.headers.authorization === `Bearer ${SECRET}`),
    ).toBe(true);
    expect(calls[0].headers['x-trace']).toBe('it');

    // La evidencia del módulo 36: corrida fallida, valor observado, y el secreto redactado.
    const run = await sql(
      'SELECT status_concept_id, total_passed, total_failed FROM qa_lab.test_runs WHERE id = $1',
      [plan.runId],
    );
    expect(run.rows[0]).toEqual({
      status_concept_id: CONCEPTS.RUN_FAILED_STATUS,
      total_passed: 1,
      total_failed: 1,
    });
    const verdicts = await sql(
      `SELECT ar.passed, ar.actual_value, ar.message FROM qa_lab.assertion_results ar
         JOIN qa_lab.test_case_results r ON r.id = ar.test_case_result_id
        WHERE r.test_run_id = $1 AND r.test_case_id = $2`,
      [plan.runId, ids.caseWrong],
    );
    expect(verdicts.rows).toEqual([
      { passed: false, actual_value: '200', message: 'Se esperaba 500' },
    ]);
    const stored = await sql(
      `SELECT p.headers_json::text AS h FROM qa_lab.request_payloads p
         JOIN qa_lab.test_case_results r ON r.id = p.test_case_result_id WHERE r.test_run_id = $1`,
      [plan.runId],
    );
    const everything = stored.rows.map((r) => r.h).join(' ');
    expect(everything).toContain('[redactado]');
    expect(everything).not.toContain(SECRET);
    expect(everything).not.toContain('del-caso');

    // Idempotencia: la misma clave devuelve el mismo plan.
    const again = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.env },
      'it-key-1',
      requester,
    );
    expect(again).toMatchObject({ created: false, plan: { id: plan.id } });
  });

  it('un destino sin autorización de red privada bloquea antes de conectar', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.envBlocked },
      undefined,
      requester,
    );
    expect(plan.status).toBe('QUEUED');
    const before = received.length;
    expect(await service.runNext(worker)).toMatchObject({
      status: 'INFRA_ERROR',
    });
    expect(received.length).toBe(before);
    const events = (await service.getPlan(plan.id)).events.map((e) => e.kind);
    expect(events.filter((k) => k === 'CASE_BLOCKED')).toHaveLength(2);
  });

  it('cancelar en cola lo cierra sin llamar a nada', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.envBlocked },
      undefined,
      requester,
    );
    expect((await service.cancel(plan.id, requester)).status).toBe('CANCELLED');
    const before = received.length;
    expect(await service.runNext(worker)).toEqual({ claimed: 0 });
    expect(received.length).toBe(before);
    expect(await statusOf(service.cancel(plan.id, requester))).toBe(409);
  });

  it('si la suite cambia después de aprobar, no se ejecuta (deriva del plan)', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.env },
      undefined,
      requester,
    );
    await service.approve(
      plan.id,
      {
        decision: 'APPROVED',
        planHash: plan.planHash,
        reason: 'Aprobado antes del cambio',
      },
      approver,
    );
    await sql(
      `UPDATE qa_lab.test_cases SET request_path = '/api/ok?all=1' WHERE id = $1`,
      [ids.caseOk],
    );
    const before = received.length;
    expect(await service.runNext(worker)).toMatchObject({
      status: 'INFRA_ERROR',
    });
    expect((await service.getPlan(plan.id)).error).toMatchObject({
      code: 'PLAN_DRIFT',
    });
    expect(received.length).toBe(before);
    await sql(
      `UPDATE qa_lab.test_cases SET request_path = '/api/ok' WHERE id = $1`,
      [ids.caseOk],
    );
  });

  it('una aprobación vencida devuelve el plan a espera, sin ejecutar', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.env },
      undefined,
      requester,
    );
    await service.approve(
      plan.id,
      {
        decision: 'APPROVED',
        planHash: plan.planHash,
        reason: 'Aprobación que va a vencer',
      },
      approver,
    );
    await sql(
      `UPDATE qa_execution.plan_approvals SET expires_at = now() - interval '1 minute' WHERE plan_id = $1`,
      [plan.id],
    );
    const before = received.length;
    expect(await service.runNext(worker)).toMatchObject({
      status: 'PENDING_APPROVAL',
      reason: 'APPROVAL_EXPIRED',
    });
    expect(received.length).toBe(before);
    await service.cancel(plan.id, requester);
  });

  it('un worker perdido a mitad de plan no se reintenta (no duplica efectos)', async () => {
    const { plan } = await service.createPlan(
      { suiteId: ids.suite, environmentId: ids.envBlocked },
      undefined,
      requester,
    );
    // Simula un worker que tomó el plan y murió.
    await sql(
      `UPDATE qa_execution.execution_plans SET status = 'RUNNING', attempt = 1, lease_owner = 'muerto',
              lease_expires_at = now() - interval '1 second' WHERE id = $1`,
      [plan.id],
    );
    const before = received.length;
    expect(await service.runNext(worker)).toMatchObject({
      planId: plan.id,
      status: 'INFRA_ERROR',
    });
    expect((await service.getPlan(plan.id)).error).toMatchObject({
      code: 'WORKER_LOST',
    });
    expect(received.length).toBe(before);
  });

  it('sin la variable del secreto no se ejecuta nada', async () => {
    const saved = process.env.QA_TARGET_IT_TOKEN;
    delete process.env.QA_TARGET_IT_TOKEN;
    try {
      const { plan } = await service.createPlan(
        { suiteId: ids.suite, environmentId: ids.env },
        undefined,
        requester,
      );
      await service.approve(
        plan.id,
        {
          decision: 'APPROVED',
          planHash: plan.planHash,
          reason: 'Prueba de secreto ausente',
        },
        approver,
      );
      const before = received.length;
      await drain();
      expect((await service.getPlan(plan.id)).error).toMatchObject({
        code: 'SECRET_MISSING',
      });
      expect(received.length).toBe(before);
    } finally {
      process.env.QA_TARGET_IT_TOKEN = saved;
    }
  });

  it('un destino de producción no admite mutaciones', async () => {
    await sql(
      `UPDATE qa_lab.test_environments SET environment_concept_id = $1 WHERE id = $2`,
      [CONCEPTS.QA_ENV_PRODUCTION, ids.envBlocked],
    );
    expect(
      await statusOf(
        service.upsertTarget(
          ids.envBlocked,
          {
            scheme: 'http',
            host: '127.0.0.1',
            port,
            allowedPathPrefixes: ['/api'],
            allowMutations: true,
          } as never,
          approver,
        ),
      ),
    ).toBe(422);
  });

  it('la lectura del portal muestra la corrida con veredictos y códigos legibles', async () => {
    const run = await read.getRun(firstRunId);
    expect(run).toMatchObject({
      status: 'RUN_FAILED_STATUS',
      totals: { passed: 1, failed: 1 },
    });
    const wrong = run.results.find((r) => r.caseCode === 'WRONG')!;
    expect(wrong).toMatchObject({
      status: 'RESULT_FAILED',
      errorType: 'ERR_ASSERTION',
    });
    expect(wrong.assertions).toEqual([
      expect.objectContaining({
        passed: false,
        actualValue: '200',
        message: 'Se esperaba 500',
      }),
    ]);
    const suites = await read.listSuites();
    expect(suites[0]).toMatchObject({
      code: 'IT-SUITE',
      state: 'SUITE_ACTIVE',
      activeCases: 2,
    });
    expect(suites[0].lastRun).not.toBeNull();
    const detail = await read.getSuite(ids.suite);
    expect(detail.cases[0]).toMatchObject({
      method: 'GET',
      assertions: [
        { type: 'ASSERT_STATUS', operator: 'OP_EQ' },
        expect.anything(),
      ],
    });
  });
});
