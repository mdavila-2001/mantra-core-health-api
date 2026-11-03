import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { loadHttpSliEnv } from '../../../observability/http-sli/http-sli.env';
import { SERIES_PREFIX } from '../../../observability/http-sli/http-sli.aggregator';
import { RouteIndexService } from '../../../observability/route-index/route-index.service';
import {
  WindowError,
  type AnalyticsWindow,
  type Interval,
} from '../../../common/time/analytics-window';
import {
  describeNotMeasured,
  mergeLatency,
  quantileFromBuckets,
  summarizeLatency,
  type CumulativeBuckets,
} from '../domain/latency-buckets';
import { resolveTrafficWindow } from '../domain/traffic-window';
import {
  OpsTrafficRepository,
  bucketsOf,
  type BucketRow,
} from '../infrastructure/repositories/ops-traffic.repository';

export interface TrafficQuery {
  from?: string;
  to?: string;
  interval?: Interval;
}

export type EndpointSort = 'requests' | 'failed' | 'p95';

export interface TrafficEndpointsQuery {
  from?: string;
  to?: string;
  limit?: number;
  sort?: EndpointSort;
}

const DEFAULT_ENDPOINT_LIMIT = 50;
const MAX_ENDPOINT_LIMIT = 200;

const count = (value: number) => Math.round(value);
const ms = (value: number | null) =>
  value === null ? null : Math.round(value * 100) / 100;
const ratio = (num: number, den: number) =>
  den === 0 ? null : Math.round((num / den) * 10_000) / 10_000;

/** `http|GET|/patients/:id` → `{ method: 'GET', route: '/patients/:id' }`. */
export function parseSeriesId(
  seriesId: string,
): { method: string; route: string } | null {
  const [prefix, method, ...rest] = seriesId.split('|');
  if (prefix !== SERIES_PREFIX || !method || rest.length === 0) return null;
  return { method, route: rest.join('|') };
}

/** Agrupa filas `{key, n}` por una clave de grupo y las vuelve histogramas. */
function groupBuckets<T extends BucketRow>(
  rows: readonly T[],
  groupOf: (row: T) => string,
): Map<string, CumulativeBuckets> {
  const grouped = new Map<string, BucketRow[]>();
  for (const row of rows) {
    const group = groupOf(row);
    const list = grouped.get(group) ?? [];
    list.push(row);
    grouped.set(group, list);
  }
  return new Map([...grouped].map(([group, list]) => [group, bucketsOf(list)]));
}

/**
 * Tráfico HTTP de la API para la consola de operación: cuántas peticiones,
 * cuántas bien y mal, qué tan rápido, quién la usa y por qué rutas.
 *
 * Lo que se devuelve es agregado y por **plantilla** de ruta; nunca una
 * dirección real ni un usuario. Y se dice lo que no se mide (`notMeasured`):
 * un panel que muestra 0 donde no sabe es peor que uno que dice «no sé».
 */
@Injectable()
export class OpsTrafficService {
  constructor(
    private readonly repo: OpsTrafficRepository,
    private readonly routes: RouteIndexService,
  ) {}

  private resolveWindow(query: TrafficQuery): AnalyticsWindow {
    try {
      return resolveTrafficWindow(query);
    } catch (error) {
      if (error instanceof WindowError) {
        throw new DomainException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          error.message,
          { reason: error.reason },
        );
      }
      throw error;
    }
  }

  private windowView(window: AnalyticsWindow) {
    return {
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      interval: window.interval,
      timezone: window.timezone,
    };
  }

  async traffic(query: TrafficQuery) {
    const window = this.resolveWindow(query);
    const enabled = loadHttpSliEnv().enabled;

    const [data, users] = await Promise.all([
      this.repo.readWindow(window.from, window.to, window.interval),
      this.repo.readActiveUsers(window.from, window.to),
    ]);
    const totals = data.totals ?? {
      requests: 0,
      succeeded: 0,
      client_4xx: 0,
      server_5xx: 0,
      sum_ms: 0,
      max_ms: 0,
      last_time: null,
    };

    const latency = summarizeLatency(
      mergeLatency([
        {
          sumMs: totals.sum_ms,
          maxMs: totals.max_ms,
          buckets: bucketsOf(data.buckets),
        },
      ]),
    );

    const perBucket = groupBuckets(data.seriesBuckets, (row) =>
      new Date(row.bucket).toISOString(),
    );

    return {
      window: this.windowView(window),
      measured: {
        requests: count(totals.requests),
        succeeded: count(totals.succeeded),
        failed: {
          client4xx: count(totals.client_4xx),
          server5xx: count(totals.server_5xx),
        },
        successRatio: ratio(totals.succeeded, totals.requests),
        latencyMs: {
          avg: ms(latency.avg),
          p50: ms(latency.p50),
          p95: ms(latency.p95),
          max: ms(latency.max),
          method: 'histogram-estimate',
          approximate: latency.approximate,
        },
        activeUsers: {
          sessionsActiveNow: users.sessions_now,
          usersActiveNow: users.users_now,
          usersActiveInWindow: users.users_window,
          definition:
            'Ahora: sesiones de IAM en estado ACTIVE y no vencidas. En la ventana: usuarios distintos que abrieron sesión dentro de ella. No son usuarios que hicieron peticiones: la medición de peticiones no guarda quién las hizo.',
        },
        lastDataAt: totals.last_time
          ? new Date(totals.last_time).toISOString()
          : null,
      },
      series: data.series.map((row) => {
        const bucket = new Date(row.bucket).toISOString();
        const buckets = perBucket.get(bucket);
        return {
          bucket,
          requests: count(row.requests),
          failed4xx: count(row.failed_4xx),
          failed5xx: count(row.failed_5xx),
          p95Ms: buckets ? ms(quantileFromBuckets(buckets, 0.95).value) : null,
        };
      }),
      notMeasured: describeNotMeasured(enabled),
    };
  }

  async endpoints(query: TrafficEndpointsQuery) {
    const window = this.resolveWindow(query);
    const limit = Math.min(
      query.limit ?? DEFAULT_ENDPOINT_LIMIT,
      MAX_ENDPOINT_LIMIT,
    );
    const sort: EndpointSort = query.sort ?? 'requests';

    const { endpoints, buckets } = await this.repo.readEndpoints(
      window.from,
      window.to,
    );
    const perSeries = groupBuckets(buckets, (row) => row.series_id);

    const items = endpoints
      .map((row) => {
        const parsed = parseSeriesId(row.series_id);
        if (!parsed) return null;
        const merged = mergeLatency([
          {
            sumMs: row.sum_ms,
            maxMs: row.max_ms,
            buckets: perSeries.get(row.series_id),
          },
        ]);
        const summary = summarizeLatency(merged);
        return {
          method: parsed.method,
          route: parsed.route,
          operationId:
            this.routes.lookup(parsed.method, parsed.route)?.operationId ??
            null,
          requests: count(row.requests),
          succeeded: count(row.succeeded),
          failed4xx: count(row.client_4xx),
          failed5xx: count(row.server_5xx),
          latencyMs: {
            avg: ms(summary.avg),
            p95: ms(summary.p95),
            max: ms(summary.max),
          },
          firstSeenAt: new Date(row.first_seen).toISOString(),
          lastSeenAt: new Date(row.last_seen).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const key = (item: (typeof items)[number]): number =>
      sort === 'failed'
        ? item.failed4xx + item.failed5xx
        : sort === 'p95'
          ? (item.latencyMs.p95 ?? -1)
          : item.requests;

    items.sort(
      (a, b) =>
        key(b) - key(a) ||
        a.route.localeCompare(b.route) ||
        a.method.localeCompare(b.method),
    );

    return {
      window: this.windowView(window),
      sort,
      items: items.slice(0, limit),
      truncated: items.length > limit,
      note: 'Las rutas son plantillas (/patients/:id), nunca la dirección real. UNMATCHED agrupa lo que no coincidió con ninguna ruta; __overflow__, lo que superó el tope de cardinalidad por minuto.',
    };
  }
}
