import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AnalyticsWindow } from '../../domain/analytics-window';
import { TELE } from '../../telemetry.concepts';

/** Filtro de las lecturas de uso por parte. `tenantId` ausente = plataforma. */
export interface PartsScope {
  tenantId?: string;
  portalConceptId?: string;
  window: AnalyticsWindow;
}

export const PAGE_VIEW_NAMES = ['pagina_vista', 'page_view'] as const;

export interface RouteUsageRow {
  route: string | null;
  portal: string;
  views: number;
  events: number;
  sessions: number;
  users: number;
  anonymous: number;
}

/**
 * Uso por pantalla sobre `user_activity_events` y sus propiedades. Todo es SQL
 * parametrizado y agregado; ninguna fila sale con sesión, sujeto ni usuario.
 */
@Injectable()
export class TelemetryPartsRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  /** Predicado de ventana, tenant y portal sobre `user_activity_events` con alias `e`. */
  private where(scope: PartsScope, window: AnalyticsWindow = scope.window) {
    const clauses = ['e.occurred_at >= ?', 'e.occurred_at < ?'];
    const params: unknown[] = [window.from, window.to];
    if (scope.tenantId) {
      clauses.push('e.tenant_id = ?');
      params.push(scope.tenantId);
    }
    if (scope.portalConceptId) {
      clauses.push('e.portal_type_concept_id = ?');
      params.push(scope.portalConceptId);
    }
    return { where: clauses.join(' AND '), params };
  }

  usageByRoute(scope: PartsScope, window: AnalyticsWindow = scope.window) {
    const { where, params } = this.where(scope, window);
    return this.sql<RouteUsageRow>(
      `SELECT e.route_template AS route,
              CASE WHEN e.portal_type_concept_id = ? THEN 'MOBILE' ELSE 'WEB' END AS portal,
              count(*) FILTER (WHERE e.event_name IN (${PAGE_VIEW_NAMES.map(() => '?').join(', ')}))::int AS views,
              count(*)::int AS events,
              count(DISTINCT e.session_id)::int AS sessions,
              count(DISTINCT e.user_id)::int AS users,
              count(*) FILTER (WHERE e.user_id IS NULL)::int AS anonymous
         FROM telemetry.user_activity_events e
        WHERE ${where}
        GROUP BY 1, 2 ORDER BY views DESC, events DESC LIMIT 1000`,
      [TELE.PORTAL_MOBILE, ...PAGE_VIEW_NAMES, ...params],
    );
  }

  /** Tiempo en pantalla (`ms_en_pagina` de `pagina_abandonada`), p50/p75 por ruta. */
  dwellByRoute(scope: PartsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{ route: string; samples: number; subjects: number; p50: string | null; p75: string | null }>(
      `SELECT e.route_template AS route, count(*)::int AS samples,
              count(DISTINCT coalesce(e.user_id::text, e.analytics_subject_id::text, e.session_id::text))::int AS subjects,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY p.value_number)::text AS p50,
              percentile_cont(0.75) WITHIN GROUP (ORDER BY p.value_number)::text AS p75
         FROM telemetry.user_activity_events e
         JOIN telemetry.user_activity_event_properties p
           ON p.user_activity_event_id = e.id AND p.property_name = 'ms_en_pagina'
        WHERE ${where} AND e.event_name = 'pagina_abandonada' AND e.route_template IS NOT NULL
          AND p.value_number IS NOT NULL
        GROUP BY 1`,
      params,
    );
  }

  /** Acciones clave de una pantalla: clics interactivos agrupados por selector. */
  keyActions(scope: PartsScope, route: string, limit: number) {
    const { where, params } = this.where(scope);
    return this.sql<{ target: string; clicks: number; users: number }>(
      `WITH c AS (
         SELECT e.id, e.user_id,
                max(p.value_string) FILTER (WHERE p.property_name = 'objetivo') AS target,
                coalesce(bool_or(p.value_boolean) FILTER (WHERE p.property_name = 'es_interactivo'), false) AS interactive
           FROM telemetry.user_activity_events e
           LEFT JOIN telemetry.user_activity_event_properties p ON p.user_activity_event_id = e.id
          WHERE ${where} AND e.event_name = 'clic' AND e.route_template = ?
          GROUP BY e.id
       )
       SELECT target, count(*)::int AS clicks, count(DISTINCT user_id)::int AS users
         FROM c WHERE interactive AND target IS NOT NULL
        GROUP BY 1 ORDER BY clicks DESC, target LIMIT ?`,
      [...params, route, limit],
    );
  }

  /** Vistas por cubo de una pantalla, con los vacíos en 0. */
  viewsSeries(scope: PartsScope, route: string) {
    const { where, params } = this.where(scope);
    const unit = scope.window.interval;
    return this.sql<{ bucket: Date; views: number }>(
      `WITH buckets AS (
         SELECT generate_series(date_trunc('${unit}', ?::timestamptz, 'UTC'),
                                ?::timestamptz - interval '1 microsecond', interval '1 ${unit}') AS bucket
       ), counts AS (
         SELECT date_trunc('${unit}', e.occurred_at, 'UTC') AS bucket, count(*)::int AS views
           FROM telemetry.user_activity_events e
          WHERE ${where} AND e.route_template = ?
            AND e.event_name IN (${PAGE_VIEW_NAMES.map(() => '?').join(', ')})
          GROUP BY 1
       )
       SELECT b.bucket, coalesce(c.views, 0) AS views
         FROM buckets b LEFT JOIN counts c ON c.bucket = b.bucket ORDER BY b.bucket`,
      [scope.window.from, scope.window.to, ...params, route, ...PAGE_VIEW_NAMES],
    );
  }

  /** Reparto de eventos de una pantalla por tamaño de pantalla (`tamano_pantalla`). */
  screenSizes(scope: PartsScope, route: string) {
    const { where, params } = this.where(scope);
    return this.sql<{ screen_size: string; events: number; users: number }>(
      `SELECT p.value_string AS screen_size, count(*)::int AS events,
              count(DISTINCT e.user_id)::int AS users
         FROM telemetry.user_activity_events e
         JOIN telemetry.user_activity_event_properties p
           ON p.user_activity_event_id = e.id AND p.property_name = 'tamano_pantalla'
        WHERE ${where} AND e.route_template = ?
        GROUP BY 1 ORDER BY events DESC`,
      [...params, route],
    );
  }

  /** Errores del cliente por plantilla de ruta en la ventana (para la tasa por parte). */
  errorsByRoute(scope: PartsScope, window: AnalyticsWindow = scope.window) {
    const clauses = ['c.received_at >= ?', 'c.received_at < ?'];
    const params: unknown[] = [window.from, window.to];
    if (scope.tenantId) {
      clauses.push('c.actor_tenant_id = ?');
      params.push(scope.tenantId);
    }
    if (scope.portalConceptId) {
      clauses.push('c.portal_type_concept_id = ?');
      params.push(scope.portalConceptId);
    }
    return this.sql<{ route: string | null; errors: number }>(
      `SELECT c.route_template AS route, count(*)::int AS errors
         FROM telemetry.client_error_events c WHERE ${clauses.join(' AND ')} GROUP BY 1`,
      params,
    );
  }
}
