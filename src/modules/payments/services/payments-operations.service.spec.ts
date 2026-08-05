import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PaymentsOperationsService } from './payments-operations.service';
import { PaymentsCheckoutService } from './payments-checkout.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const GATEWAY = '22222222-2222-2222-2222-222222222222';

/**
 * Crea build operations.
 * @returns Resultado de build operations.
 */
function buildOperations() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const operationsRepo = {
    createFeeSchedule: mockFn(),
    findFeeScheduleByCode: mockFn(),
    createSettlement: mockFn(),
    findSettlementByRef: mockFn(),
    createSettlementLine: mockFn(),
    createPayout: mockFn(),
    createPayoutItem: mockFn(),
    createReconciliationRun: mockFn(),
    createReconciliationRecord: mockFn(),
    createReconciliationException: mockFn(),
  };
  const transactionsRepo = {
    findByIdForUpdate: mockFn(),
    findByGatewayRef: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PaymentsOperationsService(
    em as any,
    operationsRepo as any,
    transactionsRepo as any,
    logger as any,
  );
  return { service, tx, operationsRepo, transactionsRepo };
}

/**
 * Crea build checkout.
 * @returns Resultado de build checkout.
 */
function buildCheckout() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const flowRepo = {
    findDebtForUpdate: mockFn(),
    createCheckoutSession: mockFn(),
    createCashierContext: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsCheckoutService(
    em as any,
    flowRepo as any,
    logger as any,
  );
  return { service, tx, flowRepo };
}

describe('PaymentsCheckoutService (UC-42-02)', () => {
  const dto = {
    tenantId: TENANT,
    gatewayConnectionId: GATEWAY,
    paymentDebtId: '33333333-3333-3333-3333-333333333333',
    redirectUrl: 'https://pay.example.test/session',
    expiresAt: '2026-12-31T00:00:00Z',
  };

  it('opens the session, moves the debt to in-checkout and returns the token once', async () => {
    const d = buildCheckout();
    const debt = {
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    };
    d.flowRepo.findDebtForUpdate.mockResolvedValue(debt);
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    const res = await d.service.openSession(dto, actor);

    expect(res.id).toBe('session-1');
    expect(res.sessionToken).toEqual(expect.any(String));
    expect(debt.statusConceptId).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
    // Solo se persiste el hash, nunca el token en claro.
    const persisted = d.flowRepo.createCheckoutSession.mock.calls[0][1];
    expect(persisted.sessionTokenHash).not.toBe(res.sessionToken);
    expect(persisted.sessionTokenHash).toHaveLength(64);
  });

  it('does not register a cashier context for an online payment', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    });
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    await d.service.openSession(dto, actor);

    expect(d.flowRepo.createCashierContext).not.toHaveBeenCalled();
  });

  it('registers the cashier context when the charge happens at a POS', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    });
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    await d.service.openSession({ ...dto, cashierUserId: actor.id }, actor);

    expect(d.flowRepo.createCashierContext).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        cashierUserId: actor.id,
        paymentCheckoutSessionId: 'session-1',
      }),
    );
  });

  it('rejects opening a second checkout for the same debt', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_IN_CHECKOUT,
    });

    await expect(
      d.service.openSession(dto, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('throws when the debt does not exist', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue(null);

    await expect(
      d.service.openSession(dto, actor as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('PaymentsOperationsService', () => {
  describe('createFeeSchedule (UC-42-10)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'GW-STD',
      name: 'Gateway estándar',
      feeType: 'GATEWAY' as const,
      method: 'PERCENTAGE' as const,
      percentage: '2.9',
    };

    it('supersedes the previous active version of the same code', async () => {
      const d = buildOperations();
      const current = { id: 'fee-old', stateConceptId: CONCEPTS.STATE_ACTIVE };
      d.operationsRepo.findFeeScheduleByCode.mockResolvedValue(current);
      d.operationsRepo.createFeeSchedule.mockReturnValue({ id: 'fee-new' });

      const res = await d.service.createFeeSchedule(dto, actor);

      expect(res.supersededId).toBe('fee-old');
      expect(current.stateConceptId).toBe(CONCEPTS.FEE_SUPERSEDED);
    });

    it('requires a percentage for percentage-based schedules', async () => {
      const d = buildOperations();
      await expect(
        d.service.createFeeSchedule(
          { ...dto, percentage: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('importSettlement (UC-42-12)', () => {
    const dto = {
      gatewayId: GATEWAY,
      settlementRef: 'STL-001',
      grossAmount: '1500.00',
      feeAmount: '46.50',
      netAmount: '1453.50',
      currency: 'BOB' as const,
      lines: [
        {
          paymentTransactionId: '44444444-4444-4444-4444-444444444444',
          amount: '150.00',
        },
      ],
    };

    it('imports the batch and marks the referenced transactions as settled', async () => {
      const d = buildOperations();
      d.operationsRepo.findSettlementByRef.mockResolvedValue(null);
      d.operationsRepo.createSettlement.mockReturnValue({ id: 'stl-1' });
      const transaction = {
        id: 'txn-1',
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      };
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue(transaction);

      const res = await d.service.importSettlement(dto, actor);

      expect(res.duplicate).toBe(false);
      expect(res.settledTransactions).toBe(1);
      expect(transaction.statusConceptId).toBe(CONCEPTS.TXN_SETTLED);
    });

    it('is idempotent: re-importing the same batch reference does not duplicate lines', async () => {
      const d = buildOperations();
      d.operationsRepo.findSettlementByRef.mockResolvedValue({
        id: 'stl-existing',
      });

      const res = await d.service.importSettlement(dto, actor);

      expect(res.duplicate).toBe(true);
      expect(d.operationsRepo.createSettlementLine).not.toHaveBeenCalled();
    });

    it('skips lines whose transaction is not present locally', async () => {
      const d = buildOperations();
      d.operationsRepo.findSettlementByRef.mockResolvedValue(null);
      d.operationsRepo.createSettlement.mockReturnValue({ id: 'stl-1' });
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue(null);

      const res = await d.service.importSettlement(dto, actor);

      expect(res.lineCount).toBe(1);
      expect(res.settledTransactions).toBe(0);
    });
  });

  describe('executePayout (UC-42-13)', () => {
    const dto = {
      tenantId: TENANT,
      payeeRefId: '55555555-5555-5555-5555-555555555555',
      gatewayId: GATEWAY,
      currency: 'BOB' as const,
      periodStart: '2026-01-01T00:00:00Z',
      periodEnd: '2026-01-31T00:00:00Z',
      items: [
        {
          sourceRefId: '44444444-4444-4444-4444-444444444444',
          amount: '100.00',
          commissionAmount: '5.00',
        },
        {
          sourceRefId: '66666666-6666-6666-6666-666666666666',
          amount: '200.00',
        },
      ],
    };

    it('derives the payout amount from its items net of commissions', async () => {
      const d = buildOperations();
      d.operationsRepo.createPayout.mockReturnValue({ id: 'payout-1' });

      const res = await d.service.executePayout(dto, actor);

      expect(res.amount).toBe('295.00');
      expect(res.itemCount).toBe(2);
      expect(d.operationsRepo.createPayoutItem).toHaveBeenCalledTimes(2);
    });

    it('rejects a payout whose net amount is not positive', async () => {
      const d = buildOperations();
      await expect(
        d.service.executePayout(
          {
            ...dto,
            items: [
              {
                sourceRefId: dto.items[0].sourceRefId,
                amount: '10.00',
                commissionAmount: '10.00',
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('runReconciliation (UC-42-14)', () => {
    const base = {
      tenantId: TENANT,
      gatewayId: GATEWAY,
      gatewayConnectionId: '77777777-7777-7777-7777-777777777777',
      periodStart: '2026-01-01T00:00:00Z',
      periodEnd: '2026-01-31T00:00:00Z',
    };

    it('matches records against the ledger and reports totals', async () => {
      const d = buildOperations();
      const run: any = { id: 'run-1' };
      d.operationsRepo.createReconciliationRun.mockReturnValue(run);
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        amount: '150.00',
      });

      const res = await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [
            {
              externalTransactionId: 'ref-1',
              providerAmount: '150.00',
              providerStatusCode: 'PAID',
              providerCurrencyCode: 'BOB',
            },
          ],
        },
        actor,
      );

      expect(res.matchedCount).toBe(1);
      expect(res.unmatchedCount).toBe(0);
      expect(res.exceptionCount).toBe(0);
      expect(res.totalGateway).toBe('150.00');
      expect(res.totalLedger).toBe('150.00');
    });

    it('opens an exception for a provider record with no local counterpart', async () => {
      const d = buildOperations();
      d.operationsRepo.createReconciliationRun.mockReturnValue({ id: 'run-1' });
      d.transactionsRepo.findByGatewayRef.mockResolvedValue(null);

      const res = await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [
            {
              externalTransactionId: 'orphan',
              providerAmount: '99.00',
              providerStatusCode: 'PAID',
              providerCurrencyCode: 'BOB',
            },
          ],
        },
        actor,
      );

      expect(res.unmatchedCount).toBe(1);
      expect(res.exceptionCount).toBe(1);
      expect(
        d.operationsRepo.createReconciliationException,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          exceptionTypeConceptId: CONCEPTS.RECON_EXC_MISSING_LEDGER,
        }),
      );
    });

    it('opens an amount-mismatch exception when the figures differ', async () => {
      const d = buildOperations();
      d.operationsRepo.createReconciliationRun.mockReturnValue({ id: 'run-1' });
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        amount: '140.00',
      });

      const res = await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [
            {
              externalTransactionId: 'ref-1',
              providerAmount: '150.00',
              providerStatusCode: 'PAID',
              providerCurrencyCode: 'BOB',
            },
          ],
        },
        actor,
      );

      expect(res.matchedCount).toBe(1);
      expect(res.exceptionCount).toBe(1);
      expect(
        d.operationsRepo.createReconciliationException,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          exceptionTypeConceptId: CONCEPTS.RECON_EXC_AMOUNT_MISMATCH,
          amountDifference: '10.00',
        }),
      );
    });
  });
});
