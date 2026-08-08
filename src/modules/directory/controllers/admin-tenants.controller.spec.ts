import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AdminTenantsController } from './admin-tenants.controller';

const actor = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tenantsService = {
    provision: mockFn(),
    verify: mockFn(),
    suspend: mockFn(),
  };
  const readService = { searchTenants: mockFn() };
  const controller = new AdminTenantsController(
    tenantsService as any,
    readService as any,
  );
  return { controller, tenantsService, readService };
}

describe('AdminTenantsController', () => {
  it('delegates provision (UC-04-01)', async () => {
    const d = build();
    const dto = { code: 'ACME', legalName: 'Acme', ownerUserId: 'u1' };
    d.tenantsService.provision.mockResolvedValue({ id: 't1' });
    await expect(d.controller.provision(dto as any, actor)).resolves.toEqual({
      id: 't1',
    });
    expect(d.tenantsService.provision).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates verify (UC-04-02)', async () => {
    const d = build();
    await d.controller.verify('t1', {}, actor);
    expect(d.tenantsService.verify).toHaveBeenCalledWith('t1', {}, actor);
  });

  it('delegates suspend (UC-04-10)', async () => {
    const d = build();
    const dto = { reason: 'fraud' };
    await d.controller.suspend('t1', dto, actor);
    expect(d.tenantsService.suspend).toHaveBeenCalledWith('t1', dto, actor);
  });
});

describe('AdminTenantsController.searchTenants', () => {
  it('aplica el tope por defecto cuando el cliente no pide uno', async () => {
    const d = build();
    d.readService.searchTenants.mockResolvedValue({ items: [] });

    await d.controller.searchTenants();

    expect(d.readService.searchTenants).toHaveBeenCalledWith({
      query: undefined,
      statusConceptId: undefined,
      cursor: undefined,
      limit: 50,
    });
  });

  it('propaga texto, estado, cursor y tope tal como llegan', async () => {
    const d = build();
    d.readService.searchTenants.mockResolvedValue({ items: [] });

    await d.controller.searchTenants('acme', 'status-1', 'cursor-opaco', 10);

    expect(d.readService.searchTenants).toHaveBeenCalledWith({
      query: 'acme',
      statusConceptId: 'status-1',
      cursor: 'cursor-opaco',
      limit: 10,
    });
  });
});
