import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../common';
import { HTTP_SLI_CODE } from '../../observability/http-sli/http-sli.aggregator';
import type { CumulativeBuckets } from './domain/latency-buckets';

/** Intervalo de los cubos de la serie. Se incrusta en el SQL: sólo estos dos valores. */
export type TrafficInterval = 'hour' | 'day';

export interface TrafficTotalsRow {
  requests: number;
  succeeded: number;
  client_4xx: number;
  server_5xx: number;
  sum_ms: number;
  max_ms: number;
  last_time: Date | null;
}

export interface TrafficSeriesRow {
  bucket: Date;
  requests: number;
  failed_4xx: number;
  failed_5xx: number;
}

export interface TrafficEndpointRow {
  series_id: string;
  requests: number;
  succeeded: number;
  client_4xx: number;
  server_5xx: number;
  sum_ms: number;
  max_ms: number;
  first_seen: Date;
  last_seen: Date;
}

export interface ActiveUsersRow {
  sessions_now: number;
  users_now: number;
  users_window: number;
}

/** Histograma acumulado por clave, ya sumado por la base. */
export interface BucketRow {
  key: string;
  n: number;
}

/**
 * Número desde un campo `jsonb` leído como texto. Una fila con un valor que no
 * es numérico cuenta como 0 en vez de hacer fallar toda la lectura: estas filas
 * las escribe `http-sli`, pero la tabla es compartida y no hay clave que lo
 * garantice. La expresión regular no lleva `?`: MikroORM lo leería como un
 * marcador de parámetro.
 */
const num = (expr: string) =>
  `CASE WHEN (${expr}) ~ '^[0-9]+$|^[0-9]+[.][0-9]+$' THEN (${expr})::float8 ELSE 0 END`;

/** El histograma como objeto `jsonb`, o `{}` si falta o no es un objeto. */
const BUCKETS_OBJECT = `CASE WHEN jsonb_typeof(s.dimensions->'latency'->'buckets') = 'object'
                THEN s.dimensions->'latency'->'buckets' ELSE '{}'::jsonb END`;

/** Lo común a todas las lecturas: la serie de peticiones de la plataforma en la ventana. */
const WINDOWED = `s.sli_code = ? AND s.tenant_id = ? AND s.series_id LIKE 'http|%'
        AND s.time >= ? AND s.time < ?`;

/**
 * Lecturas de tráfico HTTP para la consola de operación: sólo SELECT sobre
 * `time_series.service_sli_series` (la serie que escribe `http-sli`) e
 * `iam.sessions`.
 *
 * Todo es agregado: nunca se devuelve un identificador de usuario ni una fila
 * cruda. Las lecturas corren en una transacción propia que, con
 * `RLS_ENFORCE=true`, fija el tenant de plataforma —el mismo bajo el que se
 * escriben las series—, de modo que un superadmin que opera en otra
 * organización sigue viendo la serie de la plataforma y no la de esa.
 */
@Injectable()
export class OpsTrafficRepository {
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  constructor(private readonly em: EntityManager) {}

  private async scoped<T>(fn: (tx: EntityManager) => Promise<T>): Promise<T> {
    return this.em.fork().transactional(async (tx) => {
      if (this.enforceRls) {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [SEED.tenantId],
        );
      }
      return fn(tx);
    });
  }

  private window(from: Date, to: Date): unknown[] {
    return [HTTP_SLI_CODE, SEED.tenantId, from, to];
  }

  /** Todo lo que la vista necesita de la ventana, en una sola transacción. */
  async readWindow(from: Date, to: Date, interval: TrafficInterval) {
    return this.scoped(async (tx) => {
      const params = this.window(from, to);
      const [totals] = await tx.execute<TrafficTotalsRow[]>(
        `SELECT COALESCE(SUM(s.denominator), 0)::float8 AS requests,
                COALESCE(SUM(s.numerator), 0)::float8 AS succeeded,
                COALESCE(SUM(${num("s.dimensions->'codes'->>'4xx'")}), 0)::float8 AS client_4xx,
                COALESCE(SUM(${num("s.dimensions->'codes'->>'5xx'")}), 0)::float8 AS server_5xx,
                COALESCE(SUM(${num("s.dimensions->'latency'->>'sumMs'")}), 0)::float8 AS sum_ms,
                COALESCE(MAX(${num("s.dimensions->'latency'->>'maxMs'")}), 0)::float8 AS max_ms,
                MAX(s.time) AS last_time
           FROM time_series.service_sli_series s
          WHERE ${WINDOWED}`,
        params,
      );
      const buckets = await tx.execute<BucketRow[]>(
        `SELECT b.key AS key, SUM(${num('b.value')})::float8 AS n
           FROM time_series.service_sli_series s
          CROSS JOIN LATERAL jsonb_each_text(${BUCKETS_OBJECT}) AS b(key, value)
          WHERE ${WINDOWED}
          GROUP BY b.key`,
        params,
      );
      const series = await tx.execute<TrafficSeriesRow[]>(
        `SELECT date_trunc('${interval}', s.time AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS bucket,
                SUM(s.denominator)::float8 AS requests,
                SUM(${num("s.dimensions->'codes'->>'4xx'")})::float8 AS failed_4xx,
                SUM(${num("s.dimensions->'codes'->>'5xx'")})::float8 AS failed_5xx
           FROM time_series.service_sli_series s
          WHERE ${WINDOWED}
          GROUP BY 1
          ORDER BY 1`,
        params,
      );
      const seriesBuckets = await tx.execute<(BucketRow & { bucket: Date })[]>(
        `SELECT date_trunc('${interval}', s.time AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS bucket,
                b.key AS key, SUM(${num('b.value')})::float8 AS n
           FROM time_series.service_sli_series s
          CROSS JOIN LATERAL jsonb_each_text(${BUCKETS_OBJECT}) AS b(key, value)
          WHERE ${WINDOWED}
          GROUP BY 1, b.key`,
        params,
      );
      return { totals, buckets, series, seriesBuckets };
    });
  }

  /** Una fila por (método, plantilla) con su histograma, sin tope: el servicio ordena y corta. */
  async readEndpoints(from: Date, to: Date) {
    return this.scoped(async (tx) => {
      const params = this.window(from, to);
      const endpoints = await tx.execute<TrafficEndpointRow[]>(
        `SELECT s.series_id AS series_id,
                SUM(s.denominator)::float8 AS requests,
                SUM(s.numerator)::float8 AS succeeded,
                SUM(${num("s.dimensions->'codes'->>'4xx'")})::float8 AS client_4xx,
                SUM(${num("s.dimensions->'codes'->>'5xx'")})::float8 AS server_5xx,
                SUM(${num("s.dimensions->'latency'->>'sumMs'")})::float8 AS sum_ms,
                MAX(${num("s.dimensions->'latency'->>'maxMs'")})::float8 AS max_ms,
                MIN(s.time) AS first_seen, MAX(s.time) AS last_seen
           FROM time_series.service_sli_series s
          WHERE ${WINDOWED}
          GROUP BY s.series_id`,
        params,
      );
      const buckets = await tx.execute<(BucketRow & { series_id: string })[]>(
        `SELECT s.series_id AS series_id, b.key AS key, SUM(${num('b.value')})::float8 AS n
           FROM time_series.service_sli_series s
          CROSS JOIN LATERAL jsonb_each_text(${BUCKETS_OBJECT}) AS b(key, value)
          WHERE ${WINDOWED}
          GROUP BY s.series_id, b.key`,
        params,
      );
      return { endpoints, buckets };
    });
  }

  /**
   * Usuarios activos desde las sesiones de IAM: vigentes ahora (`ACTIVE` y no
   * vencidas) y distintos que abrieron sesión dentro de la ventana. Sólo
   * conteos; `iam.sessions` no lleva `tenant_id`, así que no aplica el RLS.
   */
  async readActiveUsers(from: Date, to: Date): Promise<ActiveUsersRow> {
    const [row] = await this.em.fork().execute<ActiveUsersRow[]>(
      `SELECT COUNT(*) FILTER (WHERE s.state_concept_id = ? AND s.expires_at > now())::int AS sessions_now,
              COUNT(DISTINCT s.user_id) FILTER (WHERE s.state_concept_id = ? AND s.expires_at > now())::int AS users_now,
              COUNT(DISTINCT s.user_id) FILTER (WHERE s.created_at >= ? AND s.created_at < ?)::int AS users_window
         FROM iam.sessions s`,
      [CONCEPTS.STATE_ACTIVE, CONCEPTS.STATE_ACTIVE, from, to],
    );
    return row ?? { sessions_now: 0, users_now: 0, users_window: 0 };
  }
}

/** Convierte filas `{key, n}` en un histograma acumulado indexable. */
export function bucketsOf(rows: readonly BucketRow[]): CumulativeBuckets {
  return Object.fromEntries(rows.map((row) => [row.key, row.n]));
}
