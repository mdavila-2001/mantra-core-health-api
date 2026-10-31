import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { PLATFORM_TENANT_OPTIONAL_KEY } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  INSIGHTS_PLATFORM_ROLES,
  INSIGHTS_READ_ROLES,
  INSIGHTS_WRITE_ROLES,
} from '../marketing.insights-access';
import { InsightsWorkflowController } from './insights-workflow.controller';
import { InsightsWorkspaceController } from './insights-workspace.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Método HTTP del handler (`RequestMethod`): GET 0, POST 1, PUT 2, DELETE 3, PATCH 4. */
const METHOD = { GET: 0, PUT: 2, DELETE: 3, PATCH: 4 } as const;

describe.each([
  ['InsightsWorkflowController', InsightsWorkflowController],
  ['InsightsWorkspaceController', InsightsWorkspaceController],
] as const)('autorización de /marketing/insights (%s)', (_name, Controller) => {
  const proto = Controller.prototype as unknown as Record<string, object>;
  const handlers = Object.getOwnPropertyNames(proto).filter(
    (name) => name !== 'constructor',
  );
  const meta = (key: string, handler: string) =>
    Reflect.getMetadata(key, proto[handler]) as unknown;
  const method = (handler: string) => meta('method', handler) as number;

  it('declara el opt-in de plataforma sin incluir MARKETING_MANAGER', () => {
    const declared = Reflect.getMetadata(
      PLATFORM_TENANT_OPTIONAL_KEY,
      Controller,
    ) as string[];
    expect(declared).toEqual([...INSIGHTS_PLATFORM_ROLES]);
    expect(declared).not.toContain('MARKETING_MANAGER');
  });

  it('ningún handler queda sin rol y todos usan los roles de Insights (nunca BUSINESS_ADMIN)', () => {
    expect(handlers.length).toBeGreaterThan(0);
    for (const handler of handlers) {
      const roles = meta(ROLES_KEY, handler) as string[] | undefined;
      expect(roles).toEqual(
        method(handler) === METHOD.GET
          ? [...INSIGHTS_READ_ROLES]
          : [...INSIGHTS_WRITE_ROLES],
      );
      expect(roles).not.toContain('BUSINESS_ADMIN');
    }
  });

  it('toda mutación lleva @Audited con acción y entidad; ninguna lectura lo lleva', () => {
    for (const handler of handlers) {
      const audited = meta(AUDITED_KEY, handler) as
        { action: string; entity: string } | undefined;
      if (method(handler) === METHOD.GET) {
        expect(audited).toBeUndefined();
      } else {
        expect(audited?.action).toMatch(/^MARKETING_INSIGHTS_[A-Z_]+$/);
        expect(audited?.entity).toMatch(/^insights_[a-z_]+$/);
      }
    }
  });
});

describe('InsightsWorkflowController · superficie', () => {
  const proto = InsightsWorkflowController.prototype as unknown as Record<
    string,
    object
  >;
  const route = (handler: string) => ({
    method: Reflect.getMetadata('method', proto[handler]) as number,
    path: Reflect.getMetadata('path', proto[handler]) as string,
  });

  it('expone exactamente las cuatro rutas del contrato', () => {
    expect(route('listWorkflow')).toEqual({
      method: METHOD.GET,
      path: 'alert-workflow',
    });
    expect(route('putWorkflow')).toEqual({
      method: METHOD.PUT,
      path: 'alert-workflow/:fingerprint',
    });
    expect(route('listRules')).toEqual({
      method: METHOD.GET,
      path: 'alert-rules',
    });
    expect(route('patchRule')).toEqual({
      method: METHOD.PATCH,
      path: 'alert-rules/:code',
    });
  });

  it('delega con el actor autenticado y la cabecera If-Match', async () => {
    const service = {
      putWorkflow: mockFn().mockResolvedValue({ data: 'w' }),
      patchRule: mockFn().mockResolvedValue({ data: 'r' }),
    };
    const controller = new InsightsWorkflowController(service as any);
    const actor = { id: 'u1', roles: [] } as any;
    const body = { status: 'resolved' } as any;
    await controller.putWorkflow('fp', body, '3', actor);
    expect(service.putWorkflow).toHaveBeenCalledWith('fp', body, '3', actor);
    await controller.patchRule('cac', { enabled: false }, '1', actor);
    expect(service.patchRule).toHaveBeenCalledWith(
      'cac',
      { enabled: false },
      '1',
      actor,
    );
  });
});

describe('InsightsWorkspaceController · superficie', () => {
  const proto = InsightsWorkspaceController.prototype as unknown as Record<
    string,
    object
  >;
  const route = (handler: string) => ({
    method: Reflect.getMetadata('method', proto[handler]) as number,
    path: Reflect.getMetadata('path', proto[handler]) as string,
  });

  it('expone las diez rutas del contrato', () => {
    expect(route('getNotificationPreferences')).toEqual({
      method: METHOD.GET,
      path: 'notification-preferences',
    });
    expect(route('putNotificationPreferences')).toEqual({
      method: METHOD.PUT,
      path: 'notification-preferences',
    });
    expect(route('getUserPreferences')).toEqual({
      method: METHOD.GET,
      path: 'user-preferences',
    });
    expect(route('putUserPreferences')).toEqual({
      method: METHOD.PUT,
      path: 'user-preferences',
    });
    expect(route('listSavedViews')).toEqual({
      method: METHOD.GET,
      path: 'saved-views',
    });
    expect(route('putSavedView')).toEqual({
      method: METHOD.PUT,
      path: 'saved-views/:id',
    });
    expect(route('deleteSavedView')).toEqual({
      method: METHOD.DELETE,
      path: 'saved-views/:id',
    });
    expect(route('listReports')).toEqual({
      method: METHOD.GET,
      path: 'reports',
    });
    expect(route('putReport')).toEqual({
      method: METHOD.PUT,
      path: 'reports/:id',
    });
    expect(route('deleteReport')).toEqual({
      method: METHOD.DELETE,
      path: 'reports/:id',
    });
  });

  it('ninguna ruta del espacio de trabajo recibe un userId: se toma del actor autenticado', async () => {
    const service = {
      listReports: mockFn().mockResolvedValue({ data: [] }),
      putReport: mockFn().mockResolvedValue({ data: 'r' }),
    };
    const controller = new InsightsWorkspaceController(service as any);
    const actor = { id: 'u1', roles: [] } as any;
    await controller.listReports(actor);
    expect(service.listReports).toHaveBeenCalledWith(actor);
    const id = '8b0f0d36-5e1c-4d2e-9c55-0f1d6f5a1c11';
    await controller.putReport(id, { title: 't' } as any, actor);
    expect(service.putReport).toHaveBeenCalledWith(id, { title: 't' }, actor);
    for (const handler of Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor',
    )) {
      expect(route(handler).path).not.toMatch(/:user/i);
    }
  });
});
