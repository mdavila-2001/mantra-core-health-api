import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../../common';
import {
  WindowError,
  assembleFunnel,
  resolveWindow,
  type AnalyticsWindow,
  type Interval,
} from '../../domain/analytics-window';
import {
  TelemetryAnalyticsRepository,
  type AnalyticsScope,
  type DeviceBreakdownRow,
} from '../../infrastructure/repositories/telemetry-analytics.repository';
import { TELE } from '../../telemetry.concepts';
import type { AnalyticsActorScope } from '../analytics-scope';
import { TelemetryErrorReason } from '../../telemetry.error-reasons';

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

  /** Acepta el tenant a secas (tenant) o el alcance resuelto (tenant o plataforma). */
  private scope(
    query: WindowQuery,
    actor: string | AnalyticsActorScope,
  ): AnalyticsScope {
    const tenantId = typeof actor === 'string' ? actor : actor.tenantId;
    const minSample = typeof actor === 'string' ? undefined : actor.minSample;
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
      tenantId,
      minSample,
      window,
      portalConceptId: query.portal ? PORTAL_ID[query.portal] : undefined,
    };
  }

  /** Nota de alcance de plataforma: qué se agregó y con qué umbral. */
  private scopeView(scope: AnalyticsScope) {
    return scope.tenantId
      ? { level: 'tenant' as const, tenantId: scope.tenantId, minSample: null }
      : {
          level: 'platform' as const,
          tenantId: null,
          minSample: scope.minSample ?? null,
        };
  }

  /** `true` si el grupo es demasiado pequeño para mostrarse en alcance plataforma. */
  private tooSmall(scope: AnalyticsScope, sample: number | undefined): boolean {
    return (
      scope.tenantId === undefined &&
      scope.minSample !== undefined &&
      (sample ?? 0) < scope.minSample
    );
  }

  private suppressedNote(scope: AnalyticsScope, what: string, n: number) {
    return n > 0
      ? [
          {
            metric: 'minSample',
            reason: `${n} ${what} con menos de ${scope.minSample} sujetos se suprimieron (alcance plataforma: agregado entre organizaciones).`,
          },
        ]
      : [];
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

  async overview(query: WindowQuery, tenantId: string | AnalyticsActorScope) {
    const scope = this.scope(query, tenantId);
    const { totals, topRoutes, topEvents } = await this.repo.overview(scope);
    const keepRoutes = topRoutes.filter((r) => !this.tooSmall(scope, r.sample));
    const keepEvents = topEvents.filter((r) => !this.tooSmall(scope, r.sample));
    const totalsHidden = this.tooSmall(scope, totals?.sample);
    return {
      window: this.windowView(scope, query),
      scope: this.scopeView(scope),
      totals: totalsHidden
        ? null
        : {
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
        pageViews:
          "eventos con event_name = 'pagina_vista' (o el histórico 'page_view')",
      },
      topRoutes: keepRoutes.map(({ sample: _sample, ...row }) => row),
      topEvents: keepEvents.map((row) => ({
        eventName: row.event_name,
        events: row.events,
        sessions: row.sessions,
      })),
      notMeasured: [
        ...(totalsHidden
          ? [
              {
                metric: 'totals',
                reason: `Menos de ${scope.minSample} sujetos en toda la ventana: el total se suprime (alcance plataforma).`,
              },
            ]
          : []),
        ...this.suppressedNote(
          scope,
          'ruta(s) o evento(s)',
          topRoutes.length -
            keepRoutes.length +
            (topEvents.length - keepEvents.length),
        ),
      ],
    };
  }

  async timeseries(query: WindowQuery, tenantId: string | AnalyticsActorScope) {
    const scope = this.scope(query, tenantId);
    const rows = await this.repo.timeseries(scope);
    return {
      window: this.windowView(scope, query),
      scope: this.scopeView(scope),
      points: rows.map((row) => ({
        bucket: iso(row.bucket),
        events: this.tooSmall(scope, Number(row.sample))
          ? null
          : Number(row.events),
        sessions: this.tooSmall(scope, Number(row.sample))
          ? null
          : Number(row.sessions),
      })),
      notMeasured: this.suppressedNote(
        scope,
        'cubo(s) de la serie',
        rows.filter((r) => this.tooSmall(scope, Number(r.sample))).length,
      ),
      note: 'Las sesiones por cubo no se suman: una sesión que cruza dos cubos cuenta en ambos.',
    };
  }

  async webVitals(
    query: WindowQuery & { route?: string; metric?: VitalMetric },
    tenantId: string | AnalyticsActorScope,
  ) {
    const scope = this.scope(query, tenantId);
    const { percentiles, ratings } = await this.repo.webVitals(
      scope,
      query.route,
    );
    const ratingByMetric = new Map<string, Record<string, number>>();
    const hiddenRatings = new Set<string>();
    for (const row of ratings) {
      if (this.tooSmall(scope, row.subjects)) {
        hiddenRatings.add(row.metric_concept_id);
        continue;
      }
      const bucket = ratingByMetric.get(row.metric_concept_id) ?? {};
      bucket[code(row.rating_concept_id)] = row.n;
      ratingByMetric.set(row.metric_concept_id, bucket);
    }
    const byRoute = query.metric
      ? await this.repo.webVitalsByRoute(scope, METRIC_ID[query.metric])
      : null;
    return {
      window: this.windowView(scope, query),
      scope: this.scopeView(scope),
      route: query.route ?? null,
      notMeasured: this.suppressedNote(
        scope,
        'métrica(s) de web vitals',
        percentiles.filter((r) => this.tooSmall(scope, r.subjects)).length,
      ),
      method:
        'percentile_cont sobre todas las muestras de la ventana (no promedio de percentiles)',
      metrics: percentiles.map((row) => {
        const metric = code(row.metric_concept_id) as VitalMetric;
        return {
          metric,
          unit: METRIC_UNIT[metric] ?? null,
          samples: this.tooSmall(scope, row.subjects) ? null : row.samples,
          p50: this.tooSmall(scope, row.subjects) ? null : num(row.p50),
          p75: this.tooSmall(scope, row.subjects) ? null : num(row.p75),
          p95: this.tooSmall(scope, row.subjects) ? null : num(row.p95),
          ratings:
            hiddenRatings.has(row.metric_concept_id) ||
            this.tooSmall(scope, row.subjects)
              ? null
              : (ratingByMetric.get(row.metric_concept_id) ?? {}),
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
              samples: this.tooSmall(scope, row.subjects) ? null : row.samples,
              p75: this.tooSmall(scope, row.subjects) ? null : num(row.p75),
            })),
          }
        : null,
    };
  }

  async listSessions(
    query: WindowQuery & { cursor?: string; limit?: number },
    tenantId: string,
  ) {
    const scope = this.scope(query, tenantId);
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
  async getSession(id: string, tenantId: string) {
    const session = await this.repo.findSession(id, tenantId);
    // Una sesión de otro tenant (o que mezcla tenants) responde igual que una
    // inexistente: mismo mensaje, mismo `reason`, sin `details`.
    if (!session) {
      throw new ResourceNotFoundException(
        'Sesión no encontrada',
        undefined,
        TelemetryErrorReason.SESSION_OUT_OF_SCOPE,
      );
    }
    const events = await this.repo.sessionTimeline(
      session.session_id,
      tenantId,
    );
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

  async funnelReport(funnelId: string, query: WindowQuery, tenantId: string) {
    const scope = this.scope(query, tenantId);
    const funnel = (await this.listFunnels()).find((f) => f.id === funnelId);
    if (!funnel)
      throw new ResourceNotFoundException('Embudo no encontrado', { funnelId });
    const reach = await this.repo.funnelReach(
      scope.window,
      tenantId,
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
        tenantId,
        funnel.id,
      ),
    };
  }

  /**
   * Sólo por organización: sus conteos (eventos, contextos, bots) no pasan por
   * `minSample`, así que no hay alcance plataforma (un actor de plataforma indica
   * `X-Tenant-Id`).
   */
  async pipelineHealth(query: WindowQuery, tenantId: string) {
    const scope = this.scope(query, tenantId);
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

  /**
   * Desglose de dispositivos (tipo, SO, navegador, versión de app) a partir de
   * los contextos de cliente. Los bots se cuentan aparte; una etiqueta sólo se
   * muestra si hay concepto que la respalde, si no, `label = code`.
   */
  async devices(query: WindowQuery, tenantId: string | AnalyticsActorScope) {
    const scope = this.scope(query, tenantId);
    const result = await this.repo.devices(scope);
    const botUnknown = result.totals?.bot_unknown ?? 0;
    let hidden = 0;
    const view = (rows: readonly DeviceBreakdownRow[]) =>
      [...rows]
        .filter((row) => {
          const small = this.tooSmall(scope, row.sample);
          if (small) hidden += 1;
          return !small;
        })
        .map((row) => ({
          code: row.code,
          label: row.label || row.code,
          contexts: Number(row.contexts),
        }))
        // Mismo orden que la consulta (contexts desc, code asc), por código
        // de unidad: el orden no depende de la colación de la base.
        .sort(
          (a, b) =>
            b.contexts - a.contexts ||
            (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
        );
    const byDeviceType = view(result.byDeviceType);
    const byOsFamily = view(result.byOsFamily);
    const byBrowserFamily = view(result.byBrowserFamily);
    const byAppVersion = view(result.byAppVersion);
    return {
      window: this.windowView(scope, query),
      scope: this.scopeView(scope),
      totals: {
        contexts: result.totals?.contexts ?? 0,
        bots: result.totals?.bots ?? 0,
      },
      byDeviceType,
      byOsFamily,
      byBrowserFamily,
      byAppVersion,
      lastContextAt: iso(result.totals?.last_context_at),
      notMeasured: [
        ...this.suppressedNote(scope, 'grupo(s) de dispositivo', hidden),
        {
          metric: 'trackingConsent',
          reason:
            'La captura del contexto de cliente no pasa por el gate de consentimiento de tracking (sí lo hacen los eventos): no se puede separar dispositivos con y sin consentimiento.',
        },
        {
          metric: 'uniqueDevices',
          reason:
            'Cada fila es una captura de contexto, no un dispositivo: un mismo dispositivo con varias sesiones cuenta varias veces y no hay identificador de dispositivo.',
        },
        {
          metric: 'contextsWithoutSession',
          reason:
            'Un contexto sin sesión no es atribuible a un tenant y queda fuera de todos los conteos.',
        },
        ...(botUnknown > 0
          ? [
              {
                metric: 'botClassification',
                reason: `${botUnknown} contexto(s) sin is_bot informado: no se pudo demostrar que sean bots y entran en los desgloses.`,
              },
            ]
          : []),
      ],
    };
  }
}
