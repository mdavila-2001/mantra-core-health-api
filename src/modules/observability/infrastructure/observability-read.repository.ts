import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { HTTP_BOUNDS_MS, SQL_BOUNDS_MS } from '../domain/latency-histogram';
import type { ObsInterval, ObsWindow } from '../domain/observability-window';
import { ERROR_GROUP_STATE } from '../observability.concepts';

/**
 * Lecturas del módulo 70: sólo `SELECT`, todo agregado salvo las listas de
 * eventos (que llevan códigos, tiempos e identificadores de petición, nunca
 * mensajes ni datos de la persona).
 *
 * Los cubos se calculan con `date_trunc(intervalo, time AT TIME ZONE tz)`; la
 * zona y las fechas viajan como **parámetros**, y el intervalo sale de un
 * conjunto cerrado. Con `RLS_ENFORCE=true` cada lectura corre en contexto de
 * sistema (`app.system_context`): estas rutas son de plataforma y
 * `error_events` filtra por tenant del actor.
 */

type Row = Record<string, unknown>;

const HTTP_BUCKET_COLUMNS = HTTP_BOUNDS_MS.map((b) => `le${b}`);
const SQL_BUCKET_COLUMNS = [...SQL_BOUNDS_MS.map((b) => `le${b}`), 'inf'];

const sumColumns = (columns: readonly string[], alias = 's'): string =>
  columns
    .map((c) => `COALESCE(SUM(${alias}.${c}), 0)::float8 AS ${c}`)
    .join(', ');

/** Columnas agregadas comunes de la serie HTTP. */
const HTTP_AGGREGATES = `
  COALESCE(SUM(s.requests), 0)::float8 AS requests,
  COALESCE(SUM(s.requests) FILTER (WHERE s.http_status BETWEEN 200 AND 299), 0)::float8 AS c2xx,
  COALESCE(SUM(s.requests) FILTER (WHERE s.http_status BETWEEN 300 AND 399), 0)::float8 AS c3xx,
  COALESCE(SUM(s.requests) FILTER (WHERE s.http_status BETWEEN 400 AND 499), 0)::float8 AS c4xx,
  COALESCE(SUM(s.requests) FILTER (WHERE s.http_status BETWEEN 500 AND 599), 0)::float8 AS c5xx,
  COALESCE(SUM(s.requests) FILTER (WHERE s.http_status = 0), 0)::float8 AS c_other,
  COALESCE(SUM(s.sum_ms), 0)::float8 AS sum_ms,
  COALESCE(MAX(s.max_ms), 0)::float8 AS max_ms,
  ${sumColumns(HTTP_BUCKET_COLUMNS)}`;

const SQL_AGGREGATES = `
  COALESCE(SUM(s.executions), 0)::float8 AS executions,
  COALESCE(SUM(s.sum_ms), 0)::float8 AS sum_ms,
  COALESCE(MAX(s.max_ms), 0)::float8 AS max_ms,
  COALESCE(SUM(s.slow_count), 0)::float8 AS slow_count,
  COALESCE(SUM(s.failed_count), 0)::float8 AS failed_count,
  ${sumColumns(SQL_BUCKET_COLUMNS)}`;

const STATUS_CLASS = `CASE WHEN s.http_status BETWEEN 200 AND 299 THEN '2xx'
  WHEN s.http_status BETWEEN 300 AND 399 THEN '3xx'
  WHEN s.http_status BETWEEN 400 AND 499 THEN '4xx'
  WHEN s.http_status BETWEEN 500 AND 599 THEN '5xx' ELSE 'other' END`;

export const INTERVALS: Readonly<Record<ObsInterval, string>> = {
  minute: 'minute',
  hour: 'hour',
  day: 'day',
};

/** El cubo en la zona pedida, como instante (`timestamptz`). */
const bucketExpr = (interval: ObsInterval, column: string): string =>
  `(date_trunc('${INTERVALS[interval]}', ${column} AT TIME ZONE ?) AT TIME ZONE ?)`;

export interface HttpAggregate {
  requests: number;
  c2xx: number;
  c3xx: number;
  c4xx: number;
  c5xx: number;
  cOther: number;
  sumMs: number;
  maxMs: number;
  /** Acumulados por corte de {@link HTTP_BOUNDS_MS}. */
  cumulative: number[];
}

export interface SqlAggregate {
  executions: number;
  sumMs: number;
  maxMs: number;
  slowCount: number;
  failedCount: number;
  /** Acumulados por corte de {@link SQL_BOUNDS_MS}. */
  cumulative: number[];
}

const n = (value: unknown): number => Number(value ?? 0);

export function toHttpAggregate(row: Row): HttpAggregate {
  return {
    requests: n(row.requests),
    c2xx: n(row.c2xx),
    c3xx: n(row.c3xx),
    c4xx: n(row.c4xx),
    c5xx: n(row.c5xx),
    cOther: n(row.c_other),
    sumMs: n(row.sum_ms),
    maxMs: n(row.max_ms),
    cumulative: HTTP_BOUNDS_MS.map((b) => n(row[`le${b}`])),
  };
}

export function toSqlAggregate(row: Row): SqlAggregate {
  return {
    executions: n(row.executions),
    sumMs: n(row.sum_ms),
    maxMs: n(row.max_ms),
    slowCount: n(row.slow_count),
    failedCount: n(row.failed_count),
    // Los 10 cortes; `inf` (todas) es `executions`.
    cumulative: SQL_BOUNDS_MS.map((b) => n(row[`le${b}`])),
  };
}

export interface ErrorGroupFilters {
  readonly state?: keyof typeof ERROR_GROUP_STATE;
  readonly module?: string;
  readonly code?: string;
  readonly source?: string;
  readonly from: Date;
  readonly to: Date;
}

export type ErrorGroupSort = 'last_seen' | 'occurrences' | 'first_seen';

const GROUP_COLUMNS = `g.id, g.title, g.source, g.http_status, g.error_code, g.error_reason,
  g.exception_type, g.module_code, g.operation_key, g.http_method, g.route_template,
  g.state_concept_id, g.first_seen_at, g.last_seen_at, g.occurrences_total::text AS occurrences_total,
  g.last_request_id, g.row_version, g.resolved_at, g.resolution_note, g.regressed_at,
  g.assigned_to_user_id`;

@Injectable()
export class ObservabilityReadRepository {
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  constructor(private readonly em: EntityManager) {}

  private async scoped<T>(fn: (tx: EntityManager) => Promise<T>): Promise<T> {
    return this.em.fork().transactional(async (tx) => {
      if (this.enforceRls) {
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
      }
      return fn(tx);
    });
  }

  // ------------------------------------------------------------ cobertura

  /** Instancias de la API vistas en la ventana: evidencia de que se estaba midiendo. */
  async instanceActivity(window: ObsWindow) {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT COUNT(*)::int AS instances,
                MAX(i.last_seen_at) AS last_seen_at
           FROM observability.instances i
          WHERE i.kind = 'API' AND i.started_at < ? AND i.last_seen_at >= ?`,
        [window.to, window.from],
      );
      const [latest] = await tx.execute<Row[]>(
        `SELECT MAX(i.last_seen_at) AS last_seen_at FROM observability.instances i WHERE i.kind = 'API'`,
      );
      return {
        instancesInWindow: n(row?.instances),
        lastSeenInWindow: row?.last_seen_at
          ? new Date(row.last_seen_at as string | Date)
          : null,
        lastSeenAt: latest?.last_seen_at
          ? new Date(latest.last_seen_at as string | Date)
          : null,
      };
    });
  }

  async instances(limit = 50) {
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT i.id, i.kind, i.name, i.build_commit, i.build_version, i.started_at,
                i.last_seen_at, i.status
           FROM observability.instances i
          WHERE i.last_seen_at >= now() - interval '24 hours'
          ORDER BY i.last_seen_at DESC, i.id
          LIMIT ?`,
        [limit],
      ),
    );
  }

  // ----------------------------------------------------------------- HTTP

  async httpTotals(window: ObsWindow): Promise<HttpAggregate> {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT ${HTTP_AGGREGATES}
           FROM observability.http_request_minute_series s
          WHERE s.time >= ? AND s.time < ?`,
        [window.from, window.to],
      );
      return toHttpAggregate(row ?? {});
    });
  }

  async httpSeries(
    window: ObsWindow,
    groupBy: 'none' | 'module' | 'status_class',
  ): Promise<{ bucket: Date; key: string; agg: HttpAggregate }[]> {
    const keyExpr =
      groupBy === 'module'
        ? "COALESCE(s.module_code, 'UNKNOWN')"
        : groupBy === 'status_class'
          ? STATUS_CLASS
          : "'all'";
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT ${bucketExpr(window.interval, 's.time')} AS bucket, ${keyExpr} AS key,
                ${HTTP_AGGREGATES}
           FROM observability.http_request_minute_series s
          WHERE s.time >= ? AND s.time < ?
          GROUP BY 1, 2
          ORDER BY 1, 2`,
        [window.timezone, window.timezone, window.from, window.to],
      );
      return rows.map((row) => ({
        bucket: new Date(row.bucket as string | Date),
        key: String(row.key),
        agg: toHttpAggregate(row),
      }));
    });
  }

  async httpByEndpoint(window: ObsWindow, module?: string) {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT s.http_method, s.route_template,
                (array_agg(s.operation_key ORDER BY s.time DESC)
                   FILTER (WHERE s.operation_key IS NOT NULL))[1] AS operation_key,
                (array_agg(s.module_code ORDER BY s.time DESC))[1] AS module_code,
                MAX(s.time) AS last_seen_at,
                ${HTTP_AGGREGATES}
           FROM observability.http_request_minute_series s
          WHERE s.time >= ? AND s.time < ?
            ${module ? 'AND s.module_code = ?' : ''}
          GROUP BY s.http_method, s.route_template`,
        module ? [window.from, window.to, module] : [window.from, window.to],
      );
      return rows.map((row) => ({
        method: String(row.http_method),
        route: String(row.route_template),
        operationKey: (row.operation_key as string | null) ?? null,
        moduleCode: (row.module_code as string | null) ?? 'UNKNOWN',
        lastSeenAt: new Date(row.last_seen_at as string | Date),
        agg: toHttpAggregate(row),
      }));
    });
  }

  async httpByModule(window: ObsWindow) {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT COALESCE(s.module_code, 'UNKNOWN') AS module_code, ${HTTP_AGGREGATES}
           FROM observability.http_request_minute_series s
          WHERE s.time >= ? AND s.time < ?
          GROUP BY 1`,
        [window.from, window.to],
      );
      return rows.map((row) => ({
        moduleCode: String(row.module_code),
        agg: toHttpAggregate(row),
      }));
    });
  }

  /** Grupos abiertos (NEW o SEEN) por (método, plantilla) y por módulo. */
  async openGroupCounts() {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT g.http_method, g.route_template, COALESCE(g.module_code, 'UNKNOWN') AS module_code,
                COUNT(*)::int AS groups
           FROM observability.error_groups g
          WHERE g.state_concept_id IN (?, ?)
          GROUP BY 1, 2, 3`,
        [ERROR_GROUP_STATE.NEW, ERROR_GROUP_STATE.SEEN],
      );
      return rows.map((row) => ({
        method: (row.http_method as string | null) ?? '',
        route: (row.route_template as string | null) ?? '',
        moduleCode: String(row.module_code),
        groups: n(row.groups),
      }));
    });
  }

  // ------------------------------------------------------------ grupos

  async errorGroupSummary(window: ObsWindow) {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT COUNT(*) FILTER (WHERE g.state_concept_id = ?)::int AS new_groups,
                COUNT(*) FILTER (WHERE g.state_concept_id IN (?, ?))::int AS open_groups,
                COUNT(*) FILTER (WHERE g.regressed_at >= ? AND g.regressed_at < ?)::int AS regressed
           FROM observability.error_groups g
          WHERE g.last_seen_at >= ? AND g.last_seen_at < ?`,
        [
          ERROR_GROUP_STATE.NEW,
          ERROR_GROUP_STATE.NEW,
          ERROR_GROUP_STATE.SEEN,
          window.from,
          window.to,
          window.from,
          window.to,
        ],
      );
      return {
        new: n(row?.new_groups),
        open: n(row?.open_groups),
        regressed: n(row?.regressed),
      };
    });
  }

  /** Una página de grupos (`limit + 1` filas para saber si hay más). */
  async listErrorGroups(
    filters: ErrorGroupFilters,
    sort: ErrorGroupSort,
    limit: number,
    after: { value: string | number; id: string } | null,
  ) {
    const sortColumn =
      sort === 'occurrences'
        ? 'g.occurrences_total'
        : sort === 'first_seen'
          ? 'g.first_seen_at'
          : 'g.last_seen_at';
    const params: unknown[] = [filters.from, filters.to];
    const where = ['g.last_seen_at >= ?', 'g.last_seen_at < ?'];
    if (filters.state) {
      where.push('g.state_concept_id = ?');
      params.push(ERROR_GROUP_STATE[filters.state]);
    }
    if (filters.module) {
      where.push('g.module_code = ?');
      params.push(filters.module);
    }
    if (filters.code) {
      where.push('g.error_code = ?');
      params.push(filters.code);
    }
    if (filters.source) {
      where.push('g.source = ?');
      params.push(filters.source);
    }
    if (after) {
      // El valor viaja como texto (microsegundos intactos) y se castea al tipo de la columna.
      where.push(
        `(${sortColumn}, g.id) < (?::${sort === 'occurrences' ? 'bigint' : 'timestamptz'}, ?::uuid)`,
      );
      params.push(String(after.value), after.id);
    }
    params.push(limit + 1);
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT ${GROUP_COLUMNS}, ${sortColumn}::text AS sort_value
           FROM observability.error_groups g
          WHERE ${where.join(' AND ')}
          ORDER BY ${sortColumn} DESC, g.id DESC
          LIMIT ?`,
        params,
      ),
    );
  }

  async getErrorGroup(id: string): Promise<Row | null> {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT ${GROUP_COLUMNS}, g.sample_message, g.sample_frames_json
           FROM observability.error_groups g WHERE g.id = ?`,
        [id],
      );
      return row ?? null;
    });
  }

  /** Eventos de las últimas 24 h, usuarios afectados y la serie por cubo, por grupo. */
  async groupActivity(
    groupIds: readonly string[],
    window: ObsWindow,
    now: Date,
  ) {
    if (groupIds.length === 0) {
      return {
        last24h: new Map<string, { events: number; actors: number }>(),
        spark: new Map<string, { bucket: Date; count: number }[]>(),
      };
    }
    return this.scoped(async (tx) => {
      const since = new Date(now.getTime() - 24 * 3_600_000);
      const totals = await tx.execute<Row[]>(
        `SELECT e.error_group_id, COUNT(*)::int AS events,
                COUNT(DISTINCT e.actor_hash)::int AS actors
           FROM observability.error_events e
          WHERE e.error_group_id = ANY(?::uuid[]) AND e.occurred_at >= ?
          GROUP BY 1`,
        [`{${groupIds.join(',')}}`, since],
      );
      const series = await tx.execute<Row[]>(
        `SELECT e.error_group_id, ${bucketExpr(window.interval, 'e.occurred_at')} AS bucket,
                COUNT(*)::int AS events
           FROM observability.error_events e
          WHERE e.error_group_id = ANY(?::uuid[]) AND e.occurred_at >= ? AND e.occurred_at < ?
          GROUP BY 1, 2
          ORDER BY 1, 2`,
        [
          window.timezone,
          window.timezone,
          `{${groupIds.join(',')}}`,
          window.from,
          window.to,
        ],
      );
      const last24h = new Map<string, { events: number; actors: number }>();
      for (const row of totals) {
        last24h.set(String(row.error_group_id), {
          events: n(row.events),
          actors: n(row.actors),
        });
      }
      const spark = new Map<string, { bucket: Date; count: number }[]>();
      for (const row of series) {
        const id = String(row.error_group_id);
        const list = spark.get(id) ?? [];
        list.push({
          bucket: new Date(row.bucket as string | Date),
          count: n(row.events),
        });
        spark.set(id, list);
      }
      return { last24h, spark };
    });
  }

  async listEventBuckets(window: ObsWindow, groupBy: 'none' | 'module') {
    const keyExpr =
      groupBy === 'module' ? "COALESCE(e.module_code, 'UNKNOWN')" : "'all'";
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT ${bucketExpr(window.interval, 'e.occurred_at')} AS bucket, ${keyExpr} AS key,
                COUNT(*)::int AS events
           FROM observability.error_events e
          WHERE e.occurred_at >= ? AND e.occurred_at < ?
          GROUP BY 1, 2 ORDER BY 1, 2`,
        [window.timezone, window.timezone, window.from, window.to],
      );
      return rows.map((row) => ({
        bucket: new Date(row.bucket as string | Date),
        key: String(row.key),
        count: n(row.events),
      }));
    });
  }

  async recentEvents(groupId: string, limit: number) {
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT e.id, e.occurred_at, e.request_id, e.trace_id, e.http_status, e.instance_id,
                e.duration_ms, e.module_code
           FROM observability.error_events e
          WHERE e.error_group_id = ?
          ORDER BY e.occurred_at DESC, e.id DESC
          LIMIT ?`,
        [groupId, limit],
      ),
    );
  }

  async eventsByModule(groupId: string) {
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT COALESCE(e.module_code, 'UNKNOWN') AS module_code, COUNT(*)::int AS events
           FROM observability.error_events e WHERE e.error_group_id = ?
          GROUP BY 1 ORDER BY 2 DESC, 1`,
        [groupId],
      ),
    );
  }

  async groupSeries(groupId: string, window: ObsWindow) {
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT ${bucketExpr(window.interval, 'e.occurred_at')} AS bucket, COUNT(*)::int AS events
           FROM observability.error_events e
          WHERE e.error_group_id = ? AND e.occurred_at >= ? AND e.occurred_at < ?
          GROUP BY 1 ORDER BY 1`,
        [window.timezone, window.timezone, groupId, window.from, window.to],
      ),
    );
  }

  async listEvents(
    filters: { groupId?: string; requestId?: string; from: Date; to: Date },
    limit: number,
    after: { occurredAt: string; id: string } | null,
  ) {
    const where = ['e.occurred_at >= ?', 'e.occurred_at < ?'];
    const params: unknown[] = [filters.from, filters.to];
    if (filters.groupId) {
      where.push('e.error_group_id = ?');
      params.push(filters.groupId);
    }
    if (filters.requestId) {
      where.push('e.request_id = ?');
      params.push(filters.requestId);
    }
    if (after) {
      where.push('(e.occurred_at, e.id) < (?::timestamptz, ?::uuid)');
      params.push(after.occurredAt, after.id);
    }
    params.push(limit + 1);
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT e.id, e.occurred_at, e.occurred_at::text AS occurred_at_text, e.error_group_id, e.request_id, e.trace_id,
                e.instance_id, e.http_status, e.error_code, e.error_reason, e.exception_type,
                e.module_code, e.operation_key, e.http_method, e.route_template, e.duration_ms
           FROM observability.error_events e
          WHERE ${where.join(' AND ')}
          ORDER BY e.occurred_at DESC, e.id DESC
          LIMIT ?`,
        params,
      ),
    );
  }

  /** Todo lo que se guardó de una petición: sus errores y su muestra lenta. */
  async byRequestId(requestId: string) {
    return this.scoped(async (tx) => {
      const events = await tx.execute<Row[]>(
        `SELECT e.id, e.occurred_at, e.error_group_id, e.request_id, e.trace_id, e.instance_id,
                e.http_status, e.error_code, e.error_reason, e.exception_type, e.module_code,
                e.operation_key, e.http_method, e.route_template, e.duration_ms,
                e.sqlstate, e.constraint_name, e.table_name, e.column_name, e.violations_json,
                e.message_redacted, e.frames_json
           FROM observability.error_events e
          WHERE e.request_id = ?
          ORDER BY e.occurred_at DESC, e.id DESC
          LIMIT 50`,
        [requestId],
      );
      const samples = await tx.execute<Row[]>(
        `SELECT p.id, p.time, p.request_id, p.trace_id, p.http_method, p.route_template,
                p.operation_key, p.module_code, p.http_status, p.duration_ms, p.sql_count,
                p.sql_total_ms, p.sql_top_json, p.sampled_because
           FROM observability.slow_request_samples p
          WHERE p.request_id = ?
          ORDER BY p.time DESC, p.id DESC
          LIMIT 5`,
        [requestId],
      );
      return { events, samples };
    });
  }

  // ------------------------------------------------------------ mutación

  /**
   * Cambia el estado de un grupo si `row_version` coincide. Devuelve la fila
   * nueva o `null` si no hubo coincidencia (no existe o la versión cambió).
   */
  async changeState(input: {
    id: string;
    expectedVersion: number;
    stateConceptId: string;
    resolved: boolean;
    note: string | null;
    actorId: string;
    now: Date;
  }): Promise<Row | null> {
    return this.em.fork().transactional(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `UPDATE observability.error_groups g
            SET state_concept_id = ?,
                resolved_at = CASE WHEN ?::boolean THEN ?::timestamptz ELSE NULL END,
                resolved_by_user_id = CASE WHEN ?::boolean THEN ?::uuid ELSE NULL END,
                resolution_note = ?::text,
                updated_at = ?::timestamptz,
                updated_by_user_id = ?::uuid,
                row_version = g.row_version + 1
          WHERE g.id = ? AND g.row_version = ?
          RETURNING ${GROUP_COLUMNS}, g.sample_message, g.sample_frames_json`,
        [
          input.stateConceptId,
          input.resolved,
          input.now,
          input.resolved,
          input.actorId,
          input.note,
          input.now,
          input.actorId,
          input.id,
          input.expectedVersion,
        ],
      );
      return rows[0] ?? null;
    });
  }

  // ----------------------------------------------------------------- SQL

  async sqlTotals(window: ObsWindow): Promise<SqlAggregate> {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT ${SQL_AGGREGATES}
           FROM observability.sql_statement_minute_series s
          WHERE s.time >= ? AND s.time < ?`,
        [window.from, window.to],
      );
      return toSqlAggregate(row ?? {});
    });
  }

  async sqlSeries(window: ObsWindow, groupBy: 'none' | 'module') {
    const keyExpr =
      groupBy === 'module' ? "COALESCE(s.module_code, 'UNKNOWN')" : "'all'";
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT ${bucketExpr(window.interval, 's.time')} AS bucket, ${keyExpr} AS key,
                ${SQL_AGGREGATES}
           FROM observability.sql_statement_minute_series s
          WHERE s.time >= ? AND s.time < ?
          GROUP BY 1, 2 ORDER BY 1, 2`,
        [window.timezone, window.timezone, window.from, window.to],
      );
      return rows.map((row) => ({
        bucket: new Date(row.bucket as string | Date),
        key: String(row.key),
        agg: toSqlAggregate(row),
      }));
    });
  }

  async sqlTopSlow(window: ObsWindow) {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT s.query_hash, SUM(s.slow_count)::int AS slow
           FROM observability.sql_statement_minute_series s
          WHERE s.time >= ? AND s.time < ?
          GROUP BY 1 HAVING SUM(s.slow_count) > 0
          ORDER BY 2 DESC, 1 LIMIT 1`,
        [window.from, window.to],
      );
      return row
        ? { queryHash: String(row.query_hash), slow: n(row.slow) }
        : null;
    });
  }

  async sqlStatements(window: ObsWindow, module?: string) {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT s.query_hash, st.statement_class, st.primary_table,
                array_agg(DISTINCT COALESCE(s.module_code, 'UNKNOWN')) AS modules,
                ${SQL_AGGREGATES}
           FROM observability.sql_statement_minute_series s
           LEFT JOIN observability.sql_statements st ON st.query_hash = s.query_hash
          WHERE s.time >= ? AND s.time < ?
            ${module ? 'AND s.module_code = ?' : ''}
          GROUP BY s.query_hash, st.statement_class, st.primary_table`,
        module ? [window.from, window.to, module] : [window.from, window.to],
      );
      return rows.map((row) => ({
        queryHash: String(row.query_hash),
        statementClass: (row.statement_class as string | null) ?? null,
        primaryTable: (row.primary_table as string | null) ?? null,
        modules: (row.modules as string[]).slice().sort(),
        agg: toSqlAggregate(row),
      }));
    });
  }

  async sqlStatement(hash: string) {
    return this.scoped(async (tx) => {
      const [row] = await tx.execute<Row[]>(
        `SELECT st.query_hash, st.statement_class, st.normalized_sql, st.primary_table,
                st.first_seen_at, st.last_seen_at, st.is_slow_ever
           FROM observability.sql_statements st WHERE st.query_hash = ?`,
        [hash],
      );
      return row ?? null;
    });
  }

  async sqlStatementSeries(hash: string, window: ObsWindow) {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT ${bucketExpr(window.interval, 's.time')} AS bucket, ${SQL_AGGREGATES}
           FROM observability.sql_statement_minute_series s
          WHERE s.query_hash = ? AND s.time >= ? AND s.time < ?
          GROUP BY 1 ORDER BY 1`,
        [window.timezone, window.timezone, hash, window.from, window.to],
      );
      return rows.map((row) => ({
        bucket: new Date(row.bucket as string | Date),
        agg: toSqlAggregate(row),
      }));
    });
  }

  async sqlStatementOperations(hash: string, window: ObsWindow) {
    return this.scoped(async (tx) => {
      const rows = await tx.execute<Row[]>(
        `SELECT s.operation_key, COALESCE(s.module_code, 'UNKNOWN') AS module_code,
                ${SQL_AGGREGATES}
           FROM observability.sql_statement_minute_series s
          WHERE s.query_hash = ? AND s.time >= ? AND s.time < ?
          GROUP BY 1, 2`,
        [hash, window.from, window.to],
      );
      return rows.map((row) => ({
        operationKey: String(row.operation_key),
        moduleCode: String(row.module_code),
        agg: toSqlAggregate(row),
      }));
    });
  }

  async slowSamplesOfStatement(hash: string, limit: number) {
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT p.request_id, p.time, p.duration_ms, p.operation_key, p.http_status
           FROM observability.slow_request_samples p
          WHERE p.sql_top_json @> ?::jsonb
          ORDER BY p.time DESC, p.id DESC
          LIMIT ?`,
        [JSON.stringify([{ queryHash: hash }]), limit],
      ),
    );
  }

  async listSlowSamples(
    window: ObsWindow,
    limit: number,
    after: { time: string; id: string } | null,
  ) {
    const where = ['p.time >= ?', 'p.time < ?'];
    const params: unknown[] = [window.from, window.to];
    if (after) {
      where.push('(p.time, p.id) < (?::timestamptz, ?::uuid)');
      params.push(after.time, after.id);
    }
    params.push(limit + 1);
    return this.scoped((tx) =>
      tx.execute<Row[]>(
        `SELECT p.id, p.time, p.time::text AS time_text, p.request_id, p.trace_id, p.instance_id,
                p.http_method, p.route_template, p.operation_key, p.module_code, p.http_status,
                p.duration_ms, p.sql_count, p.sql_total_ms, p.sql_top_json, p.sampled_because
           FROM observability.slow_request_samples p
          WHERE ${where.join(' AND ')}
          ORDER BY p.time DESC, p.id DESC
          LIMIT ?`,
        params,
      ),
    );
  }
}
