import { jest } from '@jest/globals';
import { TelemetryAnalyticsService } from './telemetry-analytics.service';
import { TelemetryAnalyticsController } from '../../presentation/controllers/telemetry-analytics.controller';
import { PLATFORM_SCOPE_OPTIONAL_KEY } from '../../../../common/tenant/platform-scope';
import { TELE } from '../../telemetry.concepts';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const Q = { from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z' };
const PLATFORM = { platform: true, minSample: 5 } as const;

/** UNA sola persona con muchas mediciones: el caso que k-anonimato debe suprimir. */
function onePersonRepo() {
  return {
    overview: fn(async () => ({
      totals: { events: 40, sessions: 1, subjects: 1, page_views: 40, last_event_at: null, sample: 1 },
      topRoutes: [{ route: '/a', events: 40, sessions: 1, sample: 1 }],
      topEvents: [{ event_name: 'clic', events: 40, sessions: 1, sample: 1 }],
    })),
    timeseries: fn(async () => [{ bucket: new Date('2026-10-01T10:00:00Z'), events: 40, sessions: 1, sample: 1 }]),
    webVitals: fn(async () => ({
      percentiles: [{ metric_concept_id: TELE.METRIC_LCP, samples: 40, subjects: 1, p50: '2000', p75: '2500', p95: '3000' }],
      ratings: [{ metric_concept_id: TELE.METRIC_LCP, rating_concept_id: TELE.RATING_GOOD, n: 40, subjects: 1 }],
    })),
    webVitalsByRoute: fn(async () => [{ route: '/a', samples: 40, subjects: 1, p75: '2500' }]),
    devices: fn(async () => ({
      totals: { contexts: 40, bots: 0, bot_unknown: 0, last_context_at: null },
      byDeviceType: [{ code: 'DESKTOP', label: 'Desktop', contexts: 40, sample: 1 }],
      byOsFamily: [], byBrowserFamily: [], byAppVersion: [{ code: '1', label: '1', contexts: 40, sample: 1 }],
    })),
  };
}

describe('k-anonimato: una persona con N mediciones queda suprimida en plataforma', () => {
  it('overview: totales, rutas y eventos suprimidos y declarados', async () => {
    const svc = new TelemetryAnalyticsService(onePersonRepo() as never);
    const res = await svc.overview(Q, PLATFORM);
    expect(res.totals).toBeNull();
    expect(res.topRoutes).toEqual([]);
    expect(res.topEvents).toEqual([]);
    expect(res.notMeasured.map((n) => n.metric)).toContain('totals');
  });

  it('timeseries: el cubo de una sola persona no entrega ni eventos ni sesiones', async () => {
    const svc = new TelemetryAnalyticsService(onePersonRepo() as never);
    const res = await svc.timeseries(Q, PLATFORM);
    expect(res.points[0]).toMatchObject({ events: null, sessions: null });
    expect(res.notMeasured[0].metric).toBe('minSample');
  });

  it('web-vitals: 40 mediciones de 1 persona -> samples, percentiles y ratings null; byRoute también', async () => {
    const svc = new TelemetryAnalyticsService(onePersonRepo() as never);
    const res = await svc.webVitals({ ...Q, metric: 'LCP' }, PLATFORM);
    expect(res.metrics[0]).toMatchObject({ samples: null, p50: null, p75: null, p95: null, ratings: null });
    expect(res.byRoute?.routes[0]).toMatchObject({ samples: null, p75: null });
    expect(res.notMeasured[0].metric).toBe('minSample');
  });

  it('devices: grupos de una persona suprimidos', async () => {
    const svc = new TelemetryAnalyticsService(onePersonRepo() as never);
    const res = await svc.devices(Q, PLATFORM);
    expect(res.byDeviceType).toEqual([]);
    expect(res.byAppVersion).toEqual([]);
    expect(res.notMeasured[0].metric).toBe('minSample');
  });

  it('con organización (tenant) lo mismo SÍ se muestra', async () => {
    const svc = new TelemetryAnalyticsService(onePersonRepo() as never);
    expect((await svc.overview(Q, 't1')).totals).not.toBeNull();
    expect((await svc.timeseries(Q, 't1')).points[0].events).toBe(40);
    expect((await svc.webVitals(Q, 't1')).metrics[0].p75).toBe(2500);
    expect((await svc.devices(Q, 't1')).byDeviceType).toHaveLength(1);
  });

  it('con 5 personas distintas el grupo sale', async () => {
    const repo = onePersonRepo();
    repo.webVitals = fn(async () => ({
      percentiles: [{ metric_concept_id: TELE.METRIC_LCP, samples: 40, subjects: 5, p50: '2000', p75: '2500', p95: '3000' }],
      ratings: [{ metric_concept_id: TELE.METRIC_LCP, rating_concept_id: TELE.RATING_GOOD, n: 40, subjects: 5 }],
    }));
    const res = await new TelemetryAnalyticsService(repo as never).webVitals(Q, PLATFORM);
    expect(res.metrics[0]).toMatchObject({ samples: 40, p75: 2500, ratings: { GOOD: 40 } });
  });
});

describe('pipeline-health no es de alcance plataforma', () => {
  const proto = TelemetryAnalyticsController.prototype as unknown as Record<string, object>;
  it('sin @PlatformScopeOptional (exige organización); los agregados sí lo llevan', () => {
    expect(Reflect.getMetadata(PLATFORM_SCOPE_OPTIONAL_KEY, proto.pipelineHealth)).toBeUndefined();
    for (const h of ['overview', 'timeseries', 'webVitals', 'devices']) {
      expect(Reflect.getMetadata(PLATFORM_SCOPE_OPTIONAL_KEY, proto[h])).toBe(true);
    }
    expect(Reflect.getMetadata(PLATFORM_SCOPE_OPTIONAL_KEY, TelemetryAnalyticsController)).toBeUndefined();
  });
});
