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
  runWithTenant,
} from '../../../common';
import { PaymentsErrorReason } from '../payments.error-reasons';

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
    findIntentForCheckout: mockFn(),
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

  /** Abre la sesión dentro del tenant activo de la petición. */
  const open = (
    d: ReturnType<typeof buildCheckout>,
    body: Record<string, unknown>,
    activeTenant = TENANT,
  ) =>
    runWithTenant(activeTenant, () =>
      d.service.openSession(body as any, actor as any),
    );

  it('opens the session, moves the debt to in-checkout and returns the token once', async () => {
    const d = buildCheckout();
    const debt = {
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    };
    d.flowRepo.findDebtForUpdate.mockResolvedValue(debt);
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    const res = await open(d, dto);

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

    await open(d, dto);

    expect(d.flowRepo.createCashierContext).not.toHaveBeenCalled();
  });

  it('registers the cashier context when the charge happens at a POS', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    });
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    await open(d, { ...dto, cashierUserId: actor.id });

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

    await expect(open(d, dto)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('throws when the debt does not exist', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue(null);

    await expect(open(d, dto)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('searches and locks the debt by id, active tenant and gateway connection', async () => {
    const d = buildCheckout();
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    });
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    await open(d, dto);

    expect(d.flowRepo.findDebtForUpdate).toHaveBeenCalledWith(d.tx, {
      id: dto.paymentDebtId,
      tenantId: TENANT,
      gatewayConnectionId: GATEWAY,
    });
    expect(d.flowRepo.createCheckoutSession.mock.calls[0][1]).toMatchObject({
      tenantId: TENANT,
      gatewayConnectionId: GATEWAY,
    });
  });

  it('answers a debt of another tenant exactly like a missing one and never touches it', async () => {
    const missing = buildCheckout();
    missing.flowRepo.findDebtForUpdate.mockResolvedValue(null);
    const foreign = buildCheckout();
    // El repositorio filtra por tenant: una deuda de T2 no se encuentra desde T1.
    foreign.flowRepo.findDebtForUpdate.mockResolvedValue(null);

    const a = await open(missing, dto).catch((e) => e);
    const b = await open(foreign, dto, TENANT).catch((e) => e);

    expect(b).toBeInstanceOf(ResourceNotFoundException);
    expect(b.getResponse()).toEqual(a.getResponse());
    expect(b.getResponse()).toMatchObject({
      reason: PaymentsErrorReason.PAYMENT_DEBT_NOT_FOUND,
    });
    expect(b.getResponse().details).toBeUndefined();
    expect(foreign.flowRepo.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('refuses a body tenantId that is not the active tenant, before any lookup', async () => {
    const d = buildCheckout();

    const attempt = open(d, dto, 'ffffffff-ffff-ffff-ffff-ffffffffffff');

    await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(attempt).rejects.toMatchObject({
      reason: PaymentsErrorReason.PAYMENTS_TENANT_MISMATCH,
    });
    expect(d.flowRepo.findDebtForUpdate).not.toHaveBeenCalled();
  });

  it('requires an active tenant', async () => {
    const d = buildCheckout();

    await expect(
      d.service.openSession(dto as any, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.flowRepo.findDebtForUpdate).not.toHaveBeenCalled();
  });

  it('verifies the optional intent belongs to the same tenant and connection', async () => {
    const d = buildCheckout();
    const intentId = '44444444-4444-4444-4444-444444444444';
    d.flowRepo.findDebtForUpdate.mockResolvedValue({
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    });
    d.flowRepo.findIntentForCheckout.mockResolvedValue({ id: intentId });
    d.flowRepo.createCheckoutSession.mockReturnValue({ id: 'session-1' });

    await open(d, { ...dto, paymentIntentId: intentId });

    expect(d.flowRepo.findIntentForCheckout).toHaveBeenCalledWith(d.tx, {
      id: intentId,
      tenantId: TENANT,
      gatewayConnectionId: GATEWAY,
    });
  });

  it('answers an intent of another tenant or connection as not found, leaving the debt untouched', async () => {
    const d = buildCheckout();
    const debt = {
      id: dto.paymentDebtId,
      statusConceptId: CONCEPTS.DEBT_PENDING,
    };
    d.flowRepo.findDebtForUpdate.mockResolvedValue(debt);
    d.flowRepo.findIntentForCheckout.mockResolvedValue(null);

    const attempt = open(d, {
      ...dto,
      paymentIntentId: '44444444-4444-4444-4444-444444444444',
    });

    await expect(attempt).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(attempt).rejects.toMatchObject({
      reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
    });
    expect(d.flowRepo.createCheckoutSession).not.toHaveBeenCalled();
    expect(debt.statusConceptId).toBe(CONCEPTS.DEBT_PENDING);
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

    it('derives the net exactly: 0.30 - 0.20 is 0.10 and large amounts keep every cent (PAY-01)', async () => {
      const d = buildOperations();
      d.operationsRepo.createPayout.mockReturnValue({ id: 'payout-1' });

      const small = await d.service.executePayout(
        {
          ...dto,
          items: [
            { ...dto.items[0], amount: '0.30', commissionAmount: '0.20' },
          ],
        },
        actor,
      );
      const large = await d.service.executePayout(
        {
          ...dto,
          items: [
            {
              ...dto.items[0],
              amount: '99999999999999.99',
              commissionAmount: '0',
            },
            { ...dto.items[1], amount: '0.01' },
          ],
        },
        actor,
      );

      expect(small.amount).toBe('0.10');
      expect(large.amount).toBe('100000000000000.00');
    });

    it('rounds the net half-up to the currency scale and rejects a net that rounds to zero', async () => {
      const d = buildOperations();
      d.operationsRepo.createPayout.mockReturnValue({ id: 'payout-1' });

      const rounded = await d.service.executePayout(
        {
          ...dto,
          items: [{ ...dto.items[0], amount: '1.005', commissionAmount: '0' }],
        },
        actor,
      );
      expect(rounded.amount).toBe('1.01');

      await expect(
        d.service.executePayout(
          {
            ...dto,
            items: [
              { ...dto.items[0], amount: '0.004', commissionAmount: '0' },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
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

    it('does not open an exception for 0.30 vs 0.30 and sums totals exactly (PAY-01)', async () => {
      const d = buildOperations();
      const run: any = { id: 'run-1' };
      d.operationsRepo.createReconciliationRun.mockReturnValue(run);
      d.transactionsRepo.findByGatewayRef
        .mockResolvedValueOnce({ id: 'txn-1', amount: '0.10' })
        .mockResolvedValueOnce({ id: 'txn-2', amount: '0.20' });
      const record = (ref: string, providerAmount: string) => ({
        externalTransactionId: ref,
        providerAmount,
        providerStatusCode: 'PAID',
        providerCurrencyCode: 'BOB' as const,
      });

      const res = await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [record('ref-1', '0.10'), record('ref-2', '0.20')],
        },
        actor,
      );

      expect(res.exceptionCount).toBe(0);
      expect(res.totalGateway).toBe('0.30');
      expect(res.totalLedger).toBe('0.30');
      expect(run.totalGateway).toBe('0.30');
    });

    it('persists 0.30 - 0.20 as exactly 0.10 when the figures differ', async () => {
      const d = buildOperations();
      d.operationsRepo.createReconciliationRun.mockReturnValue({ id: 'run-1' });
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        amount: '0.20',
      });

      await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [
            {
              externalTransactionId: 'ref-1',
              providerAmount: '0.30',
              providerStatusCode: 'PAID',
              providerCurrencyCode: 'BOB',
            },
          ],
        },
        actor,
      );

      expect(
        d.operationsRepo.createReconciliationException,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ amountDifference: '0.10' }),
      );
    });

    it('treats a difference of one millionth as a real mismatch, not as noise', async () => {
      const d = buildOperations();
      d.operationsRepo.createReconciliationRun.mockReturnValue({ id: 'run-1' });
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        amount: '100.000000',
      });

      const res = await d.service.runReconciliation(
        {
          ...base,
          providerRecords: [
            {
              externalTransactionId: 'ref-1',
              providerAmount: '100.000001',
              providerStatusCode: 'PAID',
              providerCurrencyCode: 'BOB',
            },
          ],
        },
        actor,
      );

      expect(res.exceptionCount).toBe(1);
      expect(
        d.operationsRepo.createReconciliationException,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ amountDifference: '0.000001' }),
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
