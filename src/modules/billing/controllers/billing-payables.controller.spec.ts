import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingPayablesController } from './billing-payables.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const billsService = { register: mockFn() };
  const paymentsMadeService = { execute: mockFn() };
  const controller = new BillingPayablesController(
    billsService as any,
    paymentsMadeService as any,
  );
  return { controller, billsService, paymentsMadeService };
}

describe('BillingPayablesController', () => {
  it('delegates registerBill (UC-17-04)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1', vendorId: 'v1', billNumber: 'B-1' };
    d.billsService.register.mockResolvedValue({ id: 'b1' });
    await expect(d.controller.registerBill(dto as any, actor)).resolves.toEqual(
      { id: 'b1' },
    );
    expect(d.billsService.register).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates executePayment (UC-17-05)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1', amount: '10.00' };
    await d.controller.executePayment(dto as any, actor);
    expect(d.paymentsMadeService.execute).toHaveBeenCalledWith(dto, actor);
  });
});
