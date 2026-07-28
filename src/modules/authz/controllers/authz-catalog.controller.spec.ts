import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzCatalogController } from './authz-catalog.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const catalogService = {
    createCategory: mockFn(),
    createPermission: mockFn(),
  };
  const controller = new AuthzCatalogController(catalogService as any);
  return { controller, catalogService };
}

describe('AuthzCatalogController', () => {
  it('delegates createCategory (UC-06-01)', async () => {
    const d = build();
    const dto = { code: 'C', name: 'C' };
    d.catalogService.createCategory.mockResolvedValue({ id: 'c1' });
    await expect(
      d.controller.createCategory(dto as any, actor),
    ).resolves.toEqual({ id: 'c1' });
    expect(d.catalogService.createCategory).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createPermission (UC-06-01)', async () => {
    const d = build();
    const dto = { code: 'p.read', name: 'x', resource: 'p', action: 'READ' };
    await d.controller.createPermission(dto as any, actor);
    expect(d.catalogService.createPermission).toHaveBeenCalledWith(dto, actor);
  });
});
