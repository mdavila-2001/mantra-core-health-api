import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextFacilityLicensesController } from './orgext-facility-licenses.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const licensesService = { register: mockFn(), verify: mockFn() };
  const controller = new OrgextFacilityLicensesController(
    licensesService as any,
  );
  return { controller, licensesService };
}

describe('OrgextFacilityLicensesController', () => {
  it('delegates register (UC-22-05)', async () => {
    const d = build();
    const dto = { tenantId: 't1', licenseNumber: 'L-1' };
    d.licensesService.register.mockResolvedValue({ id: 'lic1' });
    await expect(d.controller.register(dto as any, actor)).resolves.toEqual({
      id: 'lic1',
    });
    expect(d.licensesService.register).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates verify (UC-22-06)', async () => {
    const d = build();
    const dto = { decision: 'VERIFY' };
    await d.controller.verify('lic1', dto as any, actor);
    expect(d.licensesService.verify).toHaveBeenCalledWith('lic1', dto, actor);
  });
});
