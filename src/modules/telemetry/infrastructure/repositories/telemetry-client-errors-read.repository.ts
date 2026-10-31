import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AnalyticsWindow } from '../../domain/analytics-window';
import type { PartRow } from '../../domain/parts-registry';
import { TELE } from '../../telemetry.concepts';

/** Filtros de lectura de errores. `tenantId` ausente = alcance plataforma. */
export interface ErrorsScope {
  tenantId?: string;
  window: AnalyticsWindow;
  portalConceptId?: string;
  classConceptId?: string;
  /** Plantillas de ruta (de un `routeCode`). */
  routes?: readonly string[];
  fingerprint?: string;
}

const TOP = 20;

export interface ErrorTotalsRow {
  events: number;
  suppressed: number;
  fingerprints: number;
  sessions: number;
  users: number;
  anonymous: number;
}

@Injectable()
export class TelemetryClientErrorsReadRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  private where(scope: ErrorsScope, window: AnalyticsWindow = scope.window) {
    const clauses = ['e.received_at >= ?', 'e.received_at < ?'];
    const params: unknown[] = [window.from, window.to];
    if (scope.tenantId) {
      clauses.push('e.actor_tenant_id = ?');
      params.push(scope.tenantId);
    }
    if (scope.portalConceptId) {
      clauses.push('e.portal_type_concept_id = ?');
      params.push(scope.portalConceptId);
    }
    if (scope.classConceptId) {
      clauses.push('e.error_class_concept_id = ?');
      params.push(scope.classConceptId);
    }
    if (scope.routes) {
      if (scope.routes.length === 0) clauses.push('FALSE');
      else {
        clauses.push(
          `e.route_template IN (${scope.routes.map(() => '?').join(', ')})`,
        );
        params.push(...scope.routes);
      }
    }
    if (scope.fingerprint) {
      clauses.push('e.fingerprint = ?');
      params.push(scope.fingerprint);
    }
    return { where: clauses.join(' AND '), params };
  }

  async totals(scope: ErrorsScope): Promise<ErrorTotalsRow> {
    const { where, params } = this.where(scope);
    const [row] = await this.sql<ErrorTotalsRow>(
      `SELECT count(*)::int AS events,
              coalesce(sum(e.suppressed_count), 0)::int AS suppressed,
              count(DISTINCT e.fingerprint)::int AS fingerprints,
              count(DISTINCT e.session_id)::int AS sessions,
              count(DISTINCT e.user_id)::int AS users,
              count(*) FILTER (WHERE e.user_id IS NULL)::int AS anonymous
         FROM telemetry.client_error_events e WHERE ${where}`,
      params,
    );
    return (
      row ?? {
        events: 0,
        suppressed: 0,
        fingerprints: 0,
        sessions: 0,
        users: 0,
        anonymous: 0,
      }
    );
  }

  byRoute(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{
      route: string | null;
      portal: string;
      errors: number;
      fingerprints: number;
      users: number;
    }>(
      `SELECT e.route_template AS route,
              CASE WHEN e.portal_type_concept_id = ? THEN 'MOBILE' ELSE 'WEB' END AS portal,
              count(*)::int AS errors, count(DISTINCT e.fingerprint)::int AS fingerprints,
              count(DISTINCT e.user_id)::int AS users
         FROM telemetry.client_error_events e WHERE ${where}
        GROUP BY 1, 2 ORDER BY errors DESC, route LIMIT 500`,
      [TELE.PORTAL_MOBILE, ...params],
    );
  }

  byClass(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{
      class_concept_id: string;
      errors: number;
      fingerprints: number;
    }>(
      `SELECT e.error_class_concept_id AS class_concept_id, count(*)::int AS errors,
              count(DISTINCT e.fingerprint)::int AS fingerprints
         FROM telemetry.client_error_events e WHERE ${where}
        GROUP BY 1 ORDER BY errors DESC`,
      params,
    );
  }

  byHttpStatus(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{ status: number; errors: number }>(
      `SELECT e.http_status AS status, count(*)::int AS errors
         FROM telemetry.client_error_events e WHERE ${where} AND e.http_status IS NOT NULL
        GROUP BY 1 ORDER BY errors DESC, status`,
      params,
    );
  }

  byApiRoute(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{
      method: string | null;
      route: string;
      errors: number;
      last_request_id: string | null;
    }>(
      `SELECT e.http_method AS method, e.api_route_template AS route, count(*)::int AS errors,
              (array_agg(e.request_id ORDER BY e.received_at DESC) FILTER (WHERE e.request_id IS NOT NULL))[1] AS last_request_id
         FROM telemetry.client_error_events e WHERE ${where} AND e.api_route_template IS NOT NULL
        GROUP BY 1, 2 ORDER BY errors DESC, route LIMIT ${TOP}`,
      params,
    );
  }

  series(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    const unit = scope.window.interval;
    return this.sql<{ bucket: Date; errors: number }>(
      `WITH buckets AS (
         SELECT generate_series(date_trunc('${unit}', ?::timestamptz, 'UTC'),
                                ?::timestamptz - interval '1 microsecond', interval '1 ${unit}') AS bucket
       ), counts AS (
         SELECT date_trunc('${unit}', e.received_at, 'UTC') AS bucket, count(*)::int AS errors
           FROM telemetry.client_error_events e WHERE ${where} GROUP BY 1
       )
       SELECT b.bucket, coalesce(c.errors, 0) AS errors
         FROM buckets b LEFT JOIN counts c ON c.bucket = b.bucket ORDER BY b.bucket`,
      [scope.window.from, scope.window.to, ...params],
    );
  }

  s9Shown(scope: ErrorsScope) {
    const clauses = [
      'u.occurred_at >= ?',
      'u.occurred_at < ?',
      `u.event_name = 'estado_error_mostrado'`,
    ];
    const params: unknown[] = [scope.window.from, scope.window.to];
    if (scope.tenantId) {
      clauses.push('u.tenant_id = ?');
      params.push(scope.tenantId);
    }
    return this.sql<{ n: number }>(
      `SELECT count(*)::int AS n FROM telemetry.user_activity_events u WHERE ${clauses.join(' AND ')}`,
      params,
    ).then((rows) => rows[0]?.n ?? 0);
  }

  fingerprints(scope: ErrorsScope, limit: number) {
    const { where, params } = this.where(scope);
    return this.sql<{
      fingerprint: string;
      error_type: string;
      class_concept_id: string;
      sanitized_message: string | null;
      count: number;
      first_seen: Date;
      last_seen: Date;
      last_request_id: string | null;
      versions: string[];
      users: number;
    }>(
      `SELECT e.fingerprint,
              (array_agg(e.error_type ORDER BY e.received_at DESC))[1] AS error_type,
              (array_agg(e.error_class_concept_id ORDER BY e.received_at DESC))[1] AS class_concept_id,
              (array_agg(e.sanitized_message ORDER BY e.received_at DESC))[1] AS sanitized_message,
              count(*)::int AS count, min(e.received_at) AS first_seen, max(e.received_at) AS last_seen,
              (array_agg(e.request_id ORDER BY e.received_at DESC) FILTER (WHERE e.request_id IS NOT NULL))[1] AS last_request_id,
              array_agg(DISTINCT e.app_version) AS versions,
              count(DISTINCT e.user_id)::int AS users
         FROM telemetry.client_error_events e WHERE ${where}
        GROUP BY e.fingerprint ORDER BY count DESC, last_seen DESC, e.fingerprint LIMIT ?`,
      [...params, limit],
    );
  }

  /** Conteo por huella en otra ventana (la anterior), para la tendencia. */
  async countsFor(
    scope: ErrorsScope,
    window: AnalyticsWindow,
    fingerprints: readonly string[],
  ) {
    if (fingerprints.length === 0) return new Map<string, number>();
    const { where, params } = this.where(
      { ...scope, fingerprint: undefined },
      window,
    );
    const rows = await this.sql<{ fingerprint: string; n: number }>(
      `SELECT e.fingerprint, count(*)::int AS n FROM telemetry.client_error_events e
        WHERE ${where} AND e.fingerprint IN (${fingerprints.map(() => '?').join(', ')})
        GROUP BY 1`,
      [...params, ...fingerprints],
    );
    return new Map(rows.map((r) => [r.fingerprint, r.n]));
  }

  routesOfFingerprints(scope: ErrorsScope, fingerprints: readonly string[]) {
    if (fingerprints.length === 0)
      return Promise.resolve(
        [] as { fingerprint: string; route: string | null; n: number }[],
      );
    const { where, params } = this.where({ ...scope, fingerprint: undefined });
    return this.sql<{ fingerprint: string; route: string | null; n: number }>(
      `SELECT e.fingerprint, e.route_template AS route, count(*)::int AS n
         FROM telemetry.client_error_events e
        WHERE ${where} AND e.fingerprint IN (${fingerprints.map(() => '?').join(', ')})
        GROUP BY 1, 2 ORDER BY n DESC`,
      [...params, ...fingerprints],
    );
  }

  versions(scope: ErrorsScope) {
    const { where, params } = this.where(scope);
    return this.sql<{ version: string; errors: number }>(
      `SELECT e.app_version AS version, count(*)::int AS errors
         FROM telemetry.client_error_events e WHERE ${where} GROUP BY 1 ORDER BY errors DESC LIMIT ${TOP}`,
      params,
    );
  }

  recentRequestIds(scope: ErrorsScope, limit: number) {
    const { where, params } = this.where(scope);
    return this.sql<{
      request_id: string;
      received_at: Date;
      http_status: number | null;
    }>(
      `SELECT e.request_id, e.received_at, e.http_status
         FROM telemetry.client_error_events e WHERE ${where} AND e.request_id IS NOT NULL
        ORDER BY e.received_at DESC LIMIT ?`,
      [...params, limit],
    );
  }

  routesNotFound(scope: ErrorsScope, routeClassConceptId: string) {
    const { where, params } = this.where({
      ...scope,
      classConceptId: routeClassConceptId,
    });
    return this.sql<{
      route: string | null;
      errors: number;
      first_seen: Date;
      last_seen: Date;
      users: number;
    }>(
      `SELECT e.route_template AS route, count(*)::int AS errors,
              min(e.received_at) AS first_seen, max(e.received_at) AS last_seen,
              count(DISTINCT e.user_id)::int AS users
         FROM telemetry.client_error_events e WHERE ${where}
        GROUP BY 1 ORDER BY errors DESC, route LIMIT 100`,
      params,
    );
  }

  /** Partes registradas (`read_models.frontend_routes`), con su superficie. */
  async partsRegistry(activeConceptId: string): Promise<PartRow[]> {
    const rows = await this.sql<{
      route_code: string;
      route_pattern: string;
      page_title: string;
      domain: string | null;
      surface: string;
      active: boolean;
    }>(
      `SELECT fr.route_code, fr.route_pattern, fr.page_title, fr.navigation_group AS domain,
              ps.portal_code AS surface, (fr.status_concept_id = ?) AS active
         FROM read_models.frontend_routes fr
         JOIN read_models.portal_surfaces ps ON ps.id = fr.portal_surface_id
        ORDER BY ps.portal_code, fr.route_code`,
      [activeConceptId],
    );
    return rows.map((r) => ({
      routeCode: r.route_code,
      routePattern: r.route_pattern,
      pageTitle: r.page_title,
      domain: r.domain,
      surface: r.surface,
      active: r.active,
    }));
  }
}
