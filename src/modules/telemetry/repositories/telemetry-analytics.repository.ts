import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AnalyticsWindow } from '../domain/analytics-window';

/** Filtros comunes a toda consulta: ventana obligatoria, portal opcional. */
export interface AnalyticsScope {
  window: AnalyticsWindow;
  portalConceptId?: string;
}

/** Máximo de filas por ranking: un top, no un volcado. */
const TOP_LIMIT = 20;
/** Máximo de eventos en el timeline de una sesión. */
const TIMELINE_LIMIT = 500;

/**
 * Lecturas agregadas sobre las tablas que escribe la ingesta de telemetría.
 * Toda consulta lleva ventana (y por tanto usa el índice temporal) y devuelve
 * agregados; lo crudo se limita al timeline de una sesión y no incluye
 * valores de propiedades, sólo sus nombres.
 */
@Injectable()
export class TelemetryAnalyticsRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  /** Predicado de ventana + portal sobre una columna temporal. */
  private scope(column: string, scope: AnalyticsScope, alias = '') {
    const prefix = alias ? `${alias}.` : '';
    const clauses = [`${prefix}${column} >= ?`, `${prefix}${column} < ?`];
    const params: unknown[] = [scope.window.from, scope.window.to];
    if (scope.portalConceptId) {
      clauses.push(`${prefix}portal_type_concept_id = ?`);
      params.push(scope.portalConceptId);
    }
    return { where: clauses.join(' AND '), params };
  }

  async overview(scope: AnalyticsScope) {
    const { where, params } = this.scope('occurred_at', scope);
    const [totals] = await this.sql<{
      events: number;
      sessions: number;
      subjects: number;
      page_views: number;
      last_event_at: Date | null;
    }>(
      `SELECT count(*)::int AS events,
              count(DISTINCT session_id)::int AS sessions,
              count(DISTINCT analytics_subject_id)::int AS subjects,
              count(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
              max(occurred_at) AS last_event_at
         FROM telemetry.user_activity_events
        WHERE ${where}`,
      params,
    );
    const topRoutes = await this.sql<{
      route: string;
      events: number;
      sessions: number;
    }>(
      `SELECT coalesce(route_template, '(sin ruta)') AS route,
              count(*)::int AS events, count(DISTINCT session_id)::int AS sessions
         FROM telemetry.user_activity_events
        WHERE ${where}
        GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT ${TOP_LIMIT}`,
      params,
    );
    const topEvents = await this.sql<{
      event_name: string;
      events: number;
      sessions: number;
    }>(
      `SELECT event_name, count(*)::int AS events, count(DISTINCT session_id)::int AS sessions
         FROM telemetry.user_activity_events
        WHERE ${where}
        GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT ${TOP_LIMIT}`,
      params,
    );
    return { totals, topRoutes, topEvents };
  }

  /** Serie temporal con cubos vacíos rellenados en 0: un hueco es un dato. */
  timeseries(scope: AnalyticsScope) {
    const { where, params } = this.scope('occurred_at', scope);
    const unit = scope.window.interval;
    return this.sql<{ bucket: Date; events: number; sessions: number }>(
      `WITH buckets AS (
         SELECT generate_series(date_trunc('${unit}', ?::timestamptz, 'UTC'),
                                ?::timestamptz - interval '1 microsecond',
                                interval '1 ${unit}') AS bucket
       ), counts AS (
         SELECT date_trunc('${unit}', occurred_at, 'UTC') AS bucket,
                count(*)::int AS events, count(DISTINCT session_id)::int AS sessions
           FROM telemetry.user_activity_events
          WHERE ${where}
          GROUP BY 1
       )
       SELECT b.bucket, coalesce(c.events, 0) AS events, coalesce(c.sessions, 0) AS sessions
         FROM buckets b LEFT JOIN counts c ON c.bucket = b.bucket
        ORDER BY b.bucket`,
      [scope.window.from, scope.window.to, ...params],
    );
  }

  /**
   * Percentiles por métrica calculados sobre la distribución de muestras, no
   * promediando percentiles de grupos.
   */
  async webVitals(scope: AnalyticsScope, route?: string) {
    const { where, params } = this.scope('measured_at', scope);
    const filter = `${where} AND metric_value IS NOT NULL${route ? ' AND route_template = ?' : ''}`;
    const args = route ? [...params, route] : params;
    const percentiles = await this.sql<{
      metric_concept_id: string;
      samples: number;
      p50: string | null;
      p75: string | null;
      p95: string | null;
    }>(
      `SELECT metric_concept_id, count(*)::int AS samples,
              percentile_cont(0.50) WITHIN GROUP (ORDER BY metric_value)::text AS p50,
              percentile_cont(0.75) WITHIN GROUP (ORDER BY metric_value)::text AS p75,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value)::text AS p95
         FROM telemetry.web_vitals
        WHERE ${filter}
        GROUP BY metric_concept_id
        ORDER BY metric_concept_id`,
      args,
    );
    const ratings = await this.sql<{
      metric_concept_id: string;
      rating_concept_id: string | null;
      n: number;
    }>(
      `SELECT metric_concept_id, rating_concept_id, count(*)::int AS n
         FROM telemetry.web_vitals
        WHERE ${filter}
        GROUP BY 1, 2`,
      args,
    );
    return { percentiles, ratings };
  }

  /** p75 de una métrica por ruta, para encontrar las páginas lentas. */
  webVitalsByRoute(scope: AnalyticsScope, metricConceptId: string) {
    const { where, params } = this.scope('measured_at', scope);
    return this.sql<{ route: string; samples: number; p75: string | null }>(
      `SELECT coalesce(route_template, '(sin ruta)') AS route, count(*)::int AS samples,
              percentile_cont(0.75) WITHIN GROUP (ORDER BY metric_value)::text AS p75
         FROM telemetry.web_vitals
        WHERE ${where} AND metric_concept_id = ? AND metric_value IS NOT NULL
        GROUP BY 1 ORDER BY samples DESC, route LIMIT ${TOP_LIMIT}`,
      [...params, metricConceptId],
    );
  }

  listSessions(
    scope: AnalyticsScope,
    after: { startedAt: string; id: string } | undefined,
    limit: number,
  ) {
    const { where, params } = this.scope('started_at', scope);
    const cursor = after
      ? ' AND (started_at, id) < (?::timestamptz, ?::uuid)'
      : '';
    return this.sql<{
      id: string;
      portal_type_concept_id: string;
      journey_status_concept_id: string;
      started_at: Date;
      ended_at: Date | null;
      event_count: number | null;
      has_subject: boolean;
    }>(
      `SELECT id, portal_type_concept_id, journey_status_concept_id, started_at, ended_at,
              event_count, analytics_subject_id IS NOT NULL AS has_subject
         FROM telemetry.session_journeys
        WHERE ${where}${cursor}
        ORDER BY started_at DESC, id DESC
        LIMIT ?`,
      [...params, ...(after ? [after.startedAt, after.id] : []), limit + 1],
    );
  }

  async findSession(id: string) {
    const [row] = await this.sql<{
      id: string;
      session_id: string;
      portal_type_concept_id: string;
      journey_status_concept_id: string;
      started_at: Date | null;
      ended_at: Date | null;
      event_count: number | null;
      has_subject: boolean;
    }>(
      `SELECT id, session_id, portal_type_concept_id, journey_status_concept_id,
              started_at, ended_at, event_count, analytics_subject_id IS NOT NULL AS has_subject
         FROM telemetry.session_journeys WHERE id = ?`,
      [id],
    );
    return row ?? null;
  }

  /** Timeline de una sesión: qué pasó y cuándo, con nombres de propiedad pero sin valores. */
  sessionTimeline(sessionId: string) {
    return this.sql<{
      id: string;
      event_name: string;
      route_template: string | null;
      occurred_at: Date | null;
      received_at: Date | null;
      property_names: string[] | null;
    }>(
      `SELECT e.id, e.event_name, e.route_template, e.occurred_at, e.received_at,
              (SELECT json_agg(DISTINCT p.property_name)
                 FROM telemetry.user_activity_event_properties p
                WHERE p.user_activity_event_id = e.id) AS property_names
         FROM telemetry.user_activity_events e
        WHERE e.session_id = ?
        ORDER BY e.occurred_at, e.id
        LIMIT ${TIMELINE_LIMIT}`,
      [sessionId],
    );
  }

  listFunnels() {
    return this.sql<{
      id: string;
      funnel_code: string;
      name: string;
      version_number: number;
      portal_type_concept_id: string;
      steps: Array<{
        stepNumber: number;
        eventSchemaDefinitionId: string;
        eventName: string;
      }> | null;
    }>(
      `SELECT f.id, f.funnel_code, f.name, f.version_number, f.portal_type_concept_id,
              (SELECT json_agg(json_build_object(
                         'stepNumber', s.step_number,
                         'eventSchemaDefinitionId', s.event_schema_definition_id,
                         'eventName', d.event_name) ORDER BY s.step_number)
                 FROM telemetry.funnel_steps s
                 JOIN telemetry.activity_event_schema_definitions d
                   ON d.id = s.event_schema_definition_id
                WHERE s.funnel_definition_id = f.id) AS steps
         FROM telemetry.funnel_definitions f
        ORDER BY f.funnel_code, f.version_number DESC`,
    );
  }

  /**
   * Sesiones que recorrieron los pasos en orden dentro de la ventana. Cada
   * paso toma, por sesión, la primera ocurrencia posterior (o simultánea) al
   * paso anterior: el recorrido codicioso más temprano, que existe si y sólo
   * si existe algún recorrido en orden.
   */
  async funnelReach(
    window: AnalyticsWindow,
    stepSchemaIds: readonly string[],
  ): Promise<number[]> {
    if (stepSchemaIds.length === 0) return [];
    const ctes: string[] = [];
    const params: unknown[] = [];
    stepSchemaIds.forEach((schemaId, index) => {
      if (index === 0) {
        ctes.push(`s0 AS (
          SELECT session_id, min(occurred_at) AS t
            FROM telemetry.user_activity_events
           WHERE event_schema_definition_id = ? AND session_id IS NOT NULL
             AND occurred_at >= ? AND occurred_at < ?
           GROUP BY session_id)`);
        params.push(schemaId, window.from, window.to);
      } else {
        ctes.push(`s${index} AS (
          SELECT e.session_id, min(e.occurred_at) AS t
            FROM telemetry.user_activity_events e
            JOIN s${index - 1} p ON p.session_id = e.session_id AND e.occurred_at >= p.t
           WHERE e.event_schema_definition_id = ? AND e.occurred_at < ?
           GROUP BY e.session_id)`);
        params.push(schemaId, window.to);
      }
    });
    const selects = stepSchemaIds
      .map((_, index) => `(SELECT count(*)::int FROM s${index}) AS r${index}`)
      .join(', ');
    const [row] = await this.sql<Record<string, number>>(
      `WITH ${ctes.join(',\n')} SELECT ${selects}`,
      params,
    );
    return stepSchemaIds.map((_, index) => Number(row?.[`r${index}`] ?? 0));
  }

  /** Conversiones registradas por el servidor (confirmadas), no reclamadas por el navegador. */
  async serverConversions(window: AnalyticsWindow, funnelId: string) {
    const [row] = await this.sql<{ n: number }>(
      `SELECT count(*)::int AS n FROM telemetry.conversion_events
        WHERE funnel_definition_id = ? AND converted_at >= ? AND converted_at < ?`,
      [funnelId, window.from, window.to],
    );
    return row?.n ?? 0;
  }

  /** Salud de la ingesta medida sobre lo que sí se persistió. */
  async pipelineHealth(scope: AnalyticsScope) {
    const { where, params } = this.scope('received_at', scope);
    const [ingest] = await this.sql<{
      accepted: number;
      last_received_at: Date | null;
      lag_p50_s: string | null;
      lag_p95_s: string | null;
      future_skew: number;
      late_over_24h: number;
      without_session: number;
    }>(
      `SELECT count(*)::int AS accepted,
              max(received_at) AS last_received_at,
              percentile_cont(0.50) WITHIN GROUP (
                ORDER BY extract(epoch FROM received_at - occurred_at))::text AS lag_p50_s,
              percentile_cont(0.95) WITHIN GROUP (
                ORDER BY extract(epoch FROM received_at - occurred_at))::text AS lag_p95_s,
              count(*) FILTER (WHERE occurred_at > received_at + interval '5 minutes')::int AS future_skew,
              count(*) FILTER (WHERE received_at - occurred_at > interval '24 hours')::int AS late_over_24h,
              count(*) FILTER (WHERE session_id IS NULL)::int AS without_session
         FROM telemetry.user_activity_events
        WHERE ${where}`,
      params,
    );
    const ctx = this.scope('created_at', scope);
    const [clients] = await this.sql<{
      contexts: number;
      bots: number;
      bot_unknown: number;
    }>(
      `SELECT count(*)::int AS contexts,
              count(*) FILTER (WHERE is_bot)::int AS bots,
              count(*) FILTER (WHERE is_bot IS NULL)::int AS bot_unknown
         FROM telemetry.client_contexts
        WHERE ${ctx.where}`,
      ctx.params,
    );
    return { ingest, clients };
  }
}
