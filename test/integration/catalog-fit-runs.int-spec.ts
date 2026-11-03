import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { CatalogFitService } from '../../src/modules/data_catalog/application/fit/catalog-fit.service';
import { FitCheckRegistry } from '../../src/modules/data_catalog/application/fit/fit-check.registry';
import { FitResultsStore } from '../../src/modules/data_catalog/application/fit/fit-results.store';
import { FitRunsRepository } from '../../src/modules/data_catalog/application/fit/fit-runs.repository';
import { baseInputs } from '../../src/modules/data_catalog/application/fit/fit.fixtures';
import {
  AdminCatalogFitController,
  InternalCatalogFitController,
} from '../../src/modules/data_catalog/presentation/controllers/catalog-fit.controller';

/**
 * Persistencia de la sonda de ajuste contra PostgreSQL REAL (`data_catalog.catalog_fit_runs`).
 *
 * Opt-in: `CATALOG_FIT_IT_DB_URL` apunta a una base con el modelo aplicado (schema `data_catalog` y
 * `integrity.forbid_mutation`). Sin la variable se omite, y una omisión no es un resultado aprobado.
 *
 *   CATALOG_FIT_IT_DB_URL=postgres://... yarn test:integration test/integration/catalog-fit-runs.int-spec.ts
 *
 * Qué es real: el parche del modelo (`CATALOG_FIT_PATCH`, por defecto el del repo hermano), aplicado
 * DOS veces; el SQL de `FitRunsRepository`; `CatalogFitService`; los dos controladores (el tick del
 * worker entra por `InternalCatalogFitController.run`, la consola lee por
 * `AdminCatalogFitController.latest`). Qué NO es real: las entradas de la sonda (`baseInputs`, sin
 * leer rutas ni el catálogo vivo) y el transporte HTTP/guards (probados en el spec del controlador).
 * Sólo borra las filas que crea.
 */
const DB_URL = process.env.CATALOG_FIT_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const PATCH =
  process.env.CATALOG_FIT_PATCH ??
  join(
    process.cwd(),
    '..',
    'mantra-core-health-model',
    'SQL',
    'patches',
    '2026-11-01_catalog_fit_runs.sql',
  );

/** Convierte `?` en `$n`, que es lo que habla `pg` (el driver del ORM usa `?`). */
function toPg(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${(n += 1)}`);
}

/** Lo único del `EntityManager` que usa el repositorio: `fork().getConnection().execute(sql, params)`. */
function emOver(pool: pg.Pool) {
  const connection = {
    execute: async (sql: string, params: unknown[] = []) =>
      (await pool.query(toPg(sql), params)).rows,
  };
  return { fork: () => ({ getConnection: () => connection }) };
}

describeIfDb('catalog_fit_runs · PostgreSQL real', () => {
  let pool: pg.Pool;
  const creadas: string[] = [];

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: DB_URL, max: 2 });
  });

  afterAll(async () => {
    if (creadas.length)
      await pool.query(
        'delete from data_catalog.catalog_fit_runs where id = any($1::uuid[])',
        [creadas],
      );
    await pool.end();
  });

  it('el parche es idempotente: se aplica dos veces y la tabla queda igual', async () => {
    const sql = readFileSync(PATCH, 'utf8');
    await pool.query(sql);
    await pool.query(sql);
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n from information_schema.columns
        where table_schema = 'data_catalog' and table_name = 'catalog_fit_runs'`,
    );
    expect(rows[0].n).toBe('15');
  });

  it('una fila escrita por el tick (internal) se lee por el endpoint de la consola, también tras un «reinicio»', async () => {
    const runs = new FitRunsRepository(emOver(pool) as never);
    const nuevoServicio = () =>
      new CatalogFitService(
        { collect: async (now: Date) => ({ ...baseInputs(), now }) } as never,
        new FitCheckRegistry(),
        new FitResultsStore(),
        undefined,
        runs,
      );
    const tick = new InternalCatalogFitController(nuevoServicio());
    const clave = `it-fit-${Date.now()}`;
    const r = await tick.run(clave);
    creadas.push(r.runId);
    expect(r).toMatchObject({ status: 'COMPLETADA', persisted: true });

    const { rows } = await pool.query(
      `select id, trigger_kind, status, verdict, idempotency_key, report_json->>'modelVersion' as mv
         from data_catalog.catalog_fit_runs where id = $1`,
      [r.runId],
    );
    // Evidencia legible en la salida de jest.
    console.log('fila en data_catalog.catalog_fit_runs:', rows[0]);
    expect(rows[0]).toMatchObject({
      trigger_kind: 'TICK',
      status: 'COMPLETADA',
      idempotency_key: clave,
      mv: 'catalog-fit/v1',
    });

    // Otro proceso (memoria vacía) lee por el endpoint de la consola.
    const consola = new AdminCatalogFitController(nuevoServicio());
    const v = (await consola.latest()) as any;
    console.log('GET /admin/catalog/fit →', {
      state: v.state,
      lastRun: v.lastRun?.runId,
      verdict: v.report?.verdict,
      retention: v.retention.kind,
      history: v.history.length,
    });
    expect(v.retention.kind).toBe('BASE_DE_DATOS');
    expect(v.state).toBe('VIGENTE');
    expect(v.lastRun.runId).toBe(r.runId);
    expect(v.history.map((h: any) => h.runId)).toContain(r.runId);
  });

  it('append-only: un UPDATE lo rechaza el trigger del modelo', async () => {
    await expect(
      pool.query(
        `update data_catalog.catalog_fit_runs set verdict = 'AJUSTADA' where id = $1`,
        [creadas[0]],
      ),
    ).rejects.toThrow(/append-only/);
  });

  it('el CHECK de forma rechaza una COMPLETADA sin informe', async () => {
    await expect(
      pool.query(
        `insert into data_catalog.catalog_fit_runs
           (id, trigger_kind, status, model_version, verdict, requested_at, finished_at)
         values (gen_random_uuid(), 'TICK', 'COMPLETADA', 'catalog-fit/v1', 'AJUSTADA', now(), now())`,
      ),
    ).rejects.toThrow(/ck_catalog_fit_runs_outcome_shape/);
  });
});
