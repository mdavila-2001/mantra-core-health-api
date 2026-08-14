import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsOrdersController } from './diagnostics-orders.controller';
import { runWithTenant } from '../../../common';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { getPatientOrders: mockFn() };
  return {
    controller: new DiagnosticsOrdersController(service as any),
    service,
  };
}

describe('DiagnosticsOrdersController', () => {
  it('delega la lectura con el tenant del contexto', async () => {
    const d = build();

    await runWithTenant('t1', () => d.controller.getPatientOrders('p1', 10));

    expect(d.service.getPatientOrders).toHaveBeenCalledWith('t1', 'p1', 10);
  });

  it('aplica 50 como tope por omisión', async () => {
    const d = build();

    await runWithTenant('t1', () => d.controller.getPatientOrders('p1'));

    expect(d.service.getPatientOrders).toHaveBeenCalledWith('t1', 'p1', 50);
  });
});
