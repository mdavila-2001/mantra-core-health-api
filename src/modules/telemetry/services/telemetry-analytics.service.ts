import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import {
  WindowError,
  assembleFunnel,
  resolveWindow,
  type AnalyticsWindow,
  type Interval,
} from '../domain/analytics-window';
import {
  TelemetryAnalyticsRepository,
  type AnalyticsScope,
} from '../repositories/telemetry-analytics.repository';
import { TELE } from '../telemetry.concepts';

export const PORTAL_CODES = ['WEB', 'MOBILE'] as const;
export type PortalCode = (typeof PORTAL_CODES)[number];
export const VITAL_METRICS = [
  'LCP',
  'INP',
  'CLS',
  'FCP',
  'TTFB',
  'FID',
] as const;
export type VitalMetric = (typeof VITAL_METRICS)[number];

const PORTAL_ID: Record<PortalCode, string> = {
  WEB: TELE.PORTAL_WEB,
  MOBILE: TELE.PORTAL_MOBILE,
};
const METRIC_ID: Record<VitalMetric, string> = {
  LCP: TELE.METRIC_LCP,
  INP: TELE.METRIC_INP,
  CLS: TELE.METRIC_CLS,
  FCP: TELE.METRIC_FCP,
  TTFB: TELE.METRIC_TTFB,
  FID: TELE.METRIC_FID,
};
/** Unidad de cada métrica: CLS no tiene unidad, el resto son milisegundos. */
const METRIC_UNIT: Record<VitalMetric, 'ms' | 'score'> = {
  LCP: 'ms',
  INP: 'ms',
  CLS: 'score',
  FCP: 'ms',
  TTFB: 'ms',
  FID: 'ms',
};
const CODE_BY_ID = new Map<string, string>([
  ...Object.entries(PORTAL_ID).map(
    ([code, id]) => [id, code] as [string, string],
  ),
  ...Object.entries(METRIC_ID).map(
    ([code, id]) => [id, code] as [string, string],
  ),
  [TELE.RATING_GOOD, 'GOOD'],
  [TELE.RATING_NEEDS_IMPROVEMENT, 'NEEDS_IMPROVEMENT'],
  [TELE.RATING_POOR, 'POOR'],
  [TELE.JOURNEY_OPEN, 'OPEN'],
  [TELE.JOURNEY_CONVERTED, 'CONVERTED'],
  [TELE.JOURNEY_CLOSED, 'CLOSED'],
]);
const code = (id: string | null | undefined) =>
  id ? (CODE_BY_ID.get(id) ?? 'UNKNOWN') : 'UNRATED';

export interface WindowQuery {
  from?: string;
  to?: string;
  interval?: Interval;
  portal?: PortalCode;
}

const iso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null;
/** 4 decimales: suficiente para CLS y evita el ruido de coma flotante (954.9999…). */
const num = (value: string | null) =>
  value === null ? null : Math.round(Number(value) * 10_000) / 10_000;

/**
 * Consultas de analítica de producto y RUM para el portal. Todo agregado sale
 * de aquí, calculado en la base con su denominador y su ventana: el portal no
 * suma ni promedia nada por su cuenta.
 *
 * Lo que la ingesta no persiste (duplicados y eventos descartados por
 * consentimiento: la API sólo los cuenta en la respuesta) se declara como no
 * medido. Presentarlo como 0 sería afirmar que no los hubo.
 */
@Injectable()
export class TelemetryAnalyticsService {
  constructor(private readonly repo: TelemetryAnalyticsRepository) {}

  private scope(query: WindowQuery): AnalyticsScope {
    let window: AnalyticsWindow;
    try {
      window = resolveWindow(query);
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
    return {
      window,
      portalConceptId: query.portal ? PORTAL_ID[query.portal] : undefined,
    };
  }

  private windowView(scope: AnalyticsScope, query: WindowQuery) {
    return {
      from: scope.window.from.toISOString(),
      to: scope.window.to.toISOString(),
      interval: scope.window.interval,
      timezone: scope.window.timezone,
      portal: query.portal ?? null,
    };
  }

  async overview(query: WindowQuery) {
    const scope = this.scope(query);
    const { totals, topRoutes, topEvents } = await this.repo.overview(scope);
    return {
      window: this.windowView(scope, query),
      totals: {
        events: totals?.events ?? 0,
        sessions: totals?.sessions ?? 0,
        pseudonymousSubjects: totals?.subjects ?? 0,
        pageViews: totals?.page_views ?? 0,
        lastEventAt: iso(totals?.last_event_at),
      },
      definitions: {
        sessions: 'session_id distintos con al menos un evento en la ventana',
        pseudonymousSubjects:
          'analytics_subject_id distintos: sujetos seudónimos con consentimiento, no usuarios únicos',
        pageViews: 'eventos con event_name = page_view',
      },
      topRoutes,
      topEvents: topEvents.map((row) => ({
        eventName: row.event_name,
        events: row.events,
        sessions: row.sessions,
      })),
    };
  }

  async timeseries(query: WindowQuery) {
    const scope = this.scope(query);
    const rows = await this.repo.timeseries(scope);
    return {
      window: this.windowView(scope, query),
      points: rows.map((row) => ({
        bucket: iso(row.bucket),
        events: Number(row.events),
        sessions: Number(row.sessions),
      })),
      note: 'Las sesiones por cubo no se suman: una sesión que cruza dos cubos cuenta en ambos.',
    };
  }

  async webVitals(
    query: WindowQuery & { route?: string; metric?: VitalMetric },
  ) {
    const scope = this.scope(query);
    const { percentiles, ratings } = await this.repo.webVitals(
      scope,
      query.route,
    );
    const ratingByMetric = new Map<string, Record<string, number>>();
    for (const row of ratings) {
      const bucket = ratingByMetric.get(row.metric_concept_id) ?? {};
      bucket[code(row.rating_concept_id)] = row.n;
      ratingByMetric.set(row.metric_concept_id, bucket);
    }
    const byRoute = query.metric
      ? await this.repo.webVitalsByRoute(scope, METRIC_ID[query.metric])
      : null;
    return {
      window: this.windowView(scope, query),
      route: query.route ?? null,
      method:
        'percentile_cont sobre todas las muestras de la ventana (no promedio de percentiles)',
      metrics: percentiles.map((row) => {
        const metric = code(row.metric_concept_id) as VitalMetric;
        return {
          metric,
          unit: METRIC_UNIT[metric] ?? null,
          samples: row.samples,
          p50: num(row.p50),
          p75: num(row.p75),
          p95: num(row.p95),
          ratings: ratingByMetric.get(row.metric_concept_id) ?? {},
          deprecated:
            metric === 'FID' ? 'Sustituida por INP en Core Web Vitals' : null,
        };
      }),
      byRoute: byRoute
        ? {
            metric: query.metric,
            unit: METRIC_UNIT[query.metric!],
            routes: byRoute.map((row) => ({
              route: row.route,
              samples: row.samples,
              p75: num(row.p75),
            })),
          }
        : null,
    };
  }

  async listSessions(query: WindowQuery & { cursor?: string; limit?: number }) {
    const scope = this.scope(query);
    const limit = query.limit ?? 50;
    let after: { startedAt: string; id: string } | undefined;
    if (query.cursor) {
      const key = decodeKeysetCursor(query.cursor);
      after = { startedAt: String(key.t), id: String(key.i) };
    }
    const rows = await this.repo.listSessions(scope, after, limit);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      window: this.windowView(scope, query),
      items: page.map((row) => this.sessionView(row)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({
              t: new Date(last.started_at).toISOString(),
              i: last.id,
            })
          : null,
      limit,
    };
  }

  private sessionView(row: {
    id: string;
    portal_type_concept_id: string;
    journey_status_concept_id: string;
    started_at: Date | null;
    ended_at: Date | null;
    event_count: number | null;
    has_subject: boolean;
  }) {
    const started = row.started_at ? new Date(row.started_at) : null;
    const ended = row.ended_at ? new Date(row.ended_at) : null;
    return {
      id: row.id,
      portal: code(row.portal_type_concept_id),
      status: code(row.journey_status_concept_id),
      startedAt: iso(started),
      endedAt: iso(ended),
      durationSeconds:
        started && ended
          ? Math.round((ended.getTime() - started.getTime()) / 1000)
          : null,
      eventCount: row.event_count ?? 0,
      hasPseudonymousSubject: row.has_subject,
    };
  }

  /** Timeline de una sesión: nombres de propiedad, nunca sus valores. */
  async getSession(id: string) {
    const session = await this.repo.findSession(id);
    if (!session)
      throw new ResourceNotFoundException('Sesión no encontrada', { id });
    const events = await this.repo.sessionTimeline(session.session_id);
    return {
      ...this.sessionView(session),
      events: events.map((event) => ({
        id: event.id,
        eventName: event.event_name,
        routeTemplate: event.route_template,
        occurredAt: iso(event.occurred_at),
        receivedAt: iso(event.received_at),
        propertyNames: event.property_names ?? [],
      })),
      truncated: events.length >= 500,
    };
  }

  async listFunnels() {
    const rows = await this.repo.listFunnels();
    return rows.map((row) => ({
      id: row.id,
      code: row.funnel_code,
      name: row.name,
      version: row.version_number,
      portal: code(row.portal_type_concept_id),
      steps: row.steps ?? [],
    }));
  }

  async funnelReport(funnelId: string, query: WindowQuery) {
    const scope = this.scope(query);
    const funnel = (await this.listFunnels()).find((f) => f.id === funnelId);
    if (!funnel)
      throw new ResourceNotFoundException('Embudo no encontrado', { funnelId });
    const reach = await this.repo.funnelReach(
      scope.window,
      funnel.steps.map((step) => step.eventSchemaDefinitionId),
    );
    const report = assembleFunnel(
      funnel.steps.map((step, index) => ({
        stepNumber: step.stepNumber,
        eventName: step.eventName,
        reached: reach[index] ?? 0,
      })),
    );
    return {
      funnel: {
        id: funnel.id,
        code: funnel.code,
        name: funnel.name,
        version: funnel.version,
      },
      window: this.windowView(scope, query),
      ...report,
      rules: {
        order:
          'estricto: cada paso en o después del anterior, dentro de la ventana',
        conversionWindow: 'la ventana de la consulta',
        repeats: 'cuenta una vez por sesión',
        lateEvents:
          'se cuentan por occurred_at; un evento que llega tarde entra si su occurred_at cae en la ventana',
      },
      serverConfirmedConversions: await this.repo.serverConversions(
        scope.window,
        funnel.id,
      ),
    };
  }

  async pipelineHealth(query: WindowQuery) {
    const scope = this.scope(query);
    const { ingest, clients } = await this.repo.pipelineHealth(scope);
    const lastReceived = ingest?.last_received_at
      ? new Date(ingest.last_received_at)
      : null;
    return {
      window: this.windowView(scope, query),
      measured: {
        accepted: ingest?.accepted ?? 0,
        lastReceivedAt: iso(lastReceived),
        freshnessSeconds: lastReceived
          ? Math.round((Date.now() - lastReceived.getTime()) / 1000)
          : null,
        ingestLagSeconds: {
          p50: num(ingest?.lag_p50_s ?? null),
          p95: num(ingest?.lag_p95_s ?? null),
        },
        clockSkewFuture: ingest?.future_skew ?? 0,
        lateOver24h: ingest?.late_over_24h ?? 0,
        withoutSession: ingest?.without_session ?? 0,
        clientContexts: clients?.contexts ?? 0,
        bots: clients?.bots ?? 0,
        botUnknown: clients?.bot_unknown ?? 0,
      },
      notMeasured: [
        {
          metric: 'duplicates',
          reason:
            'La ingesta descarta duplicados por clave de idempotencia sin persistirlos; sólo los cuenta en la respuesta.',
        },
        {
          metric: 'consentDropped',
          reason:
            'Los eventos sin consentimiento vigente se descartan antes de persistir; no queda registro agregable.',
        },
        {
          metric: 'rejected',
          reason:
            'Un lote inválido se rechaza entero con 4xx; no hay contador de rechazos.',
        },
      ],
    };
  }
}
