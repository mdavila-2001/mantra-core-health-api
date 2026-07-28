import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingOperationsController } from './billing-operations.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const ledgerService = { postToLedger: mockFn() };
  const reconciliationService = { clear: mockFn() };
  const dunningService = { execute: mockFn() };
  const kpiService = { compute: mockFn() };
  const controller = new BillingOperationsController(
    ledgerService as any,
    reconciliationService as any,
    dunningService as any,
    kpiService as any,
  );
  return {
    controller,
    ledgerService,
    reconciliationService,
    dunningService,
    kpiService,
  };
}

describe('BillingOperationsController', () => {
  it('delegates postToLedger (UC-17-06)', async () => {
    const d = build();
    const dto = { documentType: 'INVOICE', transactionId: 'txn1' };
    await d.controller.postToLedger('inv1', dto as any, actor);
    expect(d.ledgerService.postToLedger).toHaveBeenCalledWith(
      'inv1',
      dto,
      actor,
    );
  });

  it('delegates reconcile (UC-17-07)', async () => {
    const d = build();
    const dto = { clearingDocumentId: 'cd1' };
    await d.controller.reconcile(dto, actor);
    expect(d.reconciliationService.clear).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates executeDunning (UC-17-10)', async () => {
    const d = build();
    const dto = { tenantId: 't1', runNumber: 'R-1', items: [] };
    await d.controller.executeDunning(dto, actor);
    expect(d.dunningService.execute).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates computeKpi (UC-17-12)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1', kpiCode: 'DSO', valueNumeric: '1.0' };
    await d.controller.computeKpi(dto, actor);
    expect(d.kpiService.compute).toHaveBeenCalledWith(dto, actor);
  });
});
