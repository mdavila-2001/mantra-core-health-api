import { jest } from '@jest/globals';
import { TelemetryPartsAnalyticsService } from './telemetry-parts-analytics.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const REG = [
  {
    routeCode: 'WEB.ATENCION.AGENDA',
    routePattern: '/agenda',
    pageTitle: 'Agenda',
    domain: 'Atención',
    surface: 'WEB',
    active: true,
  },
  {
    routeCode: 'WEB.ATENCION.AGENDA.CITAID',
    routePattern: '/agenda/:citaId',
    pageTitle: 'Cita',
    domain: 'Atención',
    surface: 'WEB',
    active: true,
  },
  {
    routeCode: 'MOBILE.APP.RAIZ',
    routePattern: '/',
    pageTitle: 'Inicio',
    domain: 'Aplicación móvil',
    surface: 'MOBILE',
    active: true,
  },
];
const row = (route: string | null, over: Record<string, unknown> = {}) => ({
  route,
  portal: 'WEB',
  views: 4,
  events: 9,
  sessions: 2,
  users: 2,
  anonymous: 1,
  ...over,
});

function build(usage: unknown[], errorRows: unknown[] = []) {
  const usageRepo = {
    usageByRoute: fn(async () => usage),
    dwellByRoute: fn(async () => []),
    errorsByRoute: fn(async () => errorRows),
  };
  const errorsRepo = { partsRegistry: fn(async () => REG) };
  const analytics = {
    webVitalsByRoute: fn(async () => []),
    webVitals: fn(async () => ({ percentiles: [], ratings: [] })),
  };
  return new TelemetryPartsAnalyticsService(
    usageRepo as never,
    errorsRepo as never,
    analytics as never,
  );
}
const Q = { from: '2026-10-01T00:00:00Z', to: '2026-10-08T00:00:00Z' };

describe('TelemetryPartsAnalyticsService.parts', () => {
  it('resuelve route_template → route_code y manda lo que no casa a unmapped', async () => {
    const svc = build(
      [row('/agenda'), row('/zzz', { views: 1 }), row(null, { views: 0 })],
      [{ route: '/agenda', errors: 2 }],
    );
    const res = await svc.parts(Q, { tenantId: 't1', platform: false });
    expect(res.parts.map((p) => p.routeCode)).toEqual(['WEB.ATENCION.AGENDA']);
    expect(res.parts[0]).toMatchObject({
      views: 4,
      users: 2,
      errors: 2,
      errorRate: 0.5,
    });
    expect(res.unmapped.map((u) => u.routeTemplate)).toEqual(['/zzz', null]);
    expect(res.unmappedTotal).toBe(2);
    expect(res.tree.map((t) => t.surface)).toEqual(['WEB', 'MOBILE']);
  });

  it('el portal MOBILE sólo casa con la superficie MOBILE', async () => {
    const svc = build([
      row('/', { portal: 'MOBILE' }),
      row('/', { portal: 'WEB' }),
    ]);
    const res = await svc.parts(Q, { tenantId: 't1', platform: false });
    expect(res.parts.map((p) => p.routeCode)).toEqual(['MOBILE.APP.RAIZ']);
    expect(res.unmapped).toHaveLength(1);
  });

  it('alcance plataforma: users y dwell bajo minSample salen null; en tenant, exactos', async () => {
    const svc = build([row('/agenda', { users: 3 })]);
    const platform = await svc.parts(Q, { platform: true, minSample: 5 });
    expect(platform.parts[0].users).toBeNull();
    expect(platform.scope).toEqual({
      level: 'platform',
      tenantId: null,
      minSample: 5,
    });
    expect(platform.notMeasured.map((n) => n.metric)).toContain('minSample');
    const tenant = await svc.parts(Q, { tenantId: 't1', platform: false });
    expect(tenant.parts[0].users).toBe(3);
  });

  it('compare=previous añade el periodo anterior por parte', async () => {
    const usage = jest.fn() as any;
    const svc = build([]);
    (svc as any).usage.usageByRoute = fn(
      async (_s: unknown, w?: { from: Date }) =>
        w ? [row('/agenda', { views: 1 })] : [row('/agenda', { views: 7 })],
    );
    void usage;
    const res = await svc.parts(
      { ...Q, compare: 'previous' },
      { tenantId: 't1', platform: false },
    );
    expect(res.parts[0]).toMatchObject({
      views: 7,
      previous: { views: 1, errors: 0 },
    });
    expect(res.compare).not.toBeNull();
  });

  it('registro vacío: lo declara en notMeasured en vez de inventar partes', async () => {
    const svc = build([row('/agenda')]);
    (svc as any).errors.partsRegistry = fn(async () => []);
    const res = await svc.parts(Q, { tenantId: 't1', platform: false });
    expect(res.parts).toEqual([]);
    expect(res.notMeasured.map((n) => n.metric)).toContain('partsRegistry');
  });

  it('una parte inexistente → 404', async () => {
    await expect(
      build([]).part('NO.EXISTE', Q, { tenantId: 't1', platform: false }),
    ).rejects.toThrow('Parte no registrada');
  });
});
