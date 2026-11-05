import { jest } from '@jest/globals';
import { TelemetryAnalyticsService } from './telemetry-analytics.service';
import { ResourceNotFoundException } from '../../../../common';
import { TelemetryErrorReason } from '../../telemetry.error-reasons';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const WINDOW = {
  from: '2026-09-10T00:00:00.000Z',
  to: '2026-09-11T00:00:00.000Z',
};
const TENANT = 'tenant-a';

/**
 * Construye el servicio con un repositorio doblado.
 * @returns El servicio y el doble.
 */
function build() {
  const repo = {
    overview: mockFn().mockResolvedValue({
      totals: null,
      topRoutes: [],
      topEvents: [],
    }),
    timeseries: mockFn().mockResolvedValue([]),
    webVitals: mockFn().mockResolvedValue({ percentiles: [], ratings: [] }),
    webVitalsByRoute: mockFn().mockResolvedValue([]),
    listSessions: mockFn().mockResolvedValue([]),
    findSession: mockFn().mockResolvedValue(null),
    sessionTimeline: mockFn().mockResolvedValue([]),
    listFunnels: mockFn().mockResolvedValue([
      {
        id: 'f1',
        funnel_code: 'signup',
        name: 'Alta',
        version_number: 1,
        portal_type_concept_id: 'x',
        steps: [
          { stepNumber: 1, eventSchemaDefinitionId: 's1', eventName: 'a' },
        ],
      },
    ]),
    funnelReach: mockFn().mockResolvedValue([0]),
    serverConversions: mockFn().mockResolvedValue(0),
    pipelineHealth: mockFn().mockResolvedValue({ ingest: null, clients: null }),
  };
  return { service: new TelemetryAnalyticsService(repo as any), repo };
}

const scopeOf = (call: unknown[]) => call[0] as { tenantId: string };

describe('TelemetryAnalyticsService — alcance de tenant (TEL-04)', () => {
  it('cada lectura agregada pasa el tenant resuelto al repositorio', async () => {
    const d = build();

    await d.service.overview(WINDOW, TENANT);
    await d.service.timeseries(WINDOW, TENANT);
    await d.service.webVitals({ ...WINDOW, metric: 'LCP' }, TENANT);
    await d.service.listSessions(WINDOW, TENANT);
    await d.service.pipelineHealth(WINDOW, TENANT);

    expect(scopeOf(d.repo.overview.mock.calls[0]).tenantId).toBe(TENANT);
    expect(scopeOf(d.repo.timeseries.mock.calls[0]).tenantId).toBe(TENANT);
    expect(scopeOf(d.repo.webVitals.mock.calls[0]).tenantId).toBe(TENANT);
    expect(scopeOf(d.repo.webVitalsByRoute.mock.calls[0]).tenantId).toBe(
      TENANT,
    );
    expect(scopeOf(d.repo.listSessions.mock.calls[0]).tenantId).toBe(TENANT);
    expect(scopeOf(d.repo.pipelineHealth.mock.calls[0]).tenantId).toBe(TENANT);
  });

  it('el embudo y sus conversiones se calculan con el tenant', async () => {
    const d = build();

    await d.service.funnelReport('f1', WINDOW, TENANT);

    expect(d.repo.funnelReach.mock.calls[0][1]).toBe(TENANT);
    expect(d.repo.serverConversions.mock.calls[0][1]).toBe(TENANT);
  });

  it('la sesión se busca acotada al tenant y su timeline también', async () => {
    const d = build();
    d.repo.findSession.mockResolvedValue({
      id: 'j1',
      session_id: 'sess-1',
      portal_type_concept_id: 'x',
      journey_status_concept_id: 'y',
      started_at: null,
      ended_at: null,
      event_count: 0,
      has_subject: false,
    });

    await d.service.getSession('j1', TENANT);

    expect(d.repo.findSession).toHaveBeenCalledWith('j1', TENANT);
    expect(d.repo.sessionTimeline).toHaveBeenCalledWith('sess-1', TENANT);
  });

  it('una sesión fuera del tenant responde 404 con el reason catalogado, sin details y sin leer su timeline', async () => {
    const d = build();
    d.repo.findSession.mockResolvedValue(null);

    const error = await d.service.getSession('j-b', TENANT).catch((e) => e);

    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(error.getStatus()).toBe(404);
    expect(error.reason).toBe(TelemetryErrorReason.SESSION_OUT_OF_SCOPE);
    expect(error.details).toBeUndefined();
    expect(d.repo.sessionTimeline).not.toHaveBeenCalled();
  });
});
