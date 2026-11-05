import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../../common/errors/domain.exception';
import { ErrorCode } from '../../../common/errors/error-codes';
import { badRequestWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  errorSink,
  operationResolver,
  slowRequestSink,
  type ObservabilityEnv,
} from '../../../observability/capture';
import {
  HTTP_BOUNDS_MS,
  SQL_BOUNDS_MS,
  percentileValue,
} from '../domain/latency-histogram';
import { NOT_MEASURED, type NotMeasured } from '../domain/not-measured';
import {
  resolveObsWindow,
  windowView,
  type ObsInterval,
  type ObsWindow,
} from '../domain/observability-window';
import {
  ObservabilityReadRepository,
  type ErrorGroupSort,
  type HttpAggregate,
  type SqlAggregate,
} from '../infrastructure/observability-read.repository';
import {
  ERROR_GROUP_STATE,
  errorGroupStateOf,
  type ErrorGroupStateCode,
} from '../observability.concepts';
import { ObservabilityErrorReason } from '../observability.error-reasons';
import {
  OBSERVABILITY_ENV,
  ObservabilityFlushService,
} from './observability-flush.service';

type Row = Record<string, unknown>;

/** Muestra mínima para publicar un percentil por cubo (menos: `null` + razón). */
export const MIN_SAMPLE = 5;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const HASH_PATTERN = /^(?:[0-9a-f]{12}|__overflow__)$/;

export interface WindowQuery {
  from?: string;
  to?: string;
  tz?: string;
  interval?: ObsInterval;
}

const iso = (value: unknown): string | null =>
  value === null || value === undefined
    ? null
    : new Date(value as string | Date).toISOString();

const ratio = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 1_000_000) / 1_000_000 : null;

/** Latencia de un agregado HTTP; sin muestras, `null` con razón (nunca 0). */
function httpLatency(agg: HttpAggregate) {
  const total = agg.requests;
  const p = (q: number) =>
    percentileValue(HTTP_BOUNDS_MS, agg.cumulative, total, q, agg.maxMs);
  return {
    p50: p(0.5),
    p95: p(0.95),
    p99: p(0.99),
    avg: total > 0 ? Math.round((agg.sumMs / total) * 100) / 100 : null,
    max: total > 0 ? agg.maxMs : null,
    method: 'histogram-estimate' as const,
    approximate: true as const,
  };
}

function sqlLatency(agg: SqlAggregate) {
  const total = agg.executions;
  const p = (q: number) =>
    percentileValue(SQL_BOUNDS_MS, agg.cumulative, total, q, agg.maxMs);
  return {
    p50: p(0.5),
    p95: p(0.95),
    p99: p(0.99),
    avg: total > 0 ? Math.round((agg.sumMs / total) * 100) / 100 : null,
    max: total > 0 ? agg.maxMs : null,
    method: 'histogram-estimate' as const,
    approximate: true as const,
  };
}

const p95Of = (agg: HttpAggregate): number => httpLatency(agg).p95.value ?? -1;
const p99Of = (agg: HttpAggregate): number => httpLatency(agg).p99.value ?? -1;

/**
 * Lecturas del portal «Sistema». Cada respuesta lleva el sobre común
 * `{window, freshness, notMeasured[], generatedAt}`; una cifra que no se pudo
 * medir es `null` con su `reason`, nunca 0.
 */
@Injectable()
export class ObservabilityReadService {
  constructor(
    private readonly repo: ObservabilityReadRepository,
    private readonly flush: ObservabilityFlushService,
    @Inject(OBSERVABILITY_ENV) private readonly env: ObservabilityEnv,
  ) {}

  // ------------------------------------------------------------- sobre

  private async envelope(
    window: ObsWindow,
    notMeasured: readonly NotMeasured[],
    now = new Date(),
  ) {
    const activity = await this.repo.instanceActivity(window);
    const last = activity.lastSeenAt;
    return {
      activity,
      head: {
        window: windowView(window),
        freshness: {
          lastFlushAt: iso(last),
          lagSeconds: last
            ? Math.max(0, Math.round((now.getTime() - last.getTime()) / 1000))
            : null,
          droppedFlushes: this.flush.droppedFlushes,
        },
        notMeasured: [...notMeasured],
        generatedAt: now.toISOString(),
      },
    };
  }

  private baseNotMeasured(): NotMeasured[] {
    const list: NotMeasured[] = [
      NOT_MEASURED.rejectedBeforeApi,
      NOT_MEASURED.healthchecksExcluded,
      NOT_MEASURED.percentilesEstimated,
    ];
    if (!this.env.enabled) {
      list.push({
        metric: 'observability',
        reason:
          'OBSERVABILITY_ENABLED=false en esta instancia: no se captura. Lo que se lee es lo que otras instancias o ejecuciones anteriores hayan guardado',
      });
    }
    return list;
  }

  private window(query: WindowQuery): ObsWindow {
    return resolveObsWindow(query);
  }

  // ------------------------------------------------------------ resumen

  async summary(query: WindowQuery) {
    const window = this.window(query);
    const [totals, sql, slowTop, groups] = await Promise.all([
      this.repo.httpTotals(window),
      this.repo.sqlTotals(window),
      this.repo.sqlTopSlow(window),
      this.repo.errorGroupSummary(window),
    ]);
    const { activity, head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.errorSampling,
      NOT_MEASURED.workers,
      NOT_MEASURED.dependencies,
      NOT_MEASURED.slo,
    ]);
    const measuring = activity.instancesInWindow > 0 || totals.requests > 0;
    const unmeasured = {
      value: null,
      reason: 'NO_INSTANCE_REPORTED_IN_WINDOW',
    };
    const rate = (num: number) =>
      !measuring
        ? unmeasured
        : totals.requests > 0
          ? { value: ratio(num, totals.requests) }
          : { value: null, reason: 'NO_REQUESTS_IN_WINDOW' };
    return {
      ...head,
      kpis: {
        requests: measuring ? { value: totals.requests } : unmeasured,
        errorRate5xx: rate(totals.c5xx),
        errorRate4xx: rate(totals.c4xx),
        latencyMs: measuring
          ? httpLatency(totals)
          : { ...unmeasured, method: 'histogram-estimate', approximate: true },
        errorGroups: { value: groups },
        slowSql: measuring
          ? {
              value: {
                count: sql.slowCount,
                topHash: slowTop?.queryHash ?? null,
              },
            }
          : unmeasured,
        workers: { value: null, reason: 'WORKERS_NOT_REPORTING' },
        dependencies: { value: null, reason: 'DEPENDENCIES_NOT_PROBED' },
        slo: { value: null, reason: 'SLO_NOT_COMPUTED' },
      },
      statusClasses: measuring
        ? {
            '2xx': totals.c2xx,
            '3xx': totals.c3xx,
            '4xx': totals.c4xx,
            '5xx': totals.c5xx,
            other: totals.cOther,
          }
        : null,
      latencyBuckets: measuring
        ? HTTP_BOUNDS_MS.map((le, index) => ({
            leMs: le,
            count: totals.cumulative[index],
          }))
            .concat([
              { leMs: Number.POSITIVE_INFINITY, count: totals.requests },
            ])
            .map((b) => ({
              leMs: Number.isFinite(b.leMs) ? b.leMs : null,
              count: b.count,
            }))
        : null,
    };
  }

  // -------------------------------------------------------- series

  async timeseries(
    query: WindowQuery & {
      metric: string;
      groupBy?: 'none' | 'module' | 'status_class';
    },
  ) {
    const window = this.window(query);
    const groupBy = query.groupBy ?? 'none';
    const metric = query.metric;
    const additive = new Set([
      'requests',
      'errors4xx',
      'errors5xx',
      'sql_slow',
      'error_events',
    ]);
    if (groupBy !== 'none' && !additive.has(metric)) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        `La métrica ${metric} no admite agrupar por ${groupBy}`,
        undefined,
        ObservabilityErrorReason.UNSUPPORTED_GROUPING,
      );
    }
    if (groupBy === 'status_class' && metric !== 'requests') {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'Agrupar por clase de estado sólo aplica a requests',
        undefined,
        ObservabilityErrorReason.UNSUPPORTED_GROUPING,
      );
    }

    const series = new Map<
      string,
      { bucket: string; value: number | null; reason?: string }[]
    >();
    const push = (
      key: string,
      bucket: Date,
      value: number | null,
      reason?: string,
    ) => {
      const list = series.get(key) ?? [];
      list.push({
        bucket: bucket.toISOString(),
        value,
        ...(reason ? { reason } : {}),
      });
      series.set(key, list);
    };

    const notMeasured = [...this.baseNotMeasured()];
    if (
      [
        'requests',
        'errors4xx',
        'errors5xx',
        'latency_p95',
        'latency_p99',
      ].includes(metric)
    ) {
      const rows = await this.repo.httpSeries(
        window,
        groupBy === 'module' || groupBy === 'status_class' ? groupBy : 'none',
      );
      for (const { bucket, key, agg } of rows) {
        const k = groupBy === 'none' ? metric : key;
        if (metric === 'requests') push(k, bucket, agg.requests);
        else if (metric === 'errors4xx') push(k, bucket, agg.c4xx);
        else if (metric === 'errors5xx') push(k, bucket, agg.c5xx);
        else {
          const q = metric === 'latency_p95' ? 0.95 : 0.99;
          if (agg.requests < MIN_SAMPLE) {
            push(k, bucket, null, 'MUESTRA_INSUFICIENTE');
          } else {
            const pv = percentileValue(
              HTTP_BOUNDS_MS,
              agg.cumulative,
              agg.requests,
              q,
              agg.maxMs,
            );
            push(
              k,
              bucket,
              pv.value,
              pv.value === null ? pv.reason : undefined,
            );
          }
        }
      }
    } else if (metric === 'sql_ms' || metric === 'sql_slow') {
      notMeasured.push(NOT_MEASURED.sqlOnlyOrm);
      const rows = await this.repo.sqlSeries(
        window,
        groupBy === 'module' ? 'module' : 'none',
      );
      for (const { bucket, key, agg } of rows) {
        const k = groupBy === 'none' ? metric : key;
        push(
          k,
          bucket,
          metric === 'sql_ms'
            ? Math.round(agg.sumMs * 100) / 100
            : agg.slowCount,
        );
      }
    } else if (metric === 'error_events') {
      notMeasured.push(NOT_MEASURED.errorSampling);
      const rows = await this.repo.listEventBuckets(
        window,
        groupBy === 'module' ? 'module' : 'none',
      );
      for (const { bucket, key, count } of rows) {
        push(groupBy === 'none' ? metric : key, bucket, count);
      }
    }

    const { head } = await this.envelope(window, notMeasured);
    return {
      ...head,
      metric,
      groupBy,
      minSample: MIN_SAMPLE,
      note: 'Un cubo sin fila es «sin dato», no cero.',
      series: [...series.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, points]) => ({ key, points })),
    };
  }

  // ------------------------------------------------------- endpoints

  async endpoints(
    query: WindowQuery & {
      module?: string;
      sort?: 'requests' | 'failed' | 'p95' | 'p99' | 'errorGroups';
      cursor?: string;
      limit?: number;
    },
  ) {
    const window = this.window(query);
    const sort = query.sort ?? 'requests';
    const limit = query.limit ?? 50;
    const [rows, open] = await Promise.all([
      this.repo.httpByEndpoint(window, query.module),
      this.repo.openGroupCounts(),
    ]);
    const openByRoute = new Map<string, number>();
    for (const g of open) {
      const key = `${g.method}|${g.route}`;
      openByRoute.set(key, (openByRoute.get(key) ?? 0) + g.groups);
    }
    const items = rows.map((row) => ({
      method: row.method,
      route: row.route,
      operationKey: row.operationKey,
      moduleCode: row.moduleCode,
      requests: row.agg.requests,
      failed4xx: row.agg.c4xx,
      failed5xx: row.agg.c5xx,
      latencyMs: (() => {
        const l = httpLatency(row.agg);
        return { p50: l.p50, p95: l.p95, p99: l.p99, avg: l.avg, max: l.max };
      })(),
      errorGroupsOpen: openByRoute.get(`${row.method}|${row.route}`) ?? 0,
      lastSeenAt: row.lastSeenAt.toISOString(),
      _sort:
        sort === 'requests'
          ? row.agg.requests
          : sort === 'failed'
            ? row.agg.c4xx + row.agg.c5xx
            : sort === 'p95'
              ? p95Of(row.agg)
              : sort === 'p99'
                ? p99Of(row.agg)
                : (openByRoute.get(`${row.method}|${row.route}`) ?? 0),
    }));
    const page = this.pageSorted(items, sort, query.cursor, limit, (i) => [
      i.method,
      i.route,
    ]);
    const { head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.errorSampling,
    ]);
    return {
      ...head,
      sort,
      items: page.items.map(({ _sort, ...rest }) => rest),
      nextCursor: page.nextCursor,
      total: items.length,
    };
  }

  /**
   * Orden `valor DESC, clave ASC` con cursor keyset en memoria. Determinista: el
   * desempate es la clave natural, nunca el orden de llegada.
   */
  private pageSorted<T extends { _sort: number }>(
    items: T[],
    sort: string,
    cursor: string | undefined,
    limit: number,
    keyOf: (item: T) => [string, string],
  ) {
    const sorted = [...items].sort((a, b) => {
      if (b._sort !== a._sort) return b._sort - a._sort;
      const [am, ar] = keyOf(a);
      const [bm, br] = keyOf(b);
      return am.localeCompare(bm) || ar.localeCompare(br);
    });
    let start = 0;
    if (cursor) {
      const c = decodeKeysetCursor(cursor);
      if (
        c.s !== sort ||
        typeof c.v !== 'number' ||
        typeof c.m !== 'string' ||
        typeof c.r !== 'string'
      ) {
        throw badRequestWithReason(
          'El cursor de paginación no es válido',
          SystemErrorReason.INVALID_CURSOR,
          { parameter: 'cursor' },
        );
      }
      const after = sorted.findIndex((item) => {
        const [m, r] = keyOf(item);
        return (
          item._sort < (c.v as number) ||
          (item._sort === c.v &&
            (m.localeCompare(c.m as string) || r.localeCompare(c.r as string)) >
              0)
        );
      });
      start = after === -1 ? sorted.length : after;
    }
    const slice = sorted.slice(start, start + limit);
    const hasMore = start + limit < sorted.length;
    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeKeysetCursor({
            s: sort,
            v: last._sort,
            m: keyOf(last)[0],
            r: keyOf(last)[1],
          })
        : null;
    return { items: slice, nextCursor };
  }

  async modules(query: WindowQuery) {
    const window = this.window(query);
    const [rows, open] = await Promise.all([
      this.repo.httpByModule(window),
      this.repo.openGroupCounts(),
    ]);
    const openByModule = new Map<string, number>();
    for (const g of open) {
      openByModule.set(
        g.moduleCode,
        (openByModule.get(g.moduleCode) ?? 0) + g.groups,
      );
    }
    const items = rows
      .map((row) => ({
        moduleCode: row.moduleCode,
        requests: row.agg.requests,
        failed4xx: row.agg.c4xx,
        failed5xx: row.agg.c5xx,
        errorRate: ratio(row.agg.c5xx, row.agg.requests),
        latencyMs: { p95: httpLatency(row.agg).p95 },
        errorGroupsOpen: openByModule.get(row.moduleCode) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.requests - a.requests || a.moduleCode.localeCompare(b.moduleCode),
      );
    const notMeasured = [...this.baseNotMeasured()];
    if (items.some((i) => i.moduleCode === 'UNKNOWN')) {
      notMeasured.push({
        metric: 'moduleAttribution',
        reason:
          operationResolver.catalogSize === 0
            ? 'data_catalog.catalog_operations está vacío en esta base: las operaciones se agrupan bajo UNKNOWN hasta que el catálogo se importe'
            : 'Hay rutas que no figuran en data_catalog.catalog_operations: se agrupan bajo UNKNOWN',
      });
    }
    const { head } = await this.envelope(window, notMeasured);
    return { ...head, items };
  }

  // ----------------------------------------------------- cobertura

  async coverage(query: WindowQuery) {
    const window = this.window(query);
    const instances = await this.repo.instances();
    const { head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.errorSampling,
      NOT_MEASURED.sqlOnlyOrm,
      NOT_MEASURED.workers,
      NOT_MEASURED.dependencies,
      NOT_MEASURED.slo,
      {
        metric: 'lastMinuteNotFlushed',
        reason:
          'Ante un corte brusco (SIGKILL) se pierde hasta un ciclo de volcado; con apagado ordenado (SIGTERM) se vuelca antes de salir',
      },
      ...(errorSink.actorHashAvailable ? [] : [NOT_MEASURED.affectedActors]),
    ]);
    const status = this.flush.status;
    return {
      ...head,
      flags: {
        observability: this.env.enabled,
        httpSli: process.env.OBSERVABILITY_HTTP_SLI_ENABLED === 'true',
        otel: process.env.OTEL_ENABLED === 'true',
        diagnostics: process.env.API_ERROR_DIAGNOSTICS === 'true',
        actorHash: errorSink.actorHashAvailable,
      },
      flush: {
        lastAt: iso(status.lastFlushAt),
        lastRows: status.lastFlushRows,
        lastDurationMs: status.lastFlushDurationMs,
        droppedFlushes: status.droppedFlushes,
        lastFailureAt: iso(status.lastFailureAt),
        lastFailureType: status.lastFailureType,
        intervalSeconds: this.env.flushSeconds,
        pendingErrorEvents: errorSink.pendingEvents,
        pendingErrorGroups: errorSink.pendingGroups,
      },
      sampling: {
        sampledOutErrorEvents: errorSink.sampledOutEvents,
        droppedErrorEvents: errorSink.droppedEvents,
        slowRequestSamplesOverCap: slowRequestSink.overCapSamples,
        slowRequestMs: this.env.slowRequestMs,
      },
      catalog: {
        operations: operationResolver.catalogSize,
        loadedAt: iso(operationResolver.catalogAt),
      },
      instances: instances.map((i) => ({
        id: i.id,
        kind: i.kind,
        name: i.name,
        status: i.status,
        buildCommit: i.build_commit ?? null,
        buildVersion: i.build_version ?? null,
        startedAt: iso(i.started_at),
        lastSeenAt: iso(i.last_seen_at),
      })),
    };
  }

  // ----------------------------------------------------- errores

  private groupView(
    row: Row,
    activity?: {
      last24h?: { events: number; actors: number };
      spark?: { bucket: Date; count: number }[];
    },
  ) {
    const actors = activity?.last24h?.actors;
    const actorsAvailable = errorSink.actorHashAvailable;
    return {
      id: String(row.id),
      title: String(row.title),
      source: String(row.source),
      httpStatus: row.http_status === null ? null : Number(row.http_status),
      code: String(row.error_code),
      reason: (row.error_reason as string | null) ?? null,
      exceptionType: (row.exception_type as string | null) ?? null,
      moduleCode: (row.module_code as string | null) ?? 'UNKNOWN',
      operationKey: (row.operation_key as string | null) ?? null,
      method: (row.http_method as string | null) ?? null,
      route: (row.route_template as string | null) ?? null,
      state: errorGroupStateOf(String(row.state_concept_id)),
      firstSeenAt: iso(row.first_seen_at),
      lastSeenAt: iso(row.last_seen_at),
      occurrencesTotal: Number(row.occurrences_total),
      occurrences24h: activity?.last24h ? activity.last24h.events : 0,
      affectedActors24h:
        actorsAvailable && actors !== undefined && actors >= MIN_SAMPLE
          ? actors
          : null,
      affectedActors24hReason: !actorsAvailable
        ? 'ACTOR_HASH_NOT_AVAILABLE'
        : actors === undefined || actors < MIN_SAMPLE
          ? 'MUESTRA_INSUFICIENTE'
          : null,
      sparkline: (activity?.spark ?? []).map((p) => ({
        bucket: p.bucket.toISOString(),
        count: p.count,
      })),
      lastRequestId: (row.last_request_id as string | null) ?? null,
      rowVersion: Number(row.row_version),
      regressedAt: iso(row.regressed_at),
      resolvedAt: iso(row.resolved_at),
      resolutionNote: (row.resolution_note as string | null) ?? null,
    };
  }

  async errorGroups(
    query: WindowQuery & {
      state?: ErrorGroupStateCode;
      module?: string;
      code?: string;
      source?: string;
      sort?: ErrorGroupSort;
      cursor?: string;
      limit?: number;
    },
  ) {
    const window = this.window(query);
    const limit = query.limit ?? 50;
    const sort = query.sort ?? 'last_seen';
    let after: { value: string; id: string } | null = null;
    if (query.cursor) {
      const c = decodeKeysetCursor(query.cursor);
      if (c.s !== sort || typeof c.v !== 'string' || typeof c.id !== 'string') {
        throw badRequestWithReason(
          'El cursor de paginación no es válido',
          SystemErrorReason.INVALID_CURSOR,
          { parameter: 'cursor' },
        );
      }
      after = { value: c.v, id: c.id };
    }
    const rows = await this.repo.listErrorGroups(
      {
        state: query.state,
        module: query.module,
        code: query.code,
        source: query.source,
        from: window.from,
        to: window.to,
      },
      sort,
      limit,
      after,
    );
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const now = new Date();
    const activity = await this.repo.groupActivity(
      page.map((r) => String(r.id)),
      window,
      now,
    );
    const last = page[page.length - 1];
    const { head } = await this.envelope(window, [
      NOT_MEASURED.errorSampling,
      ...(errorSink.actorHashAvailable ? [] : [NOT_MEASURED.affectedActors]),
    ]);
    return {
      ...head,
      sort,
      items: page.map((row) =>
        this.groupView(row, {
          last24h: activity.last24h.get(String(row.id)),
          spark: activity.spark.get(String(row.id)),
        }),
      ),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              s: sort,
              v: String(last.sort_value),
              id: String(last.id),
            })
          : null,
      note: 'occurrences24h cuenta eventos guardados en las últimas 24 h (no incluye lo que superó el tope de muestreo); occurrencesTotal sí lo incluye.',
    };
  }

  private notFoundGroup(): DomainException {
    return new DomainException(
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      'El grupo de errores no existe',
      undefined,
      ObservabilityErrorReason.ERROR_GROUP_NOT_FOUND,
    );
  }

  async errorGroup(id: string, query: WindowQuery) {
    const window = this.window(query);
    const row = await this.repo.getErrorGroup(id);
    if (!row) throw this.notFoundGroup();
    const now = new Date();
    const [activity, events, byModule, series] = await Promise.all([
      this.repo.groupActivity([id], window, now),
      this.repo.recentEvents(id, 50),
      this.repo.eventsByModule(id),
      this.repo.groupSeries(id, window),
    ]);
    const { head } = await this.envelope(window, [
      NOT_MEASURED.errorSampling,
      ...(errorSink.actorHashAvailable ? [] : [NOT_MEASURED.affectedActors]),
    ]);
    return {
      ...head,
      ...this.groupView(row, {
        last24h: activity.last24h.get(id),
        spark: activity.spark.get(id),
      }),
      sampleMessage: (row.sample_message as string | null) ?? null,
      sampleFrames: (row.sample_frames_json as string[] | null) ?? [],
      series: series.map((s) => ({
        bucket: iso(s.bucket),
        count: Number(s.events),
      })),
      byModule: byModule.map((m) => ({
        moduleCode: String(m.module_code),
        events: Number(m.events),
      })),
      recentEvents: events.map((e) => ({
        id: String(e.id),
        occurredAt: iso(e.occurred_at),
        requestId: (e.request_id as string | null) ?? null,
        traceId: (e.trace_id as string | null) ?? null,
        httpStatus: e.http_status === null ? null : Number(e.http_status),
        instanceId: String(e.instance_id),
        durationMs: e.duration_ms === null ? null : Number(e.duration_ms),
      })),
    };
  }

  async errorEvents(
    query: WindowQuery & {
      groupId?: string;
      requestId?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const window = this.window(query);
    const limit = query.limit ?? 50;
    if (query.requestId && !REQUEST_ID_PATTERN.test(query.requestId)) {
      throw this.invalidRequestId();
    }
    let after: { occurredAt: string; id: string } | null = null;
    if (query.cursor) {
      const c = decodeKeysetCursor(query.cursor);
      if (typeof c.t !== 'string' || typeof c.id !== 'string') {
        throw badRequestWithReason(
          'El cursor de paginación no es válido',
          SystemErrorReason.INVALID_CURSOR,
          { parameter: 'cursor' },
        );
      }
      after = { occurredAt: c.t, id: c.id };
    }
    const rows = await this.repo.listEvents(
      {
        groupId: query.groupId,
        requestId: query.requestId,
        from: window.from,
        to: window.to,
      },
      limit,
      after,
    );
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const { head } = await this.envelope(window, [NOT_MEASURED.errorSampling]);
    return {
      ...head,
      // Sólo ids, códigos y tiempos: los mensajes y marcos se piden por grupo.
      items: page.map((e) => ({
        id: String(e.id),
        occurredAt: iso(e.occurred_at),
        groupId: String(e.error_group_id),
        requestId: (e.request_id as string | null) ?? null,
        traceId: (e.trace_id as string | null) ?? null,
        instanceId: String(e.instance_id),
        httpStatus: e.http_status === null ? null : Number(e.http_status),
        code: String(e.error_code),
        reason: (e.error_reason as string | null) ?? null,
        exceptionType: (e.exception_type as string | null) ?? null,
        moduleCode: (e.module_code as string | null) ?? 'UNKNOWN',
        operationKey: (e.operation_key as string | null) ?? null,
        method: (e.http_method as string | null) ?? null,
        route: (e.route_template as string | null) ?? null,
        durationMs: e.duration_ms === null ? null : Number(e.duration_ms),
      })),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              t: String(last.occurred_at_text),
              id: String(last.id),
            })
          : null,
    };
  }

  private invalidRequestId(): DomainException {
    return new DomainException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_FAILED,
      'El requestId tiene un formato no válido',
      undefined,
      ObservabilityErrorReason.INVALID_REQUEST_ID,
    );
  }

  /** `GET /requests/:requestId`: lo que se guardó de una petición concreta. */
  async request(requestId: string) {
    if (!REQUEST_ID_PATTERN.test(requestId)) throw this.invalidRequestId();
    const { events, samples } = await this.repo.byRequestId(requestId);
    const found = events.length > 0 || samples.length > 0;
    const first = events[0];
    return {
      requestId,
      found,
      errors: events.map((e) => ({
        id: String(e.id),
        occurredAt: iso(e.occurred_at),
        groupId: String(e.error_group_id),
        httpStatus: e.http_status === null ? null : Number(e.http_status),
        code: String(e.error_code),
        reason: (e.error_reason as string | null) ?? null,
        exceptionType: (e.exception_type as string | null) ?? null,
        moduleCode: (e.module_code as string | null) ?? 'UNKNOWN',
        operationKey: (e.operation_key as string | null) ?? null,
        method: (e.http_method as string | null) ?? null,
        route: (e.route_template as string | null) ?? null,
        durationMs: e.duration_ms === null ? null : Number(e.duration_ms),
        sqlstate: (e.sqlstate as string | null) ?? null,
        constraint: (e.constraint_name as string | null) ?? null,
        table: (e.table_name as string | null) ?? null,
        column: (e.column_name as string | null) ?? null,
        violations: e.violations_json ?? null,
        messageRedacted: (e.message_redacted as string | null) ?? null,
        frames: (e.frames_json as string[] | null) ?? [],
        instanceId: String(e.instance_id),
      })),
      slowSample: samples[0]
        ? {
            id: String(samples[0].id),
            time: iso(samples[0].time),
            method: String(samples[0].http_method),
            route: String(samples[0].route_template),
            operationKey: (samples[0].operation_key as string | null) ?? null,
            moduleCode: (samples[0].module_code as string | null) ?? 'UNKNOWN',
            httpStatus: Number(samples[0].http_status),
            durationMs: Number(samples[0].duration_ms),
            sqlCount:
              samples[0].sql_count === null
                ? null
                : Number(samples[0].sql_count),
            sqlTotalMs:
              samples[0].sql_total_ms === null
                ? null
                : Number(samples[0].sql_total_ms),
            sqlTop: (samples[0].sql_top_json as unknown[] | null) ?? [],
            sampledBecause: String(samples[0].sampled_because),
          }
        : null,
      traceId:
        (first?.trace_id as string | null) ??
        (samples[0]?.trace_id as string | null) ??
        null,
      hint: found
        ? null
        : 'No hay registro de esa petición: sólo se guardan errores y muestras lentas (el log del servidor conserva el resto).',
    };
  }

  /** `PATCH /errors/groups/:id`. */
  async changeGroupState(
    id: string,
    input: {
      state: ErrorGroupStateCode;
      note?: string;
      expectedVersion: number;
    },
    actorId: string,
  ) {
    const current = await this.repo.getErrorGroup(id);
    if (!current) throw this.notFoundGroup();
    const conflict = (): DomainException =>
      new DomainException(
        HttpStatus.CONFLICT,
        ErrorCode.CONCURRENCY_CONFLICT,
        'El grupo cambió desde que lo leyó; recargue y reintente',
        { currentRowVersion: Number(current.row_version) },
        ObservabilityErrorReason.ERROR_GROUP_VERSION_CONFLICT,
      );
    if (Number(current.row_version) !== input.expectedVersion) throw conflict();

    if (errorGroupStateOf(String(current.state_concept_id)) === input.state) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'El grupo ya está en ese estado',
        undefined,
        ObservabilityErrorReason.ERROR_GROUP_STATE_UNCHANGED,
      );
    }
    const note = input.note?.trim() ? input.note.trim().slice(0, 1000) : null;
    if (
      (input.state === 'RESOLVED' || input.state === 'IGNORED') &&
      (note?.length ?? 0) < 3
    ) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'Resolver o ignorar un grupo exige un motivo (mínimo 3 caracteres)',
        { field: 'note' },
        ObservabilityErrorReason.ERROR_GROUP_NOTE_REQUIRED,
      );
    }
    const updated = await this.repo.changeState({
      id,
      expectedVersion: input.expectedVersion,
      stateConceptId: ERROR_GROUP_STATE[input.state],
      resolved: input.state === 'RESOLVED',
      note,
      actorId,
      now: new Date(),
    });
    // Otro cambio ganó la carrera entre la lectura y el UPDATE.
    if (!updated) throw conflict();
    return this.groupView(updated);
  }

  // ----------------------------------------------------------- SQL

  async sqlStatements(
    query: WindowQuery & {
      sort?: 'total_ms' | 'p95' | 'executions' | 'slow';
      module?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const window = this.window(query);
    const sort = query.sort ?? 'total_ms';
    const limit = query.limit ?? 50;
    const rows = await this.repo.sqlStatements(window, query.module);
    const items = rows.map((row) => ({
      queryHash: row.queryHash,
      statementClass: row.statementClass,
      primaryTable: row.primaryTable,
      executions: row.agg.executions,
      totalMs: Math.round(row.agg.sumMs * 100) / 100,
      latencyMs: sqlLatency(row.agg),
      slowCount: row.agg.slowCount,
      failedCount: row.agg.failedCount,
      modules: row.modules,
      _sort:
        sort === 'total_ms'
          ? row.agg.sumMs
          : sort === 'executions'
            ? row.agg.executions
            : sort === 'slow'
              ? row.agg.slowCount
              : (sqlLatency(row.agg).p95.value ?? -1),
    }));
    const page = this.pageSorted(items, sort, query.cursor, limit, (i) => [
      i.queryHash,
      '',
    ]);
    const { head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.sqlOnlyOrm,
    ]);
    return {
      ...head,
      sort,
      items: page.items.map(({ _sort, ...rest }) => rest),
      nextCursor: page.nextCursor,
      total: items.length,
    };
  }

  async sqlStatement(hash: string, query: WindowQuery) {
    if (!HASH_PATTERN.test(hash)) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'La huella de la consulta tiene un formato no válido',
        undefined,
        ObservabilityErrorReason.INVALID_QUERY_HASH,
      );
    }
    const window = this.window(query);
    const statement = await this.repo.sqlStatement(hash);
    if (!statement) {
      throw new DomainException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'La consulta no existe',
        undefined,
        ObservabilityErrorReason.SQL_STATEMENT_NOT_FOUND,
      );
    }
    const [series, operations, slow] = await Promise.all([
      this.repo.sqlStatementSeries(hash, window),
      this.repo.sqlStatementOperations(hash, window),
      this.repo.slowSamplesOfStatement(hash, 20),
    ]);
    const total = operations.reduce(
      (acc, op) => ({
        executions: acc.executions + op.agg.executions,
        sumMs: acc.sumMs + op.agg.sumMs,
        maxMs: Math.max(acc.maxMs, op.agg.maxMs),
        slowCount: acc.slowCount + op.agg.slowCount,
        failedCount: acc.failedCount + op.agg.failedCount,
        cumulative: acc.cumulative.map(
          (c, i) => c + (op.agg.cumulative[i] ?? 0),
        ),
      }),
      {
        executions: 0,
        sumMs: 0,
        maxMs: 0,
        slowCount: 0,
        failedCount: 0,
        cumulative: SQL_BOUNDS_MS.map(() => 0),
      },
    );
    const { head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.sqlOnlyOrm,
    ]);
    return {
      ...head,
      queryHash: String(statement.query_hash),
      statementClass: String(statement.statement_class),
      normalizedSql: (statement.normalized_sql as string | null) ?? null,
      primaryTable: (statement.primary_table as string | null) ?? null,
      firstSeenAt: iso(statement.first_seen_at),
      lastSeenAt: iso(statement.last_seen_at),
      slowEver: Boolean(statement.is_slow_ever),
      executions: total.executions,
      totalMs: Math.round(total.sumMs * 100) / 100,
      slowCount: total.slowCount,
      failedCount: total.failedCount,
      latencyMs: sqlLatency(total),
      series: series.map((s) => ({
        bucket: s.bucket.toISOString(),
        executions: s.agg.executions,
        totalMs: Math.round(s.agg.sumMs * 100) / 100,
        slowCount: s.agg.slowCount,
        p95: sqlLatency(s.agg).p95,
      })),
      operations: operations
        .map((op) => ({
          operationKey: op.operationKey,
          moduleCode: op.moduleCode,
          executions: op.agg.executions,
          totalMs: Math.round(op.agg.sumMs * 100) / 100,
          slowCount: op.agg.slowCount,
        }))
        .sort(
          (a, b) =>
            b.executions - a.executions ||
            a.operationKey.localeCompare(b.operationKey),
        ),
      slowSamples: slow.map((s) => ({
        requestId: String(s.request_id),
        occurredAt: iso(s.time),
        durationMs: Number(s.duration_ms),
        operationKey: (s.operation_key as string | null) ?? null,
        httpStatus: Number(s.http_status),
      })),
    };
  }

  async sqlSlow(query: WindowQuery & { cursor?: string; limit?: number }) {
    const window = this.window(query);
    const limit = query.limit ?? 50;
    let after: { time: string; id: string } | null = null;
    if (query.cursor) {
      const c = decodeKeysetCursor(query.cursor);
      if (typeof c.t !== 'string' || typeof c.id !== 'string') {
        throw badRequestWithReason(
          'El cursor de paginación no es válido',
          SystemErrorReason.INVALID_CURSOR,
          { parameter: 'cursor' },
        );
      }
      after = { time: c.t, id: c.id };
    }
    const rows = await this.repo.listSlowSamples(window, limit, after);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const { head } = await this.envelope(window, [
      ...this.baseNotMeasured(),
      NOT_MEASURED.sqlOnlyOrm,
    ]);
    return {
      ...head,
      items: page.map((p) => ({
        id: String(p.id),
        occurredAt: iso(p.time),
        requestId: String(p.request_id),
        traceId: (p.trace_id as string | null) ?? null,
        instanceId: String(p.instance_id),
        method: String(p.http_method),
        route: String(p.route_template),
        operationKey: (p.operation_key as string | null) ?? null,
        moduleCode: (p.module_code as string | null) ?? 'UNKNOWN',
        httpStatus: Number(p.http_status),
        durationMs: Number(p.duration_ms),
        sqlCount: p.sql_count === null ? null : Number(p.sql_count),
        sqlTotalMs: p.sql_total_ms === null ? null : Number(p.sql_total_ms),
        sqlTop: (p.sql_top_json as unknown[] | null) ?? [],
        sampledBecause: String(p.sampled_because),
      })),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              t: String(last.time_text),
              id: String(last.id),
            })
          : null,
    };
  }
}
