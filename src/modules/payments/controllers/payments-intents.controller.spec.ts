import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PaymentsIntentsController } from './payments-intents.controller';
import { PaymentsTransactionsController } from './payments-transactions.controller';
import { PaymentsOperationsController } from './payments-operations.controller';

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };
const INTENT_ID = '11111111-1111-1111-1111-111111111111';
const TXN_ID = '22222222-2222-2222-2222-222222222222';

/**
 * Los controladores se prueban aislados: interesa que deleguen con los argumentos
 * correctos y propaguen el resultado, no la lógica de negocio (ya cubierta en los
 * specs de servicio).
 */
describe('PaymentsIntentsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const intentsService = {
      createIntent: mockFn(),
      lockFxRate: mockFn(),
      assessRisk: mockFn(),
      addSplit: mockFn(),
    };
    const transactionsService = { processTransaction: mockFn() };
    const controller = new PaymentsIntentsController(
      intentsService as any,
      transactionsService as any,
    );
    return { controller, intentsService, transactionsService };
  }

  it('delegates intent creation with the authenticated actor (UC-42-01)', async () => {
    const d = build();
    const dto = { idempotencyKey: 'key-1' } as any;
    d.intentsService.createIntent.mockResolvedValue({ id: 'intent-1' });

    const res = await d.controller.createIntent(dto, actor);

    expect(d.intentsService.createIntent).toHaveBeenCalledWith(dto, actor);
    expect(res).toEqual({ id: 'intent-1' });
  });

  it('delegates the FX lock passing the route id (UC-42-03)', async () => {
    const d = build();
    const dto = { lockedRate: '6.96' } as any;
    d.intentsService.lockFxRate.mockResolvedValue({ id: 'fx-1' });

    await d.controller.lockFxRate(INTENT_ID, dto, actor);

    expect(d.intentsService.lockFxRate).toHaveBeenCalledWith(
      INTENT_ID,
      dto,
      actor,
    );
  });

  it('delegates the risk assessment (UC-42-04)', async () => {
    const d = build();
    const dto = { riskScore: '10', decision: 'APPROVE' } as any;
    d.intentsService.assessRisk.mockResolvedValue({ id: 'risk-1' });

    await d.controller.assessRisk(INTENT_ID, dto, actor);

    expect(d.intentsService.assessRisk).toHaveBeenCalledWith(
      INTENT_ID,
      dto,
      actor,
    );
  });

  it('delegates transaction processing to the transactions service (UC-42-05)', async () => {
    const d = build();
    const dto = { operation: 'CAPTURE' } as any;
    d.transactionsService.processTransaction.mockResolvedValue({ id: 'txn-1' });

    await d.controller.processTransaction(INTENT_ID, dto, actor);

    expect(d.transactionsService.processTransaction).toHaveBeenCalledWith(
      INTENT_ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.intentsService.addSplit.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.addSplit(INTENT_ID, {} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});

describe('PaymentsTransactionsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = {
      inquireStatus: mockFn(),
      refund: mockFn(),
      requestCancellation: mockFn(),
    };
    return {
      controller: new PaymentsTransactionsController(service as any),
      service,
    };
  }

  it('delegates the status inquiry (UC-42-07)', async () => {
    const d = build();
    d.service.inquireStatus.mockResolvedValue({ transactionId: TXN_ID });

    await d.controller.inquireStatus(TXN_ID, actor);

    expect(d.service.inquireStatus).toHaveBeenCalledWith(TXN_ID, actor);
  });

  it('delegates the refund (UC-42-08)', async () => {
    const d = build();
    const dto = { amount: '50.00' } as any;
    d.service.refund.mockResolvedValue({ id: 'refund-1' });

    await d.controller.refund(TXN_ID, dto, actor);

    expect(d.service.refund).toHaveBeenCalledWith(TXN_ID, dto, actor);
  });

  it('delegates the cancellation request (UC-42-09)', async () => {
    const d = build();
    const dto = { requestNumber: 'CAN-001' } as any;
    d.service.requestCancellation.mockResolvedValue({ id: 'cancel-1' });

    await d.controller.requestCancellation(TXN_ID, dto, actor);

    expect(d.service.requestCancellation).toHaveBeenCalledWith(
      TXN_ID,
      dto,
      actor,
    );
  });
});

describe('PaymentsOperationsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const checkoutService = { openSession: mockFn() };
    const transactionsService = { applyCallback: mockFn() };
    const operationsService = {
      createFeeSchedule: mockFn(),
      importSettlement: mockFn(),
      executePayout: mockFn(),
      runReconciliation: mockFn(),
    };
    const controller = new PaymentsOperationsController(
      checkoutService as any,
      transactionsService as any,
      operationsService as any,
    );
    return {
      controller,
      checkoutService,
      transactionsService,
      operationsService,
    };
  }

  it('delegates opening a checkout session (UC-42-02)', async () => {
    const d = build();
    const dto = { paymentDebtId: 'debt-1' } as any;
    d.checkoutService.openSession.mockResolvedValue({ id: 'session-1' });

    await d.controller.openCheckout(dto, actor);

    expect(d.checkoutService.openSession).toHaveBeenCalledWith(dto, actor);
  });

  it('applies the gateway callback without an authenticated actor (UC-42-06)', async () => {
    const d = build();
    const dto = { gatewayTransactionRef: 'ref-1', outcome: 'CAPTURED' } as any;
    d.transactionsService.applyCallback.mockResolvedValue({ duplicate: false });

    await d.controller.applyCallback('libelula', dto);

    expect(d.transactionsService.applyCallback).toHaveBeenCalledWith(
      'libelula',
      dto,
    );
  });

  it('delegates fee schedule publication (UC-42-10)', async () => {
    const d = build();
    const dto = { code: 'GW-STD' } as any;
    d.operationsService.createFeeSchedule.mockResolvedValue({ id: 'fee-1' });

    await d.controller.createFeeSchedule(dto, actor);

    expect(d.operationsService.createFeeSchedule).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates settlement import (UC-42-12)', async () => {
    const d = build();
    const dto = { settlementRef: 'STL-001' } as any;
    d.operationsService.importSettlement.mockResolvedValue({ id: 'stl-1' });

    await d.controller.importSettlement(dto, actor);

    expect(d.operationsService.importSettlement).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates payout execution (UC-42-13)', async () => {
    const d = build();
    const dto = { payeeRefId: 'acc-1' } as any;
    d.operationsService.executePayout.mockResolvedValue({ id: 'payout-1' });

    await d.controller.executePayout(dto, actor);

    expect(d.operationsService.executePayout).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the reconciliation run (UC-42-14)', async () => {
    const d = build();
    const dto = { gatewayId: 'gw-1' } as any;
    d.operationsService.runReconciliation.mockResolvedValue({ id: 'run-1' });

    await d.controller.runReconciliation(dto, actor);

    expect(d.operationsService.runReconciliation).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});
