import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { CONCEPTS, SEED } from '../../src/common';
import { HttpSliAggregator } from '../../src/observability/http-sli/http-sli.aggregator';
import { HttpSliFlushService } from '../../src/observability/http-sli/http-sli-flush.service';
import type { RouteIndexService } from '../../src/observability/route-index/route-index.service';
import * as seriesEntities from '../../src/modules/time_series/entities';
import { SeriesIngestRepository } from '../../src/modules/time_series/repositories';
import { OpsTrafficRepository } from '../../src/modules/ops_console/ops-traffic.repository';
import { OpsTrafficService } from '../../src/modules/ops_console/ops-traffic.service';

/**
 * Tráfico HTTP (consola de operación) contra PostgreSQL real: lo que escribe
 * `http-sli` es lo que lee `/admin/ops/traffic*`, sin mocks de base.
 *
 * Opt-in: `OPS_TRAFFIC_IT_DB_URL` debe apuntar a una base DESECHABLE con el DDL
 * de `database/SQL` (+ `time_series`) ya aplicado. La suite inserta y borra filas
 * dentro de una ventana fija del pasado y crea un rol sin privilegios para
 * ejercer RLS: nunca contra una base compartida. Sin la variable se omite, y
 * una omisión no es un resultado aprobado.
 *
 *   OPS_TRAFFIC_IT_DB_URL=postgres://postgres@localhost:54329/alovida \
 *     yarn test:integration test/integration/ops-traffic.int-spec.ts
 *
 * Límites declarados: `iam.sessions` se siembra con las FK desactivadas
 * (`session_replication_role = replica`) porque sólo se lee su conteo; y la
 * tabla de series se prueba como tabla común, no como hipertabla.
 */
const DB_URL = process.env.OPS_TRAFFIC_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;

const DAY = '2020-03-10';
const FROM = `${DAY}T00:00:00.000Z`;
const TO = `${DAY}T23:59:59.000Z`;
const at = (hhmmss: string) => new Date(`${DAY}T${hhmmss}.000Z`);
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const silentLogger = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
} as never;

const routes = {
  lookup: (method: string, route: string) =>
    method === 'GET' && route === '/patients/:id'
      ? { operationId: 'PatientsController_get' }
      : undefined,
} as unknown as RouteIndexService;

async function initOrm(url: string): Promise<MikroORM> {
  return MikroORM.init({
    clientUrl: url,
    entities: Object.values(seriesEntities),
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
    forceUtcTimezone: true,
    allowGlobalContext: true,
    debug: false,
  });
}

function stackOn(orm: MikroORM) {
  const aggregator = new HttpSliAggregator();
  const flush = new HttpSliFlushService(
    orm,
    new SeriesIngestRepository(),
    aggregator,
    { enabled: true, flushSeconds: 60 },
    silentLogger,
  );
  const service = new OpsTrafficService(
    new OpsTrafficRepository(orm.em),
    routes,
  );
  return { aggregator, flush, service };
}

describeIfDb('Tráfico HTTP de operación (integración, PostgreSQL real)', () => {
  let orm: MikroORM;
  let client: pg.Client;
  const sql = (text: string, params?: unknown[]) => client.query(text, params);

  const wipe = async () => {
    await sql(
      "DELETE FROM time_series.service_sli_series WHERE time >= $1 AND time < $2 AND series_id LIKE 'http|%'",
      [FROM, `${DAY}T23:59:59.999Z`],
    );
  };

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    orm = await initOrm(DB_URL as string);
  });

  afterAll(async () => {
    await wipe();
    await orm?.close(true);
    await client?.end();
  });

  beforeEach(wipe);

  describe('escritura de http-sli → lectura de operación', () => {
    it('suma exacta de lo escrito, sin identificadores en la respuesta', async () => {
      const { aggregator, flush, service } = stackOn(orm);
      // 17 bien (2xx) y 2 sin token + 1 ruta inexistente, en dos minutos.
      for (let i = 0; i < 10; i++) {
        aggregator.record({
          method: 'GET',
          route: '/patients/:id',
          status: 200,
          durationMs: 20,
          at: at('10:00:10'),
        });
      }
      for (let i = 0; i < 7; i++) {
        aggregator.record({
          method: 'GET',
          route: '/patients/:id',
          status: 200,
          durationMs: 400,
          at: at('10:01:10'),
        });
      }
      for (let i = 0; i < 2; i++) {
        aggregator.record({
          method: 'GET',
          route: '/patients/:id',
          status: 401,
          durationMs: 3,
          at: at('10:01:30'),
        });
      }
      aggregator.record({
        method: 'GET',
        route: 'UNMATCHED',
        status: 404,
        durationMs: 2,
        at: at('10:01:40'),
      });

      // 3 filas: (10:00, patients), (10:01, patients: 200 y 401 juntos) y (10:01, UNMATCHED).
      expect(await flush.flush()).toBe(3);

      const [{ total }] = (
        await sql(
          "SELECT COALESCE(SUM(denominator),0)::int AS total FROM time_series.service_sli_series WHERE time >= $1 AND time < $2 AND series_id LIKE 'http|%'",
          [FROM, TO],
        )
      ).rows;
      expect(total).toBe(20);

      const out = await service.traffic({ from: FROM, to: TO });
      expect(out.measured.requests).toBe(total);
      expect(out.measured.succeeded).toBe(17);
      expect(out.measured.failed).toEqual({ client4xx: 3, server5xx: 0 });
      expect(out.measured.successRatio).toBe(0.85);
      expect(out.measured.latencyMs.max).toBe(400);
      expect(out.measured.latencyMs.p95).not.toBeNull();
      expect(out.measured.lastDataAt).toBe(`${DAY}T10:01:00.000Z`);
      expect(out.series).toHaveLength(1);
      expect(out.series[0]).toMatchObject({
        bucket: `${DAY}T10:00:00.000Z`,
        requests: 20,
        failed4xx: 3,
      });
      expect(JSON.stringify(out)).not.toMatch(UUID_RE);

      const ep = await service.endpoints({ from: FROM, to: TO });
      expect(ep.items.map((i) => [i.method, i.route, i.requests])).toEqual([
        ['GET', '/patients/:id', 19],
        ['GET', 'UNMATCHED', 1],
      ]);
      expect(ep.items[0].operationId).toBe('PatientsController_get');
      expect(ep.items[1].operationId).toBeNull();
      expect(ep.items[0].failed4xx).toBe(2);
      expect(JSON.stringify(ep)).not.toMatch(UUID_RE);
    });

    it('una ventana sin filas responde ceros y nulos', async () => {
      const { service } = stackOn(orm);
      const out = await service.traffic({ from: FROM, to: TO });
      expect(out.measured.requests).toBe(0);
      expect(out.measured.successRatio).toBeNull();
      expect(out.measured.latencyMs.p95).toBeNull();
      expect(out.series).toEqual([]);
      const ep = await service.endpoints({ from: FROM, to: TO });
      expect(ep.items).toEqual([]);
      expect(ep.truncated).toBe(false);
    });

    it('una fila con dimensiones corruptas cuenta 0 y no rompe la lectura', async () => {
      await sql(
        `INSERT INTO time_series.service_sli_series
           (time, tenant_id, series_id, ingestion_id, source_version, quality_state,
            service_id, sli_code, numerator, denominator, value, dimensions)
         VALUES ($1, $2, 'http|GET|/rota', $3, 'it', 'received', $3, 'http_requests',
                 4, 5, 0.8, '{"codes":{"4xx":"abc","5xx":null},"latency":{"sumMs":"x","buckets":{"inf":"y","le5":[1]}}}')`,
        [`${DAY}T11:00:00Z`, SEED.tenantId, randomUUID()],
      );
      const { service } = stackOn(orm);
      const out = await service.traffic({ from: FROM, to: TO });
      expect(out.measured.requests).toBe(5);
      expect(out.measured.failed).toEqual({ client4xx: 0, server5xx: 0 });
      expect(out.measured.latencyMs.p95).toBeNull();
    });

    it('sólo cuenta la serie http de la plataforma y la ventana pedida', async () => {
      const otro = randomUUID();
      const insert = (
        time: string,
        tenant: string,
        series: string,
        code: string,
      ) =>
        sql(
          `INSERT INTO time_series.service_sli_series
             (time, tenant_id, series_id, ingestion_id, source_version, quality_state,
              service_id, sli_code, numerator, denominator, value, dimensions)
           VALUES ($1, $2, $3, $4, 'it', 'received', $4, $5, 1, 1, 1, '{}')`,
          [time, tenant, series, randomUUID(), code],
        );
      await insert(
        `${DAY}T12:00:00Z`,
        SEED.tenantId,
        'http|GET|/dentro',
        'http_requests',
      );
      await insert(
        `${DAY}T12:00:00Z`,
        otro,
        'http|GET|/otro-tenant',
        'http_requests',
      );
      await insert(
        `${DAY}T12:00:00Z`,
        SEED.tenantId,
        'http|GET|/otro-sli',
        'availability',
      );
      await insert(
        `${DAY}T12:00:00Z`,
        SEED.tenantId,
        'job|GET|/no-http',
        'http_requests',
      );
      await insert(
        '2020-03-09T23:59:00Z',
        SEED.tenantId,
        'http|GET|/ayer',
        'http_requests',
      );
      const { service } = stackOn(orm);
      const ep = await service.endpoints({ from: FROM, to: TO });
      expect(ep.items.map((i) => i.route)).toEqual(['/dentro']);
      await sql(
        "DELETE FROM time_series.service_sli_series WHERE series_id IN ('http|GET|/otro-tenant','http|GET|/otro-sli','job|GET|/no-http','http|GET|/ayer')",
      );
    });
  });

  describe('usuarios activos desde iam.sessions', () => {
    const created: string[] = [];

    afterEach(async () => {
      if (created.length === 0) return;
      await sql('DELETE FROM iam.sessions WHERE id = ANY($1::uuid[])', [
        created,
      ]);
      created.length = 0;
    });

    async function seed(
      userId: string,
      state: string,
      expiresInMs: number,
      createdAt: string,
    ) {
      const id = randomUUID();
      created.push(id);
      await sql("SET session_replication_role = 'replica'");
      await sql(
        `INSERT INTO iam.sessions
           (id, user_id, token_id, state_concept_id, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now() + ($5 || ' milliseconds')::interval, $6, $6)`,
        [id, userId, `it-${id}`, state, String(expiresInMs), createdAt],
      );
      await sql("SET session_replication_role = 'origin'");
    }

    it('separa vigentes ahora de los de la ventana y no repite al usuario', async () => {
      const { service } = stackOn(orm);
      const before = (await service.traffic({ from: FROM, to: TO })).measured
        .activeUsers;
      const ana = randomUUID();
      const beto = randomUUID();
      await seed(ana, CONCEPTS.STATE_ACTIVE, 3_600_000, `${DAY}T09:00:00Z`);
      await seed(ana, CONCEPTS.STATE_ACTIVE, 3_600_000, `${DAY}T09:30:00Z`);
      await seed(beto, CONCEPTS.STATE_ACTIVE, -60_000, `${DAY}T09:45:00Z`);
      await seed(randomUUID(), randomUUID(), 3_600_000, '2020-03-01T00:00:00Z');

      const after = (await service.traffic({ from: FROM, to: TO })).measured
        .activeUsers;
      expect(after.sessionsActiveNow - before.sessionsActiveNow).toBe(2);
      expect(after.usersActiveNow - before.usersActiveNow).toBe(1);
      // ana (2 sesiones) y beto (vencida, pero abrió sesión ese día): 2 distintos.
      expect(after.usersActiveInWindow - before.usersActiveInWindow).toBe(2);
      expect(JSON.stringify(after)).not.toMatch(UUID_RE);
    });
  });

  describe('con RLS forzado y un rol sin privilegios', () => {
    const ROLE = 'ops_traffic_it';
    let restricted: MikroORM;
    let envBackup: string | undefined;

    beforeAll(async () => {
      await sql(`DROP OWNED BY ${ROLE}`).catch(() => undefined);
      await sql(`DROP ROLE IF EXISTS ${ROLE}`);
      await sql(
        `CREATE ROLE ${ROLE} LOGIN PASSWORD 'it' NOSUPERUSER NOBYPASSRLS`,
      );
      await sql(`GRANT USAGE ON SCHEMA time_series, iam TO ${ROLE}`);
      await sql(
        `GRANT SELECT, INSERT ON time_series.service_sli_series TO ${ROLE}`,
      );
      await sql(`GRANT SELECT ON iam.sessions TO ${ROLE}`);
      const url = new URL(DB_URL as string);
      url.username = ROLE;
      url.password = 'it';
      restricted = await initOrm(url.toString());
      envBackup = process.env.RLS_ENFORCE;
    });

    afterAll(async () => {
      process.env.RLS_ENFORCE = envBackup;
      if (envBackup === undefined) delete process.env.RLS_ENFORCE;
      await restricted?.close(true);
      await sql(`DROP OWNED BY ${ROLE}`);
      await sql(`DROP ROLE IF EXISTS ${ROLE}`);
    });

    it('con RLS_ENFORCE=true escribe y lee bajo el tenant de plataforma', async () => {
      process.env.RLS_ENFORCE = 'true';
      const { aggregator, flush, service } = stackOn(restricted);
      aggregator.record({
        method: 'GET',
        route: '/patients/:id',
        status: 200,
        durationMs: 10,
        at: at('15:00:05'),
      });
      expect(await flush.flush()).toBe(1);
      const out = await service.traffic({ from: FROM, to: TO });
      expect(out.measured.requests).toBe(1);
    });

    it('sin RLS_ENFORCE el mismo rol no ve nada: la política exige el contexto', async () => {
      process.env.RLS_ENFORCE = 'true';
      const seeded = stackOn(restricted);
      seeded.aggregator.record({
        method: 'GET',
        route: '/patients/:id',
        status: 200,
        durationMs: 10,
        at: at('15:00:05'),
      });
      await seeded.flush.flush();

      process.env.RLS_ENFORCE = 'false';
      const blind = stackOn(restricted);
      const out = await blind.service.traffic({ from: FROM, to: TO });
      expect(out.measured.requests).toBe(0);
    });
  });
});
