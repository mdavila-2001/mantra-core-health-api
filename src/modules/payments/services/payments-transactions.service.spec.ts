import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PaymentsTransactionsService } from './payments-transactions.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  signPayload,
} from '../../../common';
import { GatewayConnections } from '../entities';

/**
 * MCH-019: el callback se firma con el secreto de la conexión del gateway. En
 * estas pruebas la intención apunta a `conn-1`, cuya referencia es esta variable.
 */
const CONNECTION_SECRET = 'secreto-de-prueba-de-la-conexion-conn-1';
process.env.WEBHOOK_SECRET_UNIT_CONN_1 = CONNECTION_SECRET;

/** Firma un callback de gateway como lo haría el proveedor (secreto de la conexión). */
function signCallback(
  _gatewayId: string,
  body: {
    /**
     * Valor de gateway transaction ref mantenido por la instancia.
     */
    gatewayTransactionRef: string;
    /**
     * Valor de outcome mantenido por la instancia.
     */
    outcome: 'CAPTURED' | 'FAILED' | 'AUTHORIZED';
    /**
     * Valor de authorization code mantenido por la instancia.
     */
    authorizationCode?: string;
  },
): string {
  return signPayload(
    CONNECTION_SECRET,
    canonicalJson({
      gatewayTransactionRef: body.gatewayTransactionRef,
      outcome: body.outcome,
      authorizationCode: body.authorizationCode,
    }),
  );
}

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // Lecturas del resolvedor de secreto (MCH-019): la intención apunta a conn-1.
  const tx = {
    flush: mockFn(),
    findOne: mockFn((entity: unknown) =>
      Promise.resolve(
        entity === GatewayConnections
          ? {
              id: 'conn-1',
              gatewayId: 'gw-1',
              webhookSecretRef: 'env:WEBHOOK_SECRET_UNIT_CONN_1',
            }
          : { id: 'intent-1', gatewayConnectionId: 'conn-1' },
      ),
    ),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const intentsRepo = { findByIdForUpdate: mockFn() };
  const flowRepo = { findLatestRiskAssessment: mockFn() };
  const transactionsRepo = {
    create: mockFn(),
    findByIdForUpdate: mockFn(),
    findByGatewayRef: mockFn(),
    createRefund: mockFn(),
    findRefundsByTransaction: mockFn(),
    findPendingByIntent: mockFn(),
    createCancellation: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PaymentsTransactionsService(
    em as any,
    intentsRepo as any,
    flowRepo as any,
    transactionsRepo as any,
    logger as any,
  );
  return { service, tx, intentsRepo, flowRepo, transactionsRepo };
}

describe('PaymentsTransactionsService', () => {
  describe('processTransaction (UC-42-05)', () => {
    // MCH-003 (contención F01-T01): no hay adaptador de gateway, así que pedir
    // CAPTURE/SALE no mueve dinero. La transacción queda en proceso hasta que el
    // proveedor lo confirme con un callback firmado; nunca se fabrica el cobro.
    it('records the capture as processing and never closes the intent as succeeded', async () => {
      const d = build();
      const intent = {
        id: 'intent-1',
        gatewayId: 'gw-1',
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.PI_PENDING,
      };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      });
      d.transactionsRepo.create.mockReturnValue({
        id: 'txn-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      });
      d.transactionsRepo.findPendingByIntent.mockResolvedValue(null);

      const res = await d.service.processTransaction(
        'intent-1',
        { operation: 'CAPTURE' },
        actor,
      );

      expect(d.transactionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.TXN_PROCESSING }),
      );
      expect(res.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
      expect(intent.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
    });

    it('does not record a bare authorization as authorized either', async () => {
      const d = build();
      const intent = {
        id: 'intent-1',
        gatewayId: 'gw-1',
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.PI_PENDING,
      };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      });
      d.transactionsRepo.create.mockReturnValue({ id: 'txn-1' });
      d.transactionsRepo.findPendingByIntent.mockResolvedValue(null);

      await d.service.processTransaction(
        'intent-1',
        { operation: 'AUTHORIZE' },
        actor,
      );

      expect(d.transactionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.TXN_PROCESSING }),
      );
    });

    it('rejects a second operation while one is still awaiting the gateway', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        gatewayId: 'gw-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PROCESSING,
      });
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      });
      d.transactionsRepo.findPendingByIntent.mockResolvedValue({
        id: 'txn-0',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      });

      await expect(
        d.service.processTransaction('intent-1', { operation: 'SALE' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.transactionsRepo.create).not.toHaveBeenCalled();
    });

    it.each(['SALE', 'AUTHORIZE'] as const)(
      'rejects %s over an authorization the gateway already confirmed',
      async (operation) => {
        const d = build();
        d.intentsRepo.findByIdForUpdate.mockResolvedValue({
          id: 'intent-1',
          gatewayId: 'gw-1',
          amount: '150.00',
          statusConceptId: CONCEPTS.PI_PROCESSING,
        });
        d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
          decisionConceptId: CONCEPTS.RISK_APPROVE,
        });
        d.transactionsRepo.findPendingByIntent.mockResolvedValue({
          id: 'txn-0',
          statusConceptId: CONCEPTS.TXN_AUTHORIZED,
        });

        await expect(
          d.service.processTransaction('intent-1', { operation }, actor),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(d.transactionsRepo.create).not.toHaveBeenCalled();
      },
    );

    it('lets CAPTURE proceed over a confirmed authorization', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        gatewayId: 'gw-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PROCESSING,
      });
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      });
      d.transactionsRepo.findPendingByIntent.mockResolvedValue({
        id: 'txn-0',
        statusConceptId: CONCEPTS.TXN_AUTHORIZED,
      });
      d.transactionsRepo.create.mockReturnValue({ id: 'txn-1' });

      const res = await d.service.processTransaction(
        'intent-1',
        { operation: 'CAPTURE' },
        actor,
      );

      expect(res.id).toBe('txn-1');
      expect(d.transactionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.TXN_PROCESSING }),
      );
    });

    it('leaves the intent in processing after a bare authorization', async () => {
      const d = build();
      const intent = {
        id: 'intent-1',
        gatewayId: 'gw-1',
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.PI_PENDING,
      };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      });
      d.transactionsRepo.create.mockReturnValue({
        id: 'txn-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      });
      d.transactionsRepo.findPendingByIntent.mockResolvedValue(null);

      await d.service.processTransaction(
        'intent-1',
        { operation: 'AUTHORIZE' },
        actor,
      );

      expect(intent.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
    });

    it('refuses to charge without a risk assessment', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        statusConceptId: CONCEPTS.PI_PENDING,
      });
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue(null);

      await expect(
        d.service.processTransaction(
          'intent-1',
          { operation: 'SALE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to charge when risk declined the intent', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        statusConceptId: CONCEPTS.PI_PENDING,
      });
      d.flowRepo.findLatestRiskAssessment.mockResolvedValue({
        decisionConceptId: CONCEPTS.RISK_DECLINE,
      });

      await expect(
        d.service.processTransaction(
          'intent-1',
          { operation: 'SALE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects charging an intent that already succeeded', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        statusConceptId: CONCEPTS.PI_SUCCEEDED,
      });

      await expect(
        d.service.processTransaction(
          'intent-1',
          { operation: 'SALE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('applyCallback (UC-42-06)', () => {
    it('applies the outcome and propagates it to the intent', async () => {
      const d = build();
      const transaction = {
        id: 'txn-1',
        gatewayId: 'gw-1',
        paymentIntentId: 'intent-1',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      };
      const intent = {
        id: 'intent-1',
        statusConceptId: CONCEPTS.PI_PROCESSING,
      };
      d.transactionsRepo.findByGatewayRef.mockResolvedValue(transaction);
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);

      const body = {
        gatewayTransactionRef: 'ref-1',
        outcome: 'CAPTURED' as const,
      };
      const res = await d.service.applyCallback('libelula', {
        ...body,
        signature: signCallback('gw-1', body),
      });

      expect(res.duplicate).toBe(false);
      expect(transaction.statusConceptId).toBe(CONCEPTS.TXN_CAPTURED);
      expect(intent.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
    });

    it('rejects a callback with an invalid or missing signature (fail-closed)', async () => {
      const d = build();
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        gatewayId: 'gw-1',
        paymentIntentId: 'intent-1',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      });

      await expect(
        d.service.applyCallback('libelula', {
          gatewayTransactionRef: 'ref-1',
          outcome: 'CAPTURED',
          signature: 'deadbeef',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('is idempotent when the provider retries an already-applied callback', async () => {
      const d = build();
      d.transactionsRepo.findByGatewayRef.mockResolvedValue({
        id: 'txn-1',
        gatewayId: 'gw-1',
        paymentIntentId: 'intent-1',
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });

      const body = {
        gatewayTransactionRef: 'ref-1',
        outcome: 'CAPTURED' as const,
      };
      const res = await d.service.applyCallback('libelula', {
        ...body,
        signature: signCallback('gw-1', body),
      });

      expect(res.duplicate).toBe(true);
      expect(d.intentsRepo.findByIdForUpdate).not.toHaveBeenCalled();
    });

    it('throws when the reference does not correlate to a local transaction', async () => {
      const d = build();
      d.transactionsRepo.findByGatewayRef.mockResolvedValue(null);

      await expect(
        d.service.applyCallback('libelula', {
          gatewayTransactionRef: 'unknown',
          outcome: 'CAPTURED',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('refund (UC-42-08)', () => {
    // MCH-003-AC03: sin confirmación del gateway el reembolso queda pendiente.
    it('records a partial refund as pending, not completed', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });
      d.transactionsRepo.findRefundsByTransaction.mockResolvedValue([]);
      d.transactionsRepo.createRefund.mockReturnValue({ id: 'refund-1' });

      const res = await d.service.refund('txn-1', { amount: '50.00' }, actor);

      expect(res.amount).toBe('50.00');
      expect(res.statusConceptId).toBe(CONCEPTS.REFUND_PENDING);
      expect(d.transactionsRepo.createRefund).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.REFUND_PENDING }),
      );
    });

    it('ignores failed refunds when computing what is still refundable', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });
      d.transactionsRepo.findRefundsByTransaction.mockResolvedValue([
        { amount: '150.00', statusConceptId: CONCEPTS.REFUND_FAILED },
      ]);
      d.transactionsRepo.createRefund.mockReturnValue({ id: 'refund-2' });

      const res = await d.service.refund('txn-1', { amount: '150.00' }, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.REFUND_PENDING);
    });

    it('rejects refunding more than what was captured', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });
      d.transactionsRepo.findRefundsByTransaction.mockResolvedValue([
        { amount: '120.00', statusConceptId: CONCEPTS.REFUND_PENDING },
      ]);

      await expect(
        d.service.refund('txn-1', { amount: '50.00' }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects refunding a transaction that was never captured', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        amount: '150.00',
        statusConceptId: CONCEPTS.TXN_AUTHORIZED,
      });

      await expect(
        d.service.refund('txn-1', { amount: '10.00' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('requestCancellation (UC-42-09)', () => {
    const cancelDto = {
      tenantId: '11111111-1111-1111-1111-111111111111',
      gatewayConnectionId: '22222222-2222-2222-2222-222222222222',
      requestNumber: 'CAN-001',
    };

    // MCH-003-AC03: CANCEL_REQUESTED no significa VOIDED.
    it('records the request without voiding the transaction', async () => {
      const d = build();
      const transaction = {
        id: 'txn-1',
        statusConceptId: CONCEPTS.TXN_AUTHORIZED,
      };
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue(transaction);
      d.transactionsRepo.createCancellation.mockReturnValue({ id: 'cancel-1' });

      const res = await d.service.requestCancellation(
        'txn-1',
        cancelDto,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.CANCEL_REQUESTED);
      expect(transaction.statusConceptId).toBe(CONCEPTS.TXN_AUTHORIZED);
    });

    it('refuses to void a settled transaction and points to the refund path', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        statusConceptId: CONCEPTS.TXN_SETTLED,
      });

      await expect(
        d.service.requestCancellation('txn-1', cancelDto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('inquireStatus (UC-42-07)', () => {
    // MCH-003-AC01: sin adaptador, consultar PROCESSING no lo vuelve CAPTURED.
    it('does not turn a processing transaction into captured without a gateway', async () => {
      const d = build();
      const transaction = {
        id: 'txn-1',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
      };
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue(transaction);

      const res = await d.service.inquireStatus('txn-1', actor);

      expect(res.reconciled).toBe(false);
      expect(res.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
      expect(transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
    });

    it('leaves a terminal transaction untouched', async () => {
      const d = build();
      d.transactionsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'txn-1',
        statusConceptId: CONCEPTS.TXN_SETTLED,
      });

      const res = await d.service.inquireStatus('txn-1', actor);

      expect(res.reconciled).toBe(false);
      expect(res.statusConceptId).toBe(CONCEPTS.TXN_SETTLED);
    });
  });
});
