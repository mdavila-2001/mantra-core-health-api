import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextAffiliationsController } from './orgext-affiliations.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const affiliationsService = { declare: mockFn(), terminate: mockFn() };
  const controller = new OrgextAffiliationsController(
    affiliationsService as any,
  );
  return { controller, affiliationsService };
}

describe('OrgextAffiliationsController', () => {
  it('delegates declare (UC-22-07)', async () => {
    const d = build();
    const dto = { primaryTenantId: 't1', participatingTenantId: 't2' };
    d.affiliationsService.declare.mockResolvedValue({ id: 'a1' });
    await expect(d.controller.declare(dto as any, actor)).resolves.toEqual({
      id: 'a1',
    });
    expect(d.affiliationsService.declare).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates terminate (UC-22-09)', async () => {
    const d = build();
    await d.controller.terminate('a1', actor);
    expect(d.affiliationsService.terminate).toHaveBeenCalledWith('a1', actor);
  });
});
