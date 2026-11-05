import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SOURCE_CODE } from '../../domain/catalog/catalog.constants';
import { iso } from '../../domain/catalog/timestamps';
import type {
  FitHistoryEntry,
  FitRun,
  FitRunTrigger,
} from './fit-results.store';
import type { FitReport, FitVerdict } from './fit.types';

/** Fila de `data_catalog.catalog_fit_runs` tal como la devuelve el driver. */
export interface FitRunRow {
  id: string;
  trigger_kind: FitRunTrigger;
  status: 'COMPLETADA' | 'FALLIDA';
  error_code: string | null;
  requested_at: string | Date;
  finished_at: string | Date;
  report_json?: FitReport | string | null;
}

/** Fila resumida del historial: el veredicto y lo justo de cada dimensión, sin el informe. */
interface FitHistoryRow {
  id: string;
  trigger_kind: FitRunTrigger;
  verdict: FitVerdict;
  evaluated_at: string;
  dimensions: unknown;
  failed_checks: unknown;
  blind_spots: unknown;
}

/** Resultado de guardar una corrida. `CLAVE_REPETIDA`: otra corrida ya guardó esa `Idempotency-Key`. */
export type FitRunSaveOutcome = 'GUARDADA' | 'CLAVE_REPETIDA';

const json = <T>(v: unknown): T =>
  (typeof v === 'string' ? JSON.parse(v) : v) as T;

const SELECT_RUN = `select id, trigger_kind, status, error_code, requested_at, finished_at`;

/**
 * Persistencia de la sonda de ajuste en `data_catalog.catalog_fit_runs` (parche del modelo
 * `SQL/patches/2026-11-01_catalog_fit_runs.sql`).
 *
 * - **Append-only, purgable**: sólo `INSERT` del desenlace (`COMPLETADA`/`FALLIDA`) y `DELETE` por
 *   retención. Nunca `UPDATE` (el modelo lo prohíbe con un trigger). Las corridas `EN_CURSO` no se
 *   escriben: viven en la memoria del proceso que las corre.
 * - **Sin entidad ORM a propósito**: la tabla todavía no está en el `.puml` del modelo, así que una
 *   entidad generada a mano abriría una deriva ORM ↔ modelo (`FIT-MOD-005` la vería). SQL
 *   parametrizado, sin concatenar entrada de nadie.
 * - Cada operación usa un `EntityManager` propio (`fork`): la sonda corre fuera de una petición.
 */
@Injectable()
export class FitRunsRepository {
  constructor(private readonly em: EntityManager) {}

  private q<T>(sql: string, params: unknown[] = []): Promise<T> {
    return this.em
      .fork()
      .getConnection()
      .execute(sql, params, 'all') as Promise<T>;
  }

  /** Guarda el desenlace de una corrida. Idempotente por id y por `(trigger_kind, idempotency_key)`. */
  async save(
    run: FitRun,
    idempotencyKey: string | null,
  ): Promise<FitRunSaveOutcome> {
    if (run.status === 'EN_CURSO' || !run.finishedAt)
      throw new Error('Sólo se guarda el desenlace de una corrida terminada');
    const report = run.status === 'COMPLETADA' ? run.report : null;
    const rows = await this.q<{ id: string }[]>(
      `insert into data_catalog.catalog_fit_runs
         (id, source_code, trigger_kind, requested_by_user_id, idempotency_key, status, model_version,
          verdict, code_fingerprint, deployed_commit, report_json, error_code, requested_at, finished_at)
       values (?, ?, ?, null, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
       on conflict do nothing
       returning id`,
      [
        run.runId,
        SOURCE_CODE,
        run.trigger,
        idempotencyKey,
        run.status,
        report?.modelVersion ?? 'catalog-fit/v1',
        report?.verdict ?? null,
        report?.fingerprints.routesInCode ?? null,
        report?.deployment.commit ?? null,
        report ? JSON.stringify(report) : null,
        run.status === 'FALLIDA' ? (run.errorCode ?? 'UNKNOWN') : null,
        run.requestedAt,
        run.finishedAt,
      ],
    );
    return rows.length > 0 ? 'GUARDADA' : 'CLAVE_REPETIDA';
  }

  /** Borra las corridas terminadas antes de `cutoff`. Devuelve cuántas borró. */
  async purgeBefore(cutoff: Date): Promise<number> {
    const rows = await this.q<{ id: string }[]>(
      `delete from data_catalog.catalog_fit_runs
        where source_code = ? and finished_at < ?
        returning id`,
      [SOURCE_CODE, cutoff],
    );
    return rows.length;
  }

  /** La última corrida `COMPLETADA`, con su informe. */
  async latestCompleted(): Promise<FitRun | null> {
    const [row] = await this.q<FitRunRow[]>(
      `${SELECT_RUN}, report_json
         from data_catalog.catalog_fit_runs
        where source_code = ? and status = 'COMPLETADA'
        order by finished_at desc, id desc
        limit 1`,
      [SOURCE_CODE],
    );
    return row ? toRun(row) : null;
  }

  /** La última corrida `FALLIDA` (sin informe: no lo tiene). */
  async latestFailed(): Promise<FitRun | null> {
    const [row] = await this.q<FitRunRow[]>(
      `${SELECT_RUN}
         from data_catalog.catalog_fit_runs
        where source_code = ? and status = 'FALLIDA'
        order by finished_at desc, id desc
        limit 1`,
      [SOURCE_CODE],
    );
    return row ? toRun(row) : null;
  }

  /** Historial resumido de las corridas completadas desde `since`, de la más vieja a la más nueva. */
  async history(since: Date, limit: number): Promise<FitHistoryEntry[]> {
    const rows = await this.q<FitHistoryRow[]>(
      `select id, trigger_kind, verdict, evaluated_at, dimensions, failed_checks, blind_spots
         from (select id, trigger_kind, verdict, finished_at,
                      report_json->>'evaluatedAt' as evaluated_at,
                      report_json->'dimensions' as dimensions,
                      (select coalesce(jsonb_agg(c->'id'), '[]'::jsonb)
                         from jsonb_array_elements(report_json->'checks') c
                        where c->>'status' = 'FALLA') as failed_checks,
                      report_json->'blindSpots' as blind_spots
                 from data_catalog.catalog_fit_runs
                where source_code = ? and status = 'COMPLETADA' and finished_at >= ?
                order by finished_at desc, id desc
                limit ?) ultimas
        order by finished_at asc, id asc`,
      [SOURCE_CODE, since, limit],
    );
    return rows.map((r) => ({
      runId: r.id,
      evaluatedAt: r.evaluated_at,
      trigger: r.trigger_kind,
      verdict: r.verdict,
      dimensions: json<FitReport['dimensions']>(r.dimensions).map((d) => ({
        dimension: d.dimension,
        status: d.status,
        covered: d.covered,
        denominator: d.denominator,
        ratio: d.ratio,
      })),
      failedChecks: json<string[]>(r.failed_checks) ?? [],
      blindSpots: json<string[]>(r.blind_spots) ?? [],
    }));
  }
}

function toRun(r: FitRunRow): FitRun {
  return {
    runId: r.id,
    status: r.status,
    trigger: r.trigger_kind,
    requestedAt: new Date(iso(r.requested_at)),
    finishedAt: new Date(iso(r.finished_at)),
    errorCode: r.error_code,
    report: r.report_json ? json<FitReport>(r.report_json) : null,
  };
}
