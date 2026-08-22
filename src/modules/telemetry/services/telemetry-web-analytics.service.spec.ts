import { jest } from '@jest/globals';
import { TelemetryWebAnalyticsService } from './telemetry-web-analytics.service';
import type {
  WebAnalyticsHit,
  WebAnalyticsPort,
} from '../domain/web-analytics.port';

/**
 * Crea un mock tipado sin arrastrar las firmas de jest a cada llamada.
 *
 * @param impl - Implementación inicial opcional.
 * @returns Función mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Construye el servicio con un puerto controlado.
 *
 * @param options - Comportamiento del puerto.
 * @returns Servicio, envíos capturados y logger.
 */
function build(
  options: {
    /**
     * Comportamiento de `track`.
     */
    track?: any;
  } = {},
) {
  const hits: WebAnalyticsHit[] = [];
  const track =
    options.track ??
    mockFn(async (hit: WebAnalyticsHit) => {
      hits.push(hit);
      return {
        provider: 'fake',
        delivered: hit.events.length,
        dropped: 0,
        requests: 1,
      };
    });
  const analytics = { providerName: 'fake', track, health: mockFn() };
  const logger = { setContext: mockFn(), warn: mockFn(), error: mockFn() };
  const service = new TelemetryWebAnalyticsService(
    analytics as unknown as WebAnalyticsPort,
    logger as any,
  );
  return { service, hits, analytics, logger };
}

describe('TelemetryWebAnalyticsService', () => {
  it('forwards activity events with route and consent context', async () => {
    const d = build();
    const occurredAt = new Date('2026-08-17T10:00:00.000Z');

    d.service.trackActivityEvents(
      [
        {
          eventName: 'page_view',
          analyticsSubjectId: 'subject-1',
          sessionJourneyId: 'journey-1',
          routeTemplate: '/doctores/:id',
          occurredAt,
          consentGranted: true,
          properties: { specialty: 'cardio' },
        },
      ],
      { tenantId: 'tenant-1' },
    );
    await d.service.whenIdle();

    expect(d.hits).toHaveLength(1);
    expect(d.hits[0]).toMatchObject({
      identity: { subjectKey: 'subject-1', sessionKey: 'journey-1' },
      tenantId: 'tenant-1',
      consent: { analytics: true },
    });
    expect(d.hits[0].events[0]).toMatchObject({
      name: 'page_view',
      occurredAt,
      params: { specialty: 'cardio', route_template: '/doctores/:id' },
    });
  });

  it('never declares advertising consent while the deployment does not enable it', async () => {
    const d = build();
    d.service.trackActivityEvents([
      {
        eventName: 'page_view',
        analyticsSubjectId: 'subject-1',
        occurredAt: new Date(),
        consentGranted: true,
      },
    ]);
    await d.service.whenIdle();

    expect(d.hits[0].consent).toEqual({
      analytics: true,
      adUserData: false,
      adPersonalization: false,
    });
  });

  it('groups a mixed batch by visitor so nobody shares a request', async () => {
    const d = build();
    const occurredAt = new Date();

    d.service.trackActivityEvents([
      { eventName: 'a', analyticsSubjectId: 'subject-1', occurredAt },
      { eventName: 'b', analyticsSubjectId: 'subject-2', occurredAt },
      { eventName: 'c', analyticsSubjectId: 'subject-1', occurredAt },
    ]);
    await d.service.whenIdle();

    expect(d.hits).toHaveLength(2);
    expect(d.hits[0].events.map((event) => event.name)).toEqual(['a', 'c']);
    expect(d.hits[1].events.map((event) => event.name)).toEqual(['b']);
  });

  it('forwards web vitals with the conventional GA4 shape', async () => {
    const d = build();
    d.service.trackWebVitals([
      {
        metric: 'LCP',
        metricValue: 1234.7,
        rating: 'GOOD',
        routeTemplate: '/inicio',
        analyticsSubjectId: 'subject-1',
        measuredAt: new Date(),
      },
      {
        metric: 'CLS',
        metricValue: 0.1234,
        analyticsSubjectId: 'subject-1',
        measuredAt: new Date(),
      },
    ]);
    await d.service.whenIdle();

    const [lcp, cls] = d.hits[0].events;
    expect(lcp).toMatchObject({
      name: 'web_vitals',
      params: { metric_name: 'LCP', metric_value: 1235, metric_rating: 'GOOD' },
    });
    // CLS es una escala de 0 a ~1: redondearla como milisegundos la anularía.
    expect(cls.params?.metric_value).toBe(0.123);
  });

  it('forwards a conversion named after its funnel', async () => {
    const d = build();
    d.service.trackConversion({
      funnelCode: 'appointment_booked',
      funnelVersion: 3,
      analyticsSubjectId: 'subject-1',
      sessionJourneyId: 'journey-1',
      convertedAt: new Date(),
    });
    await d.service.whenIdle();

    expect(d.hits[0].events[0]).toMatchObject({
      name: 'appointment_booked',
      params: { funnel_code: 'appointment_booked', funnel_version: 3 },
    });
  });

  it('does not dispatch an empty batch', async () => {
    const d = build();
    d.service.trackActivityEvents([]);
    await d.service.whenIdle();
    expect(d.analytics.track).not.toHaveBeenCalled();
  });

  it('swallows an adapter that breaks its promise not to throw', async () => {
    const d = build({
      track: mockFn(async () => {
        throw new Error('provider exploded');
      }),
    });

    d.service.trackConversion({
      funnelCode: 'x',
      analyticsSubjectId: 'subject-1',
      convertedAt: new Date(),
    });

    await expect(d.service.whenIdle()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('logs dropped events so a silent misconfiguration is visible', async () => {
    const d = build({
      track: mockFn(async () => ({
        provider: 'fake',
        delivered: 0,
        dropped: 1,
        requests: 0,
        skipReason: 'NOT_CONFIGURED',
      })),
    });

    d.service.trackConversion({
      funnelCode: 'x',
      analyticsSubjectId: 'subject-1',
      convertedAt: new Date(),
    });
    await d.service.whenIdle();

    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('waits for in-flight dispatches on shutdown', async () => {
    let resolveTrack: (() => void) | undefined;
    const d = build({
      track: mockFn(
        async () =>
          new Promise((resolve) => {
            resolveTrack = () =>
              resolve({
                provider: 'fake',
                delivered: 1,
                dropped: 0,
                requests: 1,
              });
          }),
      ),
    });

    d.service.trackConversion({
      funnelCode: 'x',
      analyticsSubjectId: 'subject-1',
      convertedAt: new Date(),
    });
    let closed = false;
    const closing = d.service.onModuleDestroy().then(() => {
      closed = true;
    });

    await Promise.resolve();
    expect(closed).toBe(false);
    resolveTrack?.();
    await closing;
    expect(closed).toBe(true);
  });
});
