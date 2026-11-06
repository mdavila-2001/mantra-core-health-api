import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Redis from 'ioredis';
import pg from 'pg';
import { SEED } from '../../src/common/constants/concepts';
import { PLATFORM_OPS } from '../../src/modules/platform_ops/platform_ops.concepts';
import { RUNTIME_PIECE_KIND } from '../../src/modules/platform_ops/runtime_pieces/runtime-pieces.concepts';
import { loadInstanceLivenessEnv } from '../../src/modules/ops_console/domain/instance-liveness.env';
import {
  HEARTBEAT_HASH_KEY,
  InstanceHeartbeatRepository,
  type StoredHeartbeat,
} from '../../src/modules/ops_console/infrastructure/repositories/instance-heartbeat.repository';
import { HeartbeatReader } from '../../src/modules/platform_ops/runtime_pieces/heartbeat-reader';
import { RuntimePiecesRepository } from '../../src/modules/platform_ops/runtime_pieces/runtime-pieces.repository';
import {
  RUNTIME_PIECES_TENANT_ID,
  RuntimePiecesSeedService,
} from '../../src/modules/platform_ops/runtime_pieces/runtime-pieces-seed.service';
import { RuntimePiecesService } from '../../src/modules/platform_ops/runtime_pieces/runtime-pieces.service';
import { ScanCache } from '../../src/modules/platform_ops/runtime_pieces/scan-cache';
import { scanRuntimePieces } from '../../src/modules/platform_ops/runtime_pieces/scanner/runtime-piece-scanner';
import type { ScanResult } from '../../src/modules/platform_ops/runtime_pieces/runtime-pieces.types';
import type { SqlPort } from '../../src/modules/platform_ops/runtime_pieces/sql-port';

/**
 * Registro de piezas ejecutables contra PostgreSQL REAL.
 *
 * Opt-in: `RUNTIME_PIECES_IT_DB_URL` debe apuntar a una base DESECHABLE (la
 * suite crea y borra el esquema `platform_ops` de prueba). Sin la variable se
 * omite, y una omisión no es un resultado aprobado.
 *
 *   RUNTIME_PIECES_IT_DB_URL=postgres://postgres@127.0.0.1:54329/rtp_it \
 *     yarn test:integration test/integration/runtime-pieces.int-spec.ts
 *
 * Qué usa de verdad: el DDL de `tool_registry` y su índice único, leídos de
 * `database/SQL/46_platform_ops` (no copiados), el repositorio, el seeder y el
 * escáner sobre el código de este repositorio. Qué NO es real: `terminology.
 * catalog_concepts` y `directory.tenants` son tablas mínimas de una sola columna
 * (`id`), porque el seeder sólo comprueba que existan; sus FK reales hacia
 * `tool_registry` no se aplican (database/SQL/.../03_fk_intra.sql y
 * 90_fk_deferred.sql). No hay worker ni API en marcha.
 */
const DB_URL = process.env.RUNTIME_PIECES_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
/** Redis DESECHABLE (p. ej. `redis://127.0.0.1:63791`): sólo para el contraste con latidos reales. */
const REDIS_URL = process.env.RUNTIME_PIECES_IT_REDIS_URL;
const itRedis = REDIS_URL ? it : it.skip;

const SQL_DIR = join(process.cwd(), 'database', 'SQL', '46_platform_ops');

function tableDdl(): string {
  const text = readFileSync(join(SQL_DIR, '02_tables.sql'), 'utf8');
  const match =
    /CREATE TABLE IF NOT EXISTS "platform_ops"\."tool_registry" \([\s\S]*?\n\);/.exec(
      text,
    );
  if (!match) throw new Error('No se encontró el DDL de tool_registry');
  return match[0];
}

function uniqueIndexDdl(): string {
  const text = readFileSync(join(SQL_DIR, '04_indexes.sql'), 'utf8');
  const match =
    /CREATE UNIQUE INDEX IF NOT EXISTS "uq_tool_registry_code"[^;]*;/.exec(
      text,
    );
  if (!match)
    throw new Error('No se encontró el índice único de tool_registry');
  return match[0];
}

/** Convierte `?` en `$n`, que es lo que habla `pg` (el driver del ORM usa `?`). */
function toPg(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${(n += 1)}`);
}

class PgSqlPort implements SqlPort {
  constructor(
    private readonly pool: pg.Pool,
    private readonly client?: pg.PoolClient,
  ) {}

  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    const runner = this.client ?? this.pool;
    const result = await runner.query(toPg(sql), [...params]);
    return result.rows as T[];
  }

  async transaction<R>(work: (tx: SqlPort) => Promise<R>): Promise<R> {
    if (this.client) return work(this);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Igual que MikroSqlPort: contexto de sistema LOCAL a la transacción.
      await client.query(
        "select set_config('app.system_context', 'true', true)",
      );
      const result = await work(new PgSqlPort(this.pool, client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

describeIfDb('piezas ejecutables contra PostgreSQL real', () => {
  const pool = new pg.Pool({ connectionString: DB_URL, max: 4 });
  const db = new PgSqlPort(pool);
  const seed = new RuntimePiecesSeedService(new RuntimePiecesRepository());
  const options = {
    actorUserId: null,
    now: new Date('2026-10-31T10:00:00.000Z'),
  };
  let scan: ScanResult;

  const rows = <T>(sql: string, params: unknown[] = []) =>
    db.query<T>(sql, params);
  const registryDigest = async () =>
    (
      await rows<{ digest: string }>(
        `SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY code), '')) AS digest
         FROM platform_ops.tool_registry t`,
      )
    )[0].digest;
  const count = async () =>
    Number(
      (
        await rows<{ n: string }>(
          'SELECT count(*) AS n FROM platform_ops.tool_registry',
        )
      )[0].n,
    );

  beforeAll(async () => {
    await pool.query('DROP SCHEMA IF EXISTS platform_ops CASCADE');
    await pool.query('CREATE SCHEMA IF NOT EXISTS terminology');
    await pool.query('CREATE SCHEMA IF NOT EXISTS directory');
    await pool.query(
      'CREATE TABLE IF NOT EXISTS terminology.catalog_concepts (id uuid PRIMARY KEY)',
    );
    await pool.query(
      'CREATE TABLE IF NOT EXISTS directory.tenants (id uuid PRIMARY KEY)',
    );
    await pool.query('CREATE SCHEMA platform_ops');
    await pool.query(tableDdl());
    await pool.query(uniqueIndexDdl());
    for (const id of [
      ...Object.values(RUNTIME_PIECE_KIND),
      PLATFORM_OPS.TOOL_STATE_ACTIVE,
    ]) {
      await pool.query(
        'INSERT INTO terminology.catalog_concepts (id) VALUES ($1) ON CONFLICT DO NOTHING',
        [id],
      );
    }
    await pool.query(
      'INSERT INTO directory.tenants (id) VALUES ($1) ON CONFLICT DO NOTHING',
      [SEED.tenantId],
    );
    scan = await scanRuntimePieces(process.cwd());
  }, 120_000);

  afterAll(async () => {
    await pool.end();
  });

  it('el escáner leyó el código real', () => {
    expect(scan.available).toBe(true);
    expect(scan.pieces.length).toBeGreaterThan(100);
  });

  it('1.ª corrida: inserta cada pieza una vez, con su id determinista, tipo, estado y procedencia', async () => {
    const report = await seed.run(db, scan, options);
    expect(report).toMatchObject({
      created: scan.pieces.length,
      updated: 0,
      unchanged: 0,
      orphans: 0,
      conflicts: 0,
    });
    expect(await count()).toBe(scan.pieces.length);

    const [sample] = await rows<{
      id: string;
      code: string;
      purpose: string;
      is_approved: boolean;
      tenant_id: string;
      state: string;
      row_version: number;
    }>(
      `SELECT id, code, purpose, is_approved, tenant_id, state_concept_id AS state, row_version
         FROM platform_ops.tool_registry WHERE code = 'rtp.proceso.api'`,
    );
    expect(sample.tenant_id).toBe(RUNTIME_PIECES_TENANT_ID);
    expect(sample.state).toBe(PLATFORM_OPS.TOOL_STATE_ACTIVE);
    expect(sample.is_approved).toBe(false);
    expect(sample.row_version).toBe(1);
    expect(sample.purpose).toContain('fuente: descubrimiento-estatico');
    expect(sample.purpose).toMatch(/evidencia: src\/main\.ts:\d+/);
    expect(sample.purpose).toContain('descubierto: 2026-10-31');
  });

  it('2.ª corrida: no inserta ni cambia NADA (mismo resumen de la tabla, byte a byte)', async () => {
    const before = await registryDigest();
    const report = await seed.run(db, scan, {
      actorUserId: null,
      now: new Date('2026-11-05T09:00:00.000Z'),
    });
    expect(report).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: scan.pieces.length,
      orphans: 0,
      conflicts: 0,
    });
    expect(await registryDigest()).toBe(before);
    expect(await count()).toBe(scan.pieces.length);
  });

  it('consultas de verificación: sin duplicados, sin tipos nulos, sin huérfanos, ids como se esperan', async () => {
    const dup = await rows<{ code: string }>(
      'SELECT code FROM platform_ops.tool_registry GROUP BY code HAVING count(*) > 1',
    );
    expect(dup).toEqual([]);
    const nulls = await rows<{ n: string }>(
      'SELECT count(*) AS n FROM platform_ops.tool_registry WHERE tool_type_concept_id IS NULL OR state_concept_id IS NULL OR purpose IS NULL OR name IS NULL',
    );
    expect(Number(nulls[0].n)).toBe(0);
    const foreign = await rows<{ n: string }>(
      "SELECT count(*) AS n FROM platform_ops.tool_registry WHERE code NOT LIKE 'rtp.%'",
    );
    expect(Number(foreign[0].n)).toBe(0);
    const stored = new Set(
      (
        await rows<{ code: string }>(
          'SELECT code FROM platform_ops.tool_registry',
        )
      ).map((r) => r.code),
    );
    expect(scan.pieces.every((p) => stored.has(p.id))).toBe(true);
  });

  it('un cambio en el código actualiza SÓLO esa fila y sube su versión; las demás no se tocan', async () => {
    const target = scan.pieces.find((p) => p.id === 'rtp.proceso.api')!;
    const changed: ScanResult = {
      ...scan,
      pieces: scan.pieces.map((p) =>
        p === target
          ? { ...p, evidence: { ...p.evidence, line: p.evidence.line + 100 } }
          : p,
      ),
    };
    const others = await rows<{ digest: string }>(
      `SELECT md5(string_agg(t::text, '|' ORDER BY code)) AS digest FROM platform_ops.tool_registry t WHERE code <> 'rtp.proceso.api'`,
    );
    const report = await seed.run(db, changed, {
      actorUserId: null,
      now: new Date('2026-11-06T09:00:00.000Z'),
    });
    expect(report).toMatchObject({
      created: 0,
      updated: 1,
      updatedIds: ['rtp.proceso.api'],
    });
    const [row] = await rows<{ row_version: number; purpose: string }>(
      "SELECT row_version, purpose FROM platform_ops.tool_registry WHERE code = 'rtp.proceso.api'",
    );
    expect(row.row_version).toBe(2);
    expect(row.purpose).toContain('descubierto: 2026-11-06');
    const othersAfter = await rows<{ digest: string }>(
      `SELECT md5(string_agg(t::text, '|' ORDER BY code)) AS digest FROM platform_ops.tool_registry t WHERE code <> 'rtp.proceso.api'`,
    );
    expect(othersAfter[0].digest).toBe(others[0].digest);
  });

  it('lo que desaparece del código se informa como huérfano y la fila queda; una fila deshabilitada por una persona se respeta', async () => {
    await pool.query(
      "UPDATE platform_ops.tool_registry SET state_concept_id = $1 WHERE code = 'rtp.proceso.seed-cli'",
      [PLATFORM_OPS.TOOL_STATE_DISABLED],
    );
    const without = scan.pieces.filter(
      (p) => p.id !== 'rtp.proceso.seed-cli' && p.id !== 'rtp.proceso.api',
    );
    const before = await count();
    const report = await seed.run(db, { ...scan, pieces: without }, options);
    expect(report.orphans).toBe(2);
    expect(report.orphanIds).toEqual([
      'rtp.proceso.api',
      'rtp.proceso.seed-cli',
    ]);
    expect(await count()).toBe(before);
    const [row] = await rows<{ state: string }>(
      "SELECT state_concept_id AS state FROM platform_ops.tool_registry WHERE code = 'rtp.proceso.seed-cli'",
    );
    expect(row.state).toBe(PLATFORM_OPS.TOOL_STATE_DISABLED);
  });

  it('dos descubrimientos simultáneos sobre una tabla vacía no duplican ni se pisan', async () => {
    await pool.query('TRUNCATE platform_ops.tool_registry');
    const [one, two] = await Promise.all([
      seed.run(db, scan, options),
      seed.run(db, scan, options),
    ]);
    expect(one.created + two.created).toBe(scan.pieces.length);
    expect(await count()).toBe(scan.pieces.length);
    const dup = await rows<{ code: string }>(
      'SELECT code FROM platform_ops.tool_registry GROUP BY code HAVING count(*) > 1',
    );
    expect(dup).toEqual([]);
  });

  it('sin los conceptos en el catálogo falla con 422 y no escribe (no una violación de FK cruda)', async () => {
    await pool.query('TRUNCATE platform_ops.tool_registry');
    const removed = RUNTIME_PIECE_KIND.CONECTOR;
    await pool.query('DELETE FROM terminology.catalog_concepts WHERE id = $1', [
      removed,
    ]);
    try {
      await expect(seed.run(db, scan, options)).rejects.toMatchObject({
        status: 422,
      });
      expect(await count()).toBe(0);
    } finally {
      await pool.query(
        'INSERT INTO terminology.catalog_concepts (id) VALUES ($1)',
        [removed],
      );
    }
  });

  it('la unicidad de code la impone la base: un INSERT directo repetido falla', async () => {
    await seed.run(db, scan, options);
    await expect(
      pool.query(
        `INSERT INTO platform_ops.tool_registry (id, code, name, tool_type_concept_id, state_concept_id, created_at, updated_at)
         VALUES (gen_random_uuid(), 'rtp.proceso.api', 'x', $1, $2, now(), now())`,
        [RUNTIME_PIECE_KIND.PROCESO, PLATFORM_OPS.TOOL_STATE_ACTIVE],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  describe('contraste de punta a punta con Postgres y Redis reales (sin worker real: los latidos los escribe la prueba)', () => {
    let redis: Redis;
    const beat = (
      instanceId: string,
      ageMs: number,
      over: Partial<StoredHeartbeat> = {},
    ): StoredHeartbeat => ({
      instanceId,
      pid: 41,
      startedAt: '2026-10-31T08:00:00.000Z',
      sentAt: new Date(Date.now() - ageMs).toISOString(),
      status: 'running',
      liveness: { healthy: true, reasons: [] },
      readiness: { healthy: true, reasons: [] },
      stuckTicks: 0,
      openCircuits: [],
      receivedAt: Date.now() - ageMs,
      ...over,
    });
    const serviceWith = (client: Redis) =>
      new RuntimePiecesService(
        new ScanCache(),
        new RuntimePiecesRepository(),
        new HeartbeatReader(new InstanceHeartbeatRepository(client as never)),
        seed,
        db,
        loadInstanceLivenessEnv({}, 3_000),
        () => new Date(),
      );
    const list = async (service: RuntimePiecesService) =>
      service.list({ page: 1, pageSize: 1000 } as never);
    const piece = (data: { id: string }[], id: string) =>
      data.find((p) => p.id === id) as unknown as {
        state: string;
        cause: string;
        evidenceLevel: string;
      };

    beforeAll(async () => {
      if (!REDIS_URL) return;
      redis = new Redis(REDIS_URL);
      await redis.del(HEARTBEAT_HASH_KEY);
      await pool.query('TRUNCATE platform_ops.tool_registry');
      await seed.run(db, scan, options);
    });

    afterAll(async () => {
      if (redis) await redis.quit();
    });

    itRedis(
      'sin ningún latido: la API es VIVA por sí misma, los workers y lo que alojan son SIN_LATIDO (NEVER_SEEN), y nada queda sin registrar',
      async () => {
        const service = serviceWith(redis);
        const page = await list(service);
        expect(page.heartbeatStore).toEqual({ status: 'up', reason: null });
        expect(page.summary.byState.NO_REGISTRADA).toBe(0);
        expect(page.summary.byState.HUERFANA).toBe(0);
        expect(piece(page.data, 'rtp.proceso.api')).toMatchObject({
          state: 'VIVA',
          cause: 'SELF',
          evidenceLevel: 'PROPIO',
        });
        expect(piece(page.data, 'rtp.proceso.worker-messaging')).toMatchObject({
          state: 'SIN_LATIDO',
          cause: 'NEVER_SEEN',
        });
        expect(
          piece(page.data, 'rtp.job.messaging.outbox-relay'),
        ).toMatchObject({ state: 'SIN_LATIDO', cause: 'NEVER_SEEN' });
        expect(
          page.findings.some((f) => f.rule === 'SIN_LATIDO_REQUERIDA'),
        ).toBe(true);
      },
    );

    itRedis(
      'un latido fresco de un worker lo pone VIVA a él y a lo que aloja; los demás siguen sin latido',
      async () => {
        await new InstanceHeartbeatRepository(redis as never).save(
          beat('worker-messaging', 5_000),
        );
        const page = await list(serviceWith(redis));
        expect(piece(page.data, 'rtp.proceso.worker-messaging')).toMatchObject({
          state: 'VIVA',
          cause: 'OK',
          evidenceLevel: 'PROPIO',
        });
        expect(
          piece(page.data, 'rtp.job.messaging.outbox-relay'),
        ).toMatchObject({
          state: 'VIVA',
          cause: 'HOST_ALIVE',
          evidenceLevel: 'ANFITRION',
        });
        expect(piece(page.data, 'rtp.proceso.worker-scheduling')).toMatchObject(
          { state: 'SIN_LATIDO' },
        );
        const instance = page.instances.find(
          (i) => i.id === 'worker-messaging',
        );
        expect(instance).toMatchObject({ state: 'VIVA' });
        expect(instance!.pieceCount).toBeGreaterThan(1);
      },
    );

    itRedis(
      'los umbrales son los de la sonda: 45 s = latido tardío (sigue VIVA, con su causa); 120 s = vencido (SIN_LATIDO)',
      async () => {
        const repo = new InstanceHeartbeatRepository(redis as never);
        await repo.save(beat('worker-messaging', 45_000));
        await repo.save(beat('worker-scheduling', 120_000));
        const page = await list(serviceWith(redis));
        expect(piece(page.data, 'rtp.proceso.worker-messaging')).toMatchObject({
          state: 'VIVA',
          cause: 'HEARTBEAT_LATE',
        });
        expect(piece(page.data, 'rtp.proceso.worker-scheduling')).toMatchObject(
          { state: 'SIN_LATIDO', cause: 'HEARTBEAT_EXPIRED' },
        );
      },
    );

    itRedis(
      'un worker que dice estar drenando o con un tick trabado no se pinta verde sin más: queda VIVA con la causa a la vista',
      async () => {
        await new InstanceHeartbeatRepository(redis as never).save(
          beat('worker-messaging', 3_000, {
            liveness: { healthy: false, reasons: ['tick colgado'] },
          }),
        );
        const page = await list(serviceWith(redis));
        expect(piece(page.data, 'rtp.proceso.worker-messaging')).toMatchObject({
          state: 'VIVA',
          cause: 'TICK_STUCK',
        });
      },
    );

    itRedis(
      'con Redis inalcanzable lo dice y NINGÚN worker figura viva: SIN_LATIDO / STORE_UNAVAILABLE',
      async () => {
        const dead = new Redis({
          host: '127.0.0.1',
          port: 1,
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          retryStrategy: () => null,
        });
        dead.on('error', () => undefined);
        try {
          const page = await list(serviceWith(dead));
          expect(page.heartbeatStore).toEqual({
            status: 'down',
            reason: 'STORE_UNAVAILABLE',
          });
          expect(
            piece(page.data, 'rtp.proceso.worker-messaging'),
          ).toMatchObject({ state: 'SIN_LATIDO', cause: 'STORE_UNAVAILABLE' });
          expect(piece(page.data, 'rtp.proceso.api')).toMatchObject({
            state: 'VIVA',
          });
        } finally {
          dead.disconnect();
        }
      },
    );

    itRedis(
      'NO_REGISTRADA y HUERFANA salen del registro real: borrar una fila y añadir una que el código no tiene',
      async () => {
        await pool.query(
          "DELETE FROM platform_ops.tool_registry WHERE code = 'rtp.proceso.seed-cli'",
        );
        const ghost = {
          ...scan.pieces.find((p) => p.id === 'rtp.proceso.api')!,
          id: 'rtp.job.fantasma.que.ya.no.existe',
        };
        await seed.run(
          db,
          {
            ...scan,
            pieces: [
              ...scan.pieces.filter((p) => p.id !== 'rtp.proceso.seed-cli'),
              ghost,
            ],
          },
          options,
        );
        const page = await list(serviceWith(redis));
        expect(piece(page.data, 'rtp.proceso.seed-cli')).toMatchObject({
          state: 'NO_REGISTRADA',
          cause: 'NOT_IN_REGISTRY',
        });
        expect(
          piece(page.data, 'rtp.job.fantasma.que.ya.no.existe'),
        ).toMatchObject({ state: 'HUERFANA', cause: 'NOT_IN_CODE' });
        expect(page.findings.map((f) => f.id)).toEqual(
          expect.arrayContaining([
            'NO_REGISTRADA:rtp.proceso.seed-cli',
            'HUERFANA:rtp.job.fantasma.que.ya.no.existe',
          ]),
        );
      },
    );

    itRedis(
      'descubrir desde el servicio repara lo no registrado y sigue sin borrar lo huérfano',
      async () => {
        const service = serviceWith(redis);
        const report = await service.discover({ dryRun: false }, {
          id: '00000000-0000-4000-8000-000000000001',
          roles: ['SRE'],
        } as never);
        expect(report).toMatchObject({
          created: 1,
          updated: 0,
          orphans: 1,
          orphanIds: ['rtp.job.fantasma.que.ya.no.existe'],
        });
        const again = await service.discover({ dryRun: false }, {
          id: '00000000-0000-4000-8000-000000000001',
          roles: ['SRE'],
        } as never);
        expect(again).toMatchObject({
          created: 0,
          updated: 0,
          unchanged: scan.pieces.length,
          orphans: 1,
        });
        const page = await list(service);
        expect(page.summary.byState.NO_REGISTRADA).toBe(0);
        expect(page.summary.byState.HUERFANA).toBe(1);
      },
    );
  });

  describe('RLS: por qué la transacción lleva el contexto de sistema', () => {
    it('con la política de aislamiento por tenant, sin contexto la lectura no ve la fila; con contexto de sistema sí', async () => {
      const expected = await count();
      await pool.query(
        'ALTER TABLE platform_ops.tool_registry ENABLE ROW LEVEL SECURITY',
      );
      await pool.query(
        'ALTER TABLE platform_ops.tool_registry FORCE ROW LEVEL SECURITY',
      );
      await pool.query(
        'DROP POLICY IF EXISTS tenant_isolation ON platform_ops.tool_registry',
      );
      // Misma política que database/SQL/patches/2026-08-05_tenant_rls.sql.
      await pool.query(`CREATE POLICY tenant_isolation ON platform_ops.tool_registry
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.system_context', true) = 'true')
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.system_context', true) = 'true')`);
      await pool.query(
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rtp_app') THEN CREATE ROLE rtp_app NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$",
      );
      await pool.query('GRANT USAGE ON SCHEMA platform_ops TO rtp_app');
      await pool.query(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON platform_ops.tool_registry TO rtp_app',
      );
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE rtp_app');
        const blind = await client.query(
          'SELECT count(*) AS n FROM platform_ops.tool_registry',
        );
        expect(Number(blind.rows[0].n)).toBe(0);
        await client.query(
          "select set_config('app.system_context', 'true', true)",
        );
        const seen = await client.query(
          'SELECT count(*) AS n FROM platform_ops.tool_registry',
        );
        expect(Number(seen.rows[0].n)).toBe(expected);
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });
});
