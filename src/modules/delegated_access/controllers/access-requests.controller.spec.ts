import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AccessRequestsController } from './access-requests.controller';

const actor = { id: 'approver-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { decide: mockFn() };
  const controller = new AccessRequestsController(service as any);
  return { controller, service };
}

describe('AccessRequestsController', () => {
  it('delegates decide (UC-29-05)', async () => {
    const d = build();
    const dto = { decision: 'APPROVED' };
    await d.controller.decide('r1', dto as any, actor);
    expect(d.service.decide).toHaveBeenCalledWith('r1', dto, actor);
  });
});
