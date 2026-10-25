import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { runWithTenant } from '../../../common';
import {
  ANALYTICS_RAW_ROLES,
  ANALYTICS_READ_ROLES,
  TelemetryAnalyticsController,
} from './telemetry-analytics.controller';

describe('autorización de /admin/analytics', () => {
  const proto = TelemetryAnalyticsController.prototype as unknown as Record<
    string,
    object
  >;
  const roles = (handler: string) =>
    Reflect.getMetadata(ROLES_KEY, proto[handler]) as string[] | undefined;

  it('ningún handler queda sin rol', () => {
    const handlers = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor',
    );
    expect(handlers.filter((name) => !roles(name)?.length)).toEqual([]);
  });

  it('el timeline de sesión exige más que los agregados', () => {
    expect(roles('overview')).toEqual([...ANALYTICS_READ_ROLES]);
    expect(roles('getSession')).toEqual([...ANALYTICS_RAW_ROLES]);
    expect(roles('listSessions')).toEqual([...ANALYTICS_RAW_ROLES]);
    // Marketing ve agregados, no recorridos individuales.
    expect(ANALYTICS_RAW_ROLES).not.toContain('MARKETING_MANAGER');
  });
});

describe('alcance de tenant de /admin/analytics (TEL-04)', () => {
  /**
   * Ejecuta la operación mock fn.
   *
   * @param impl - Valor de impl requerido por la operación.
   * @returns Resultado de mock fn conforme al contrato `any`.
   */
  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
  const service = () => ({
    overview: mockFn(),
    timeseries: mockFn(),
    webVitals: mockFn(),
    listFunnels: mockFn(),
    funnelReport: mockFn(),
    pipelineHealth: mockFn(),
    listSessions: mockFn(),
    getSession: mockFn(),
  });

  it('pasa al servicio el tenant que resolvió el guard', () => {
    const analytics = service();
    const controller = new TelemetryAnalyticsController(analytics as any);

    runWithTenant('tenant-a', () => {
      void controller.overview({});
      void controller.timeseries({});
      void controller.webVitals({});
      void controller.funnelReport('f1', {});
      void controller.pipelineHealth({});
      void controller.listSessions({});
      void controller.getSession('s1');
    });

    expect(analytics.overview).toHaveBeenCalledWith({}, 'tenant-a');
    expect(analytics.timeseries).toHaveBeenCalledWith({}, 'tenant-a');
    expect(analytics.webVitals).toHaveBeenCalledWith({}, 'tenant-a');
    expect(analytics.funnelReport).toHaveBeenCalledWith('f1', {}, 'tenant-a');
    expect(analytics.pipelineHealth).toHaveBeenCalledWith({}, 'tenant-a');
    expect(analytics.listSessions).toHaveBeenCalledWith({}, 'tenant-a');
    expect(analytics.getSession).toHaveBeenCalledWith('s1', 'tenant-a');
  });

  it('sin tenant en el contexto no hay barrido global: 412 sin consultar', () => {
    const analytics = service();
    const controller = new TelemetryAnalyticsController(analytics as any);

    expect(() => controller.overview({})).toThrow(
      expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
    );
    expect(() => controller.getSession('s1')).toThrow(
      expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
    );
    expect(analytics.overview).not.toHaveBeenCalled();
    expect(analytics.getSession).not.toHaveBeenCalled();
  });
});
