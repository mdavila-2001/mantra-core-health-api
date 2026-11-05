import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PLATFORM_TENANT_OPTIONAL_KEY } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  INSIGHTS_PLATFORM_ROLES,
  INSIGHTS_READ_ROLES,
} from '../marketing.insights-access';
import { InsightsFactsController } from './insights-facts.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('autorización de /marketing/insights (hechos y catálogo)', () => {
  const proto = InsightsFactsController.prototype as unknown as Record<
    string,
    object
  >;
  const handlers = Object.getOwnPropertyNames(proto).filter(
    (name) => name !== 'constructor',
  );
  const roles = (handler: string) =>
    Reflect.getMetadata(ROLES_KEY, proto[handler]) as string[] | undefined;

  it('expone solo dos lecturas: catalog y campaign-facts', () => {
    expect(handlers.sort()).toEqual(['campaignFacts', 'catalog']);
    for (const handler of handlers) {
      const method = Reflect.getMetadata('method', proto[handler]) as number;
      expect(method).toBe(0); // RequestMethod.GET
    }
  });

  it('ningún handler queda sin rol', () => {
    expect(handlers.filter((name) => !roles(name)?.length)).toEqual([]);
  });

  it('cada handler exige exactamente los roles de lectura de Insights', () => {
    for (const handler of handlers) {
      expect(roles(handler)).toEqual([...INSIGHTS_READ_ROLES]);
    }
    expect(INSIGHTS_READ_ROLES).toEqual([
      'MARKETING_MANAGER',
      'PLATFORM_ADMIN',
      'DATA_PLATFORM_ADMIN',
    ]);
    // Insights es del portal de marketing de plataforma: nunca del admin de negocio.
    expect(INSIGHTS_READ_ROLES).not.toContain('BUSINESS_ADMIN');
  });

  it('la clase declara el opt-in de plataforma sin tenant, sin incluir MARKETING_MANAGER', () => {
    const declared = Reflect.getMetadata(
      PLATFORM_TENANT_OPTIONAL_KEY,
      InsightsFactsController,
    ) as string[];
    expect(declared).toEqual([...INSIGHTS_PLATFORM_ROLES]);
    expect(declared).toEqual([
      'SUPERADMIN',
      'PLATFORM_ADMIN',
      'DATA_PLATFORM_ADMIN',
    ]);
    expect(declared).not.toContain('MARKETING_MANAGER');
  });

  it('delega en el servicio sin tocar el tenant', async () => {
    const service = {
      catalog: mockFn().mockResolvedValue({ data: 'catalogo' }),
      campaignFacts: mockFn().mockResolvedValue({ data: 'hechos' }),
    };
    const controller = new InsightsFactsController(service as any);
    const query = { from: '2026-10-01', to: '2026-10-29' };

    await expect(controller.catalog()).resolves.toEqual({ data: 'catalogo' });
    await expect(controller.campaignFacts(query)).resolves.toEqual({
      data: 'hechos',
    });
    expect(service.campaignFacts).toHaveBeenCalledWith(query);
  });
});
