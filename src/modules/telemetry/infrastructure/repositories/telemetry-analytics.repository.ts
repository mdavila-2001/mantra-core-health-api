import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AnalyticsWindow } from '../../domain/analytics-window';

/**
 * Filtros comunes a toda consulta: tenant y ventana obligatorios, portal opcional.
 *
 * El tenant es el que resolvió el guard para la petición; no existe lectura
 * global. `user_activity_events` lo lleva en su columna; las sesiones, los
 * contextos de cliente, los vitales y las conversiones no, así que se derivan de
 * los eventos (ver `sessionInTenant` y `rowInTenant`).
 */
export interface AnalyticsScope {
  tenantId: string;
  window: AnalyticsWindow;
  portalConceptId?: string;
}

/** Máximo de filas por ranking: un top, no un volcado. */
const TOP_LIMIT = 20;
/** Máximo de filas por desglose de dispositivos (versiones de app incluidas). */
const DEVICE_BREAKDOWN_LIMIT = 50;
/** Código del cubo de contextos sin dato en esa dimensión. */
export const DEVICE_UNSPECIFIED = 'UNSPECIFIED';
/**
 * Dimensiones de concepto de `client_contexts` que se desglosan. Son literales
 * internos (nunca entrada del usuario): lo único que se interpola en el SQL.
 */
const DEVICE_CONCEPT_COLUMNS = {
  deviceType: 'device_type_concept_id',
  osFamily: 'os_family_concept_id',
  browserFamily: 'browser_family_concept_id',
} as const;
type DeviceConceptDimension = keyof typeof DEVICE_CONCEPT_COLUMNS;

/** Fila de un desglose de dispositivos: código, etiqueta resuelta y conteo. */
export interface DeviceBreakdownRow {
  code: string;
  label: string;
  contexts: number;
}

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

  /** Ventana + portal + tenant sobre `user_activity_events`, que lleva `tenant_id`. */
  private eventScope(column: string, scope: AnalyticsScope, alias = '') {
    const base = this.scope(column, scope, alias);
    const prefix = alias ? `${alias}.` : '';
    return {
      where: `${base.where} AND ${prefix}tenant_id = ?`,
      params: [...base.params, scope.tenantId],
    };
  }

  /**
   * Predicado «esta sesión es del tenant»: la sesión tiene al menos un evento
   * del tenant y ninguno de otro (ni sin tenant). Una sesión que mezcla tenants
   * no se lista ni se lee: no hay forma de atribuirla a uno solo.
   *
   * @param column - Columna **calificada** con el `session_id` de la fila externa.
   */
  private sessionInTenant(column: string, tenantId: string) {
    return {
      sql: `(EXISTS (SELECT 1 FROM telemetry.user_activity_events te
                      WHERE te.session_id = ${column} AND te.tenant_id = ?)
             AND NOT EXISTS (SELECT 1 FROM telemetry.user_activity_events xe
                              WHERE xe.session_id = ${column}
                                AND xe.tenant_id IS DISTINCT FROM ?))`,
      params: [tenantId, tenantId],
    };
  }

  /**
   * Predicado de tenant para filas sin `tenant_id` propio (vitales,
   * conversiones): se atribuyen por el evento al que apuntan y, si no apuntan a
   * ninguno, por el journey. Sin ninguno de los dos no hay tenant demostrable y
   * la fila queda fuera.
   *
   * @param eventColumn - Columna calificada con el id de evento de la fila.
   * @param journeyColumn - Columna calificada con el id de journey de la fila.
   */
  private rowInTenant(
    eventColumn: string,
    journeyColumn: string,
    tenantId: string,
  ) {
    const session = this.sessionInTenant('vj.session_id', tenantId);
    return {
      sql: `(CASE WHEN ${eventColumn} IS NOT NULL
                  THEN ${eventColumn} IN (SELECT ve.id FROM telemetry.user_activity_events ve
                                           WHERE ve.tenant_id = ?)
                  ELSE ${journeyColumn} IN (SELECT vj.id FROM telemetry.session_journeys vj
                                             WHERE ${session.sql})
             END)`,
      params: [tenantId, ...session.params],
    };
  }

  async overview(scope: AnalyticsScope) {
    const { where, params } = this.eventScope('occurred_at', scope);
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
    const { where, params } = this.eventScope('occurred_at', scope);
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
    const base = this.scope('measured_at', scope, 'w');
    const tenant = this.rowInTenant(
      'w.user_activity_event_id',
      'w.session_journey_id',
      scope.tenantId,
    );
    const filter = `${base.where} AND ${tenant.sql} AND w.metric_value IS NOT NULL${route ? ' AND w.route_template = ?' : ''}`;
    const params = [...base.params, ...tenant.params];
    const args = route ? [...params, route] : params;
    const percentiles = await this.sql<{
      metric_concept_id: string;
      samples: number;
      p50: string | null;
      p75: string | null;
      p95: string | null;
    }>(
      `SELECT w.metric_concept_id, count(*)::int AS samples,
              percentile_cont(0.50) WITHIN GROUP (ORDER BY w.metric_value)::text AS p50,
              percentile_cont(0.75) WITHIN GROUP (ORDER BY w.metric_value)::text AS p75,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY w.metric_value)::text AS p95
         FROM telemetry.web_vitals w
        WHERE ${filter}
        GROUP BY w.metric_concept_id
        ORDER BY w.metric_concept_id`,
      args,
    );
    const ratings = await this.sql<{
      metric_concept_id: string;
      rating_concept_id: string | null;
      n: number;
    }>(
      `SELECT w.metric_concept_id, w.rating_concept_id, count(*)::int AS n
         FROM telemetry.web_vitals w
        WHERE ${filter}
        GROUP BY 1, 2`,
      args,
    );
    return { percentiles, ratings };
  }

  /** p75 de una métrica por ruta, para encontrar las páginas lentas. */
  webVitalsByRoute(scope: AnalyticsScope, metricConceptId: string) {
    const base = this.scope('measured_at', scope, 'w');
    const tenant = this.rowInTenant(
      'w.user_activity_event_id',
      'w.session_journey_id',
      scope.tenantId,
    );
    return this.sql<{ route: string; samples: number; p75: string | null }>(
      `SELECT coalesce(w.route_template, '(sin ruta)') AS route, count(*)::int AS samples,
              percentile_cont(0.75) WITHIN GROUP (ORDER BY w.metric_value)::text AS p75
         FROM telemetry.web_vitals w
        WHERE ${base.where} AND ${tenant.sql}
          AND w.metric_concept_id = ? AND w.metric_value IS NOT NULL
        GROUP BY 1 ORDER BY samples DESC, route LIMIT ${TOP_LIMIT}`,
      [...base.params, ...tenant.params, metricConceptId],
    );
  }

  listSessions(
    scope: AnalyticsScope,
    after: { startedAt: string; id: string } | undefined,
    limit: number,
  ) {
    const base = this.scope('started_at', scope, 'sj');
    const tenant = this.sessionInTenant('sj.session_id', scope.tenantId);
    const where = `${base.where} AND ${tenant.sql}`;
    const params = [...base.params, ...tenant.params];
    const cursor = after
      ? ' AND (sj.started_at, sj.id) < (?::timestamptz, ?::uuid)'
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
      `SELECT sj.id, sj.portal_type_concept_id, sj.journey_status_concept_id, sj.started_at,
              sj.ended_at, sj.event_count, sj.analytics_subject_id IS NOT NULL AS has_subject
         FROM telemetry.session_journeys sj
        WHERE ${where}${cursor}
        ORDER BY sj.started_at DESC, sj.id DESC
        LIMIT ?`,
      [...params, ...(after ? [after.startedAt, after.id] : []), limit + 1],
    );
  }

  /** Journey por id, sólo si su sesión es del tenant; si no, `null` como si no existiera. */
  async findSession(id: string, tenantId: string) {
    const tenant = this.sessionInTenant('sj.session_id', tenantId);
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
      `SELECT sj.id, sj.session_id, sj.portal_type_concept_id, sj.journey_status_concept_id,
              sj.started_at, sj.ended_at, sj.event_count,
              sj.analytics_subject_id IS NOT NULL AS has_subject
         FROM telemetry.session_journeys sj
        WHERE sj.id = ? AND ${tenant.sql}`,
      [id, ...tenant.params],
    );
    return row ?? null;
  }

  /** Timeline de una sesión: qué pasó y cuándo, con nombres de propiedad pero sin valores. */
  sessionTimeline(sessionId: string, tenantId: string) {
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
        WHERE e.session_id = ? AND e.tenant_id = ?
        ORDER BY e.occurred_at, e.id
        LIMIT ${TIMELINE_LIMIT}`,
      [sessionId, tenantId],
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
    tenantId: string,
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
             AND tenant_id = ?
             AND occurred_at >= ? AND occurred_at < ?
           GROUP BY session_id)`);
        params.push(schemaId, tenantId, window.from, window.to);
      } else {
        ctes.push(`s${index} AS (
          SELECT e.session_id, min(e.occurred_at) AS t
            FROM telemetry.user_activity_events e
            JOIN s${index - 1} p ON p.session_id = e.session_id AND e.occurred_at >= p.t
           WHERE e.event_schema_definition_id = ? AND e.tenant_id = ?
             AND e.occurred_at < ?
           GROUP BY e.session_id)`);
        params.push(schemaId, tenantId, window.to);
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

  /**
   * Conversiones registradas por el servidor (confirmadas), no reclamadas por el
   * navegador, atribuidas al tenant por su evento de cierre o su journey.
   */
  async serverConversions(
    window: AnalyticsWindow,
    tenantId: string,
    funnelId: string,
  ) {
    const tenant = this.rowInTenant(
      'ce.completion_event_id',
      'ce.session_journey_id',
      tenantId,
    );
    const [row] = await this.sql<{ n: number }>(
      `SELECT count(*)::int AS n FROM telemetry.conversion_events ce
        WHERE ce.funnel_definition_id = ? AND ce.converted_at >= ? AND ce.converted_at < ?
          AND ${tenant.sql}`,
      [funnelId, window.from, window.to, ...tenant.params],
    );
    return row?.n ?? 0;
  }

  /** Salud de la ingesta medida sobre lo que sí se persistió. */
  async pipelineHealth(scope: AnalyticsScope) {
    const { where, params } = this.eventScope('received_at', scope);
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
    const ctx = this.scope('created_at', scope, 'cc');
    const tenant = this.sessionInTenant('cc.session_id', scope.tenantId);
    const [clients] = await this.sql<{
      contexts: number;
      bots: number;
      bot_unknown: number;
    }>(
      `SELECT count(*)::int AS contexts,
              count(*) FILTER (WHERE cc.is_bot)::int AS bots,
              count(*) FILTER (WHERE cc.is_bot IS NULL)::int AS bot_unknown
         FROM telemetry.client_contexts cc
        WHERE ${ctx.where} AND ${tenant.sql}`,
      [...ctx.params, ...tenant.params],
    );
    return { ingest, clients };
  }

  /**
   * Desglose de dispositivos sobre `client_contexts` en la ventana, acotado al
   * tenant por la sesión del contexto (igual que `pipelineHealth`).
   *
   * Los bots (`is_bot = true`) se cuentan aparte y no entran en ningún
   * desglose; `is_bot IS NULL` no es bot demostrado y sí entra (se informa).
   * Sólo agregados: ningún id de sesión, sujeto, hash ni IP sale de aquí.
   */
  async devices(scope: AnalyticsScope) {
    const ctx = this.scope('created_at', scope, 'cc');
    const tenant = this.sessionInTenant('cc.session_id', scope.tenantId);
    const where = `${ctx.where} AND ${tenant.sql}`;
    const params = [...ctx.params, ...tenant.params];

    const [totals] = await this.sql<{
      contexts: number;
      bots: number;
      bot_unknown: number;
      last_context_at: Date | null;
    }>(
      `SELECT count(*) FILTER (WHERE cc.is_bot IS NOT TRUE)::int AS contexts,
              count(*) FILTER (WHERE cc.is_bot)::int AS bots,
              count(*) FILTER (WHERE cc.is_bot IS NULL)::int AS bot_unknown,
              max(cc.created_at) AS last_context_at
         FROM telemetry.client_contexts cc
        WHERE ${where}`,
      params,
    );

    const byConcept = async (dimension: DeviceConceptDimension) => {
      const column = DEVICE_CONCEPT_COLUMNS[dimension];
      return this.sql<DeviceBreakdownRow>(
        `SELECT code, label, contexts FROM (
           SELECT coalesce(k.code, cc.${column}::text, '${DEVICE_UNSPECIFIED}') AS code,
                  min(coalesce(nullif(k.display, ''), k.code, cc.${column}::text,
                               '${DEVICE_UNSPECIFIED}')) AS label,
                  count(*)::int AS contexts
             FROM telemetry.client_contexts cc
             LEFT JOIN terminology.catalog_concepts k ON k.id = cc.${column}
            WHERE ${where} AND cc.is_bot IS NOT TRUE
            GROUP BY 1
         ) d
         ORDER BY contexts DESC, code COLLATE "C" ASC
         LIMIT ?`,
        [...params, DEVICE_BREAKDOWN_LIMIT],
      );
    };

    const byDeviceType = await byConcept('deviceType');
    const byOsFamily = await byConcept('osFamily');
    const byBrowserFamily = await byConcept('browserFamily');
    const byAppVersion = await this.sql<DeviceBreakdownRow>(
      `SELECT code, code AS label, contexts FROM (
         SELECT coalesce(nullif(btrim(cc.app_version), ''), '${DEVICE_UNSPECIFIED}') AS code,
                count(*)::int AS contexts
           FROM telemetry.client_contexts cc
          WHERE ${where} AND cc.is_bot IS NOT TRUE
          GROUP BY 1
       ) d
       ORDER BY contexts DESC, code COLLATE "C" ASC
       LIMIT ?`,
      [...params, DEVICE_BREAKDOWN_LIMIT],
    );
    return {
      totals,
      byDeviceType,
      byOsFamily,
      byBrowserFamily,
      byAppVersion,
    };
  }
}
