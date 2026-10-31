import { Injectable } from '@nestjs/common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { PartsRegistry } from '../../domain/parts-registry';
import {
  TelemetryClientErrorsReadRepository,
  type ErrorsScope,
} from '../../infrastructure/repositories/telemetry-client-errors-read.repository';
import { TelemetryPartsRepository } from '../../infrastructure/repositories/telemetry-parts.repository';
import {
  CLIENT_ERROR_CLASSES,
  ERROR_CLASS_CONCEPT_BY_CODE,
  TELE,
  type ClientErrorClass,
} from '../../telemetry.concepts';
import {
  previousWindow,
  windowJson,
  windowOrThrow,
  type AnalyticsActorScope,
} from '../analytics-scope';

export interface ErrorsQuery {
  from?: string;
  to?: string;
  portal?: 'WEB' | 'MOBILE';
  routeCode?: string;
  class?: ClientErrorClass;
  limit?: number;
}

const CLASS_BY_ID = new Map(
  Object.entries(ERROR_CLASS_CONCEPT_BY_CODE).map(([code, id]) => [id, code]),
);
const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
const rate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 10_000) / 10_000 : null);

/**
 * Lecturas de errores del cliente (H3.S1.M3). Conteos de eventos siempre
 * visibles (un fallo raro es justo lo que se quiere ver); las cifras que
 * identifican personas (`affectedUsers`) se suprimen bajo `minSample` en
 * alcance plataforma. El `request_id` sólo sale en el detalle, a roles RAW.
 */
@Injectable()
export class TelemetryErrorsAnalyticsService {
  constructor(
    private readonly repo: TelemetryClientErrorsReadRepository,
    private readonly parts: TelemetryPartsRepository,
  ) {}

  private async registry() {
    return new PartsRegistry(await this.repo.partsRegistry(CONCEPTS.STATE_ACTIVE));
  }

  private scope(query: ErrorsQuery, actor: AnalyticsActorScope, registry: PartsRegistry): ErrorsScope {
    const window = windowOrThrow(query);
    return {
      tenantId: actor.tenantId,
      window,
      portalConceptId: query.portal
        ? query.portal === 'MOBILE'
          ? TELE.PORTAL_MOBILE
          : TELE.PORTAL_WEB
        : undefined,
      classConceptId: query.class ? ERROR_CLASS_CONCEPT_BY_CODE[query.class] : undefined,
      routes: query.routeCode ? registry.patternsOf(query.routeCode) : undefined,
    };
  }

  private users(actor: AnalyticsActorScope, n: number) {
    return actor.platform && actor.minSample !== undefined && n < actor.minSample ? null : n;
  }

  private scopeView(actor: AnalyticsActorScope) {
    return actor.platform
      ? { level: 'platform', tenantId: null, minSample: actor.minSample ?? null }
      : { level: 'tenant', tenantId: actor.tenantId ?? null, minSample: null };
  }

  async errors(query: ErrorsQuery, actor: AnalyticsActorScope, includeCorrelation = false) {
    const registry = await this.registry();
    const scope = this.scope(query, actor, registry);
    const [totals, byRoute, byClass, byHttpStatus, byApiRoute, series, s9, views] =
      await Promise.all([
        this.repo.totals(scope),
        this.repo.byRoute(scope),
        this.repo.byClass(scope),
        this.repo.byHttpStatus(scope),
        this.repo.byApiRoute(scope),
        this.repo.series(scope),
        this.repo.s9Shown(scope),
        this.parts.usageByRoute({
          tenantId: scope.tenantId,
          portalConceptId: scope.portalConceptId,
          window: scope.window,
        }),
      ]);

    const viewsByCode = new Map<string, number>();
    for (const row of views) {
      const part = registry.resolve(row.route, row.portal);
      if (part) viewsByCode.set(part.routeCode, (viewsByCode.get(part.routeCode) ?? 0) + row.views);
    }
    const parts = new Map<string, { routeCode: string | null; routePattern: string | null; pageTitle: string | null; domain: string | null; errors: number; fingerprints: number }>();
    for (const row of byRoute) {
      const part = registry.resolve(row.route, row.portal);
      const key = part?.routeCode ?? '(sin parte)';
      const cur = parts.get(key) ?? {
        routeCode: part?.routeCode ?? null,
        routePattern: part?.routePattern ?? row.route,
        pageTitle: part?.pageTitle ?? null,
        domain: part?.domain ?? null,
        errors: 0,
        fingerprints: 0,
      };
      cur.errors += row.errors;
      cur.fingerprints += row.fingerprints;
      parts.set(key, cur);
    }

    const notMeasured: Array<{ metric: string; reason: string }> = [
      {
        metric: 'routePrevious',
        reason: 'La tabla de errores no guarda la ruta anterior: «de dónde venía» no se puede medir.',
      },
    ];
    if (totals.anonymous > 0) {
      notMeasured.push({
        metric: 'sessionsAffected',
        reason: `${totals.anonymous} error(es) llegaron sin sesión (pantalla de acceso o token ausente): las sesiones afectadas no incluyen esos errores.`,
      });
    }
    if (s9 === 0) {
      notMeasured.push({
        metric: 's9Shown',
        reason: 'No hay eventos «estado_error_mostrado» en la ventana: o ninguna persona vio un S9 o la captura de uso no está encendida/consentida.',
      });
    }
    if (actor.platform) {
      notMeasured.push({
        metric: 'affectedUsers',
        reason: `En alcance plataforma las personas afectadas se muestran sólo con al menos ${actor.minSample} distintas.`,
      });
    }

    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      totals: {
        errors: totals.events,
        suppressedRepeats: totals.suppressed,
        fingerprints: totals.fingerprints,
        sessionsAffected: totals.anonymous > 0 ? null : totals.sessions,
        sessionsWithError: totals.sessions,
        affectedUsers: this.users(actor, totals.users),
        s9Shown: s9 === 0 ? null : s9,
      },
      byPart: [...parts.values()].map((p) => ({
        ...p,
        rate: p.routeCode ? rate(p.errors, viewsByCode.get(p.routeCode) ?? 0) : null,
      })),
      byClass: byClass.map((r) => ({
        class: CLASS_BY_ID.get(r.class_concept_id)?.replace('ERROR_CLASS_', '') ?? 'UNKNOWN',
        errors: r.errors,
        fingerprints: r.fingerprints,
      })),
      byHttpStatus: byHttpStatus.map((r) => ({ status: r.status, errors: r.errors })),
      byApiRoute: byApiRoute.map((r) => ({
        method: r.method,
        route: r.route,
        errors: r.errors,
        lastRequestId: includeCorrelation ? r.last_request_id : null,
      })),
      series: series.map((r) => ({ bucket: iso(r.bucket), errors: Number(r.errors) })),
      notMeasured: [
        ...notMeasured,
        ...(includeCorrelation
          ? []
          : [{ metric: 'lastRequestId', reason: 'Los request_id sólo se muestran a PLATFORM_ADMIN, SECURITY_ADMIN, DPO y SUPERADMIN.' }]),
      ],
    };
  }

  async fingerprints(query: ErrorsQuery, actor: AnalyticsActorScope, includeCorrelation = false) {
    const registry = await this.registry();
    const scope = this.scope(query, actor, registry);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const rows = await this.repo.fingerprints(scope, limit);
    const fps = rows.map((r) => r.fingerprint);
    const prev = await this.repo.countsFor(scope, previousWindow(scope.window), fps);
    const routes = await this.repo.routesOfFingerprints(scope, fps);
    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      fingerprints: rows.map((r) => {
        const before = prev.get(r.fingerprint) ?? 0;
        return {
          fingerprint: r.fingerprint,
          errorType: r.error_type,
          class: CLASS_BY_ID.get(r.class_concept_id)?.replace('ERROR_CLASS_', '') ?? 'UNKNOWN',
          sanitizedMessage: r.sanitized_message,
          count: r.count,
          firstSeen: iso(r.first_seen),
          lastSeen: iso(r.last_seen),
          parts: routes
            .filter((x) => x.fingerprint === r.fingerprint)
            .slice(0, 5)
            .map((x) => {
              const part = registry.resolve(x.route);
              return { routeCode: part?.routeCode ?? null, routeTemplate: x.route, errors: x.n };
            }),
          lastRequestId: includeCorrelation ? r.last_request_id : null,
          versions: r.versions,
          affectedUsers: this.users(actor, r.users),
          trend: {
            previous: before,
            change: before > 0 ? rate(r.count - before, before) : null,
            direction: r.count > before ? 'up' : r.count < before ? 'down' : 'flat',
          },
        };
      }),
      notMeasured: includeCorrelation
        ? []
        : [{ metric: 'lastRequestId', reason: 'Los request_id sólo se muestran a PLATFORM_ADMIN, SECURITY_ADMIN, DPO y SUPERADMIN.' }],
    };
  }

  async fingerprint(fp: string, query: ErrorsQuery, actor: AnalyticsActorScope, includeRequestIds: boolean) {
    const registry = await this.registry();
    const scope: ErrorsScope = { ...this.scope(query, actor, registry), fingerprint: fp };
    const [head] = await this.repo.fingerprints(scope, 1);
    const [series, byRoute, versions, statuses, recent] = await Promise.all([
      this.repo.series(scope),
      this.repo.byRoute(scope),
      this.repo.versions(scope),
      this.repo.byHttpStatus(scope),
      includeRequestIds ? this.repo.recentRequestIds(scope, 20) : Promise.resolve([]),
    ]);
    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      fingerprint: fp,
      found: head !== undefined,
      errorType: head?.error_type ?? null,
      class: head ? (CLASS_BY_ID.get(head.class_concept_id)?.replace('ERROR_CLASS_', '') ?? 'UNKNOWN') : null,
      sanitizedMessage: head?.sanitized_message ?? null,
      count: head?.count ?? 0,
      firstSeen: iso(head?.first_seen ?? null),
      lastSeen: iso(head?.last_seen ?? null),
      affectedUsers: head ? this.users(actor, head.users) : null,
      series: series.map((r) => ({ bucket: iso(r.bucket), errors: Number(r.errors) })),
      parts: byRoute.map((r) => {
        const part = registry.resolve(r.route, r.portal);
        return { routeCode: part?.routeCode ?? null, routeTemplate: r.route, errors: r.errors };
      }),
      versions,
      httpStatuses: statuses,
      recentRequestIds: includeRequestIds
        ? recent.map((r) => ({ requestId: r.request_id, receivedAt: iso(r.received_at), httpStatus: r.http_status }))
        : null,
      notMeasured: includeRequestIds
        ? []
        : [{ metric: 'recentRequestIds', reason: 'Los request_id recientes sólo se muestran a PLATFORM_ADMIN, SECURITY_ADMIN y DPO.' }],
    };
  }

  async routesNotFound(query: ErrorsQuery, actor: AnalyticsActorScope) {
    const registry = await this.registry();
    const scope = this.scope({ ...query, class: undefined, routeCode: undefined }, actor, registry);
    const [notFound, allRoutes] = await Promise.all([
      this.repo.routesNotFound(scope, ERROR_CLASS_CONCEPT_BY_CODE.ROUTE),
      this.repo.byRoute(scope),
    ]);
    const unmapped = allRoutes.filter((r) => r.route !== null && !registry.resolve(r.route, r.portal));
    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      classes: CLIENT_ERROR_CLASSES,
      notFound: notFound.map((r) => ({
        routeTemplate: r.route,
        errors: r.errors,
        firstSeen: iso(r.first_seen),
        lastSeen: iso(r.last_seen),
        affectedUsers: this.users(actor, r.users),
        registered: r.route ? registry.resolve(r.route) !== null : false,
      })),
      unmappedErrorRoutes: unmapped.slice(0, 50).map((r) => ({ routeTemplate: r.route, errors: r.errors })),
      notMeasured: [
        { metric: 'previousRoute', reason: 'client_error_events no guarda la ruta anterior: no se sabe desde dónde se llegó al enlace roto.' },
        ...(registry.rows.length === 0
          ? [{ metric: 'partsRegistry', reason: 'read_models.frontend_routes está vacía (falta correr la siembra «partes-del-frontend»): toda ruta aparece sin parte.' }]
          : []),
      ],
    };
  }
}
