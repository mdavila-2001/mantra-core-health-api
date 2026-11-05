import { Injectable, NotFoundException } from '@nestjs/common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { PartsRegistry, type PartRow } from '../../domain/parts-registry';
import { TelemetryAnalyticsRepository } from '../../infrastructure/repositories/telemetry-analytics.repository';
import { TelemetryClientErrorsReadRepository } from '../../infrastructure/repositories/telemetry-client-errors-read.repository';
import {
  TelemetryPartsRepository,
  type PartsScope,
} from '../../infrastructure/repositories/telemetry-parts.repository';
import { TELE } from '../../telemetry.concepts';
import {
  previousWindow,
  windowJson,
  windowOrThrow,
  type AnalyticsActorScope,
} from '../analytics-scope';

export interface PartsQuery {
  from?: string;
  to?: string;
  interval?: 'hour' | 'day';
  portal?: 'WEB' | 'MOBILE';
  compare?: 'previous';
}

const TOP_UNMAPPED = 50;
const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
const num = (v: string | null) =>
  v === null ? null : Math.round(Number(v) * 10_000) / 10_000;
const rate = (n: number, d: number) =>
  d > 0 ? Math.round((n / d) * 10_000) / 10_000 : null;
const VITALS = [
  ['LCP', TELE.METRIC_LCP],
  ['INP', TELE.METRIC_INP],
  ['CLS', TELE.METRIC_CLS],
] as const;

/**
 * Uso por parte (H2.S1.M3): resuelve `route_template` → `route_code` en la
 * consulta, nunca en el cliente. Lo que no casa con ninguna ruta registrada cae
 * en `unmapped`. `users` es el recuento de `user_id` distintos (sólo personas
 * con consentimiento): en alcance plataforma `null` bajo `minSample`.
 */
@Injectable()
export class TelemetryPartsAnalyticsService {
  constructor(
    private readonly usage: TelemetryPartsRepository,
    private readonly errors: TelemetryClientErrorsReadRepository,
    private readonly analytics: TelemetryAnalyticsRepository,
  ) {}

  private registry = async () =>
    new PartsRegistry(await this.errors.partsRegistry(CONCEPTS.STATE_ACTIVE));

  private scope(query: PartsQuery, actor: AnalyticsActorScope): PartsScope {
    return {
      tenantId: actor.tenantId,
      portalConceptId: query.portal
        ? query.portal === 'MOBILE'
          ? TELE.PORTAL_MOBILE
          : TELE.PORTAL_WEB
        : undefined,
      window: windowOrThrow(query),
    };
  }

  private small(actor: AnalyticsActorScope, n: number): boolean {
    return (
      actor.platform && actor.minSample !== undefined && n < actor.minSample
    );
  }

  private scopeView(actor: AnalyticsActorScope) {
    return actor.platform
      ? {
          level: 'platform',
          tenantId: null,
          minSample: actor.minSample ?? null,
        }
      : { level: 'tenant', tenantId: actor.tenantId ?? null, minSample: null };
  }

  private tree(registry: PartsRegistry) {
    const surfaces = new Map<string, Map<string, PartRow[]>>();
    for (const row of registry.rows) {
      const domains = surfaces.get(row.surface) ?? new Map<string, PartRow[]>();
      const key = row.domain ?? '(sin dominio)';
      domains.set(key, [...(domains.get(key) ?? []), row]);
      surfaces.set(row.surface, domains);
    }
    return [...surfaces.entries()].map(([surface, domains]) => ({
      surface,
      domains: [...domains.entries()].map(([domain, rows]) => {
        const features = new Map<string, PartRow[]>();
        for (const r of rows) {
          const feature = r.routeCode.split('.')[2] ?? r.routeCode;
          features.set(feature, [...(features.get(feature) ?? []), r]);
        }
        return {
          domain,
          features: [...features.entries()].map(([feature, screens]) => ({
            feature,
            screens: screens.map((s) => ({
              routeCode: s.routeCode,
              routePattern: s.routePattern,
              pageTitle: s.pageTitle,
              status: s.active ? 'ACTIVE' : 'DEPRECATED',
            })),
          })),
        };
      }),
    }));
  }

  async parts(query: PartsQuery, actor: AnalyticsActorScope) {
    const registry = await this.registry();
    const scope = this.scope(query, actor);
    const [rows, dwell, errorRows] = await Promise.all([
      this.usage.usageByRoute(scope),
      this.usage.dwellByRoute(scope),
      this.usage.errorsByRoute(scope),
    ]);
    const previous =
      query.compare === 'previous' ? previousWindow(scope.window) : null;
    const [prevRows, prevErrors] = previous
      ? await Promise.all([
          this.usage.usageByRoute(scope, previous),
          this.usage.errorsByRoute(scope, previous),
        ])
      : [[], []];
    const vitals = await Promise.all(
      VITALS.map(async ([name, id]) => ({
        name,
        rows: await this.analytics.webVitalsByRoute(
          {
            tenantId: actor.tenantId,
            minSample: actor.minSample,
            window: scope.window,
            portalConceptId: scope.portalConceptId,
          },
          id,
        ),
      })),
    );

    type Acc = {
      views: number;
      events: number;
      sessions: number;
      users: number;
      anonymous: number;
    };
    const zero = (): Acc => ({
      views: 0,
      events: 0,
      sessions: 0,
      users: 0,
      anonymous: 0,
    });
    const byCode = new Map<string, { part: PartRow; acc: Acc }>();
    const unmapped: Array<{
      routeTemplate: string | null;
      portal: string;
      views: number;
      events: number;
      errors: number;
    }> = [];
    const errorsOf = new Map<string, number>();
    for (const e of errorRows)
      errorsOf.set(
        e.route ?? '',
        (errorsOf.get(e.route ?? '') ?? 0) + e.errors,
      );

    for (const r of rows) {
      const part = registry.resolve(r.route, r.portal);
      if (!part) {
        unmapped.push({
          routeTemplate: r.route,
          portal: r.portal,
          views: r.views,
          events: r.events,
          errors: errorsOf.get(r.route ?? '') ?? 0,
        });
        continue;
      }
      const cur = byCode.get(part.routeCode) ?? { part, acc: zero() };
      cur.acc.views += r.views;
      cur.acc.events += r.events;
      cur.acc.sessions += r.sessions;
      cur.acc.users += r.users;
      cur.acc.anonymous += r.anonymous;
      byCode.set(part.routeCode, cur);
    }
    // Una parte con errores pero sin eventos también aparece.
    const seenRoutes = new Set(rows.map((r) => r.route));
    for (const e of errorRows) {
      const part = registry.resolve(e.route);
      if (part && !byCode.has(part.routeCode))
        byCode.set(part.routeCode, { part, acc: zero() });
      // Ruta con errores pero sin eventos y sin parte registrada (p. ej. un 404 de ruta).
      if (!part && !seenRoutes.has(e.route)) {
        unmapped.push({
          routeTemplate: e.route,
          portal: 'WEB',
          views: 0,
          events: 0,
          errors: e.errors,
        });
      }
    }

    const prevByCode = new Map<string, { views: number; errors: number }>();
    for (const r of prevRows) {
      const part = registry.resolve(r.route, r.portal);
      if (part)
        prevByCode.set(part.routeCode, {
          views: (prevByCode.get(part.routeCode)?.views ?? 0) + r.views,
          errors: prevByCode.get(part.routeCode)?.errors ?? 0,
        });
    }
    for (const e of prevErrors) {
      const part = registry.resolve(e.route);
      if (part)
        prevByCode.set(part.routeCode, {
          views: prevByCode.get(part.routeCode)?.views ?? 0,
          errors: (prevByCode.get(part.routeCode)?.errors ?? 0) + e.errors,
        });
    }

    const parts = [...byCode.values()]
      .map(({ part, acc }) => {
        const errs = errorsOf.get(part.routePattern) ?? 0;
        const d = dwell.find((x) => x.route === part.routePattern);
        const pv = prevByCode.get(part.routeCode);
        const vit: Record<
          string,
          { p75: number | null; samples: number | null }
        > = {};
        for (const v of vitals) {
          const hit = v.rows.find((x) => x.route === part.routePattern);
          if (hit)
            vit[v.name] = {
              p75: this.small(actor, hit.subjects) ? null : num(hit.p75),
              samples: this.small(actor, hit.subjects) ? null : hit.samples,
            };
        }
        return {
          routeCode: part.routeCode,
          routePattern: part.routePattern,
          pageTitle: part.pageTitle,
          surface: part.surface,
          domain: part.domain,
          views: acc.views,
          events: acc.events,
          sessions: acc.sessions,
          users: this.small(actor, acc.users) ? null : acc.users,
          anonymousEvents: acc.anonymous,
          dwellMs: d
            ? {
                samples: this.small(actor, d.subjects) ? null : d.samples,
                p50: this.small(actor, d.subjects) ? null : num(d.p50),
                p75: this.small(actor, d.subjects) ? null : num(d.p75),
              }
            : null,
          errors: errs,
          errorRate: rate(errs, acc.views),
          vitals: vit,
          ...(previous
            ? { previous: { views: pv?.views ?? 0, errors: pv?.errors ?? 0 } }
            : {}),
        };
      })
      .sort(
        (a, b) =>
          b.views - a.views ||
          b.events - a.events ||
          a.routeCode.localeCompare(b.routeCode),
      );

    const notMeasured: Array<{ metric: string; reason: string }> = [
      {
        metric: 'uniqueUsers',
        reason:
          'Sólo cuentan personas identificadas (con consentimiento); las vistas anónimas no tienen sujeto. Ver anonymousEvents.',
      },
      {
        metric: 'dntSessions',
        reason:
          'Las sesiones con Do-Not-Track no envían nada: no se pueden contar.',
      },
    ];
    if (registry.rows.length === 0) {
      notMeasured.push({
        metric: 'partsRegistry',
        reason:
          'read_models.frontend_routes está vacía (falta la siembra «partes-del-frontend»): todo cae en unmapped.',
      });
    }
    if (actor.platform) {
      notMeasured.push({
        metric: 'minSample',
        reason: `Alcance plataforma: usuarios, tiempo en pantalla y vitales se muestran sólo con al menos ${actor.minSample} sujetos/muestras.`,
      });
    }
    if (rows.length === 0) {
      notMeasured.push({
        metric: 'views',
        reason:
          'No hay eventos en la ventana: la captura de uso está apagada, sin consentimiento, o nadie navegó.',
      });
    }

    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      compare: previous
        ? { from: previous.from.toISOString(), to: previous.to.toISOString() }
        : null,
      tree: this.tree(registry),
      parts,
      unmapped: unmapped.slice(0, TOP_UNMAPPED),
      unmappedTotal: unmapped.length,
      notMeasured,
    };
  }

  async part(routeCode: string, query: PartsQuery, actor: AnalyticsActorScope) {
    const registry = await this.registry();
    const part = registry.byRouteCode(routeCode);
    if (!part) throw new NotFoundException('Parte no registrada');
    const scope = this.scope(query, actor);
    const portal = part.surface === 'MOBILE' ? 'MOBILE' : 'WEB';
    const [rows, series, sizes, actions, dwell, errs] = await Promise.all([
      this.usage.usageByRoute(scope),
      this.usage.viewsSeries(scope, part.routePattern),
      this.usage.screenSizes(scope, part.routePattern),
      this.usage.keyActions(scope, part.routePattern, 10),
      this.usage.dwellByRoute(scope),
      this.errors.fingerprints(
        {
          tenantId: actor.tenantId,
          window: scope.window,
          routes: [part.routePattern],
        },
        10,
      ),
    ]);
    const aScope = {
      tenantId: actor.tenantId,
      minSample: actor.minSample,
      window: scope.window,
      portalConceptId: scope.portalConceptId,
    };
    const { percentiles } = await this.analytics.webVitals(
      aScope,
      part.routePattern,
    );
    const mine = rows.filter(
      (r) => r.route === part.routePattern && r.portal === portal,
    );
    const total = mine.reduce(
      (a, r) => ({
        views: a.views + r.views,
        events: a.events + r.events,
        sessions: a.sessions + r.sessions,
        users: a.users + r.users,
        anonymous: a.anonymous + r.anonymous,
      }),
      { views: 0, events: 0, sessions: 0, users: 0, anonymous: 0 },
    );
    const d = dwell.find((x) => x.route === part.routePattern);
    const hiddenActions = actions.filter((a) =>
      this.small(actor, a.users),
    ).length;
    const hiddenSizes = sizes.filter((s) => this.small(actor, s.users)).length;
    const metricName = new Map<string, string>(
      VITALS.map(([n, id]) => [id, n]),
    );
    return {
      window: windowJson(scope.window, query.portal),
      scope: this.scopeView(actor),
      part: {
        routeCode: part.routeCode,
        routePattern: part.routePattern,
        pageTitle: part.pageTitle,
        surface: part.surface,
        domain: part.domain,
        status: part.active ? 'ACTIVE' : 'DEPRECATED',
      },
      totals: {
        ...total,
        users: this.small(actor, total.users) ? null : total.users,
        anonymousEvents: total.anonymous,
      },
      dwellMs: d
        ? {
            samples: this.small(actor, d.subjects) ? null : d.samples,
            p50: this.small(actor, d.subjects) ? null : num(d.p50),
            p75: this.small(actor, d.subjects) ? null : num(d.p75),
          }
        : null,
      viewsSeries: series.map((s) => ({
        bucket: iso(s.bucket),
        views: Number(s.views),
      })),
      screenSizes: sizes
        .filter((s) => !this.small(actor, s.users))
        .map((s) => ({ screenSize: s.screen_size, events: s.events })),
      keyActions: actions
        .filter((a) => !this.small(actor, a.users))
        .map((a) => ({ target: a.target, clicks: a.clicks })),
      vitals: percentiles.map((p) => ({
        metric: metricName.get(p.metric_concept_id) ?? p.metric_concept_id,
        samples: this.small(actor, p.subjects) ? null : p.samples,
        p50: this.small(actor, p.subjects) ? null : num(p.p50),
        p75: this.small(actor, p.subjects) ? null : num(p.p75),
        p95: this.small(actor, p.subjects) ? null : num(p.p95),
      })),
      recentErrors: errs.map((e) => ({
        fingerprint: e.fingerprint,
        errorType: e.error_type,
        sanitizedMessage: e.sanitized_message,
        count: e.count,
        lastSeen: iso(e.last_seen),
      })),
      notMeasured: [
        {
          metric: 'funnel',
          reason: 'Aún no hay embudos sembrados para esta parte.',
        },
        ...(hiddenActions + hiddenSizes > 0
          ? [
              {
                metric: 'minSample',
                reason: `${hiddenActions + hiddenSizes} grupo(s) con menos de ${actor.minSample} sujetos se suprimieron (alcance plataforma).`,
              },
            ]
          : []),
      ],
    };
  }
}
