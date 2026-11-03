import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReconciliationService } from './reconciliation.service';
import { BILL } from '../billing.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant dado, como lo
 * hace `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Puerto de `practice` de prueba: la práctica `pr1` es del tenant A y `pr-b`
 * del tenant B; cualquier otra no existe.
 *
 * @returns Doble de `PracticeTenantLookupService`.
 */
function buildLookup() {
  return {
    findTenantOfPractice: mockFn(async (practiceId: string) =>
      practiceId === 'pr1' ? TENANT_A : practiceId === 'pr-b' ? TENANT_B : null,
    ),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const paymentsReceivedRepo = { findById: mockFn() };
  const paymentsMadeRepo = { findById: mockFn() };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new ReconciliationService(
    em as any,
    paymentsReceivedRepo as any,
    paymentsMadeRepo as any,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    paymentsReceivedRepo,
    paymentsMadeRepo,
  };
}

describe('ReconciliationService (UC-17-07)', () => {
  it('reconciles the listed received payments', async () => {
    const d = build();
    const payment = {
      practiceId: 'pr1',
      clearingDocumentId: undefined,
      statusConceptId: BILL.PAYMENT_CLEARED,
      updatedAt: new Date(),
    };
    d.paymentsReceivedRepo.findById.mockResolvedValue(payment);

    const res = await d.service.clear(
      { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] },
      actor,
    );

    expect(res.reconciledReceived).toBe(1);
    expect(payment.clearingDocumentId).toBe('cd1');
    expect(payment.statusConceptId).toBe(BILL.PAYMENT_RECONCILED);
  });

  it('rejects when no payment id is provided', async () => {
    const d = build();
    await expect(
      d.service.clear({ clearingDocumentId: 'cd1' } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('throws when a payment does not exist', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['missing'] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects an already reconciled payment', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue({
      practiceId: 'pr1',
      clearingDocumentId: 'prev',
      statusConceptId: BILL.PAYMENT_RECONCILED,
    });
    await expect(
      d.service.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});

describe('ReconciliationService · alcance de tenant (BILL-01)', () => {
  /**
   * Captura el rechazo para inspeccionar status, reason y details.
   *
   * @param promise - Operación que debe fallar.
   * @returns La excepción lanzada.
   */
  async function rejection(promise: Promise<unknown>): Promise<any> {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error('Se esperaba un rechazo');
  }

  const received = (practiceId: string) => ({
    practiceId,
    clearingDocumentId: undefined,
    statusConceptId: BILL.PAYMENT_CLEARED,
    updatedAt: new Date(),
  });

  it('el pago recibido de B conciliado desde A responde como inexistente y no se altera', async () => {
    const foreign = build();
    const foreignPayment = received('pr-b');
    foreign.paymentsReceivedRepo.findById.mockResolvedValue(foreignPayment);
    const absent = build();
    absent.paymentsReceivedRepo.findById.mockResolvedValue(null);
    const dto = {
      clearingDocumentId: 'cd1',
      paymentReceivedIds: ['p1'],
    } as any;

    const a = await rejection(foreign.service.clear(dto, actor));
    const b = await rejection(absent.service.clear(dto, actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(
      BillingErrorReason.RECONCILIATION_PAYMENT_RECEIVED_NOT_FOUND,
    );
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreignPayment.clearingDocumentId).toBeUndefined();
    expect(foreignPayment.statusConceptId).toBe(BILL.PAYMENT_CLEARED);
  });

  it('un pago ajeno ya conciliado no delata su estado (no responde 422 de ya conciliado)', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue({
      ...received('pr-b'),
      clearingDocumentId: 'prev',
    });

    await expect(
      d.service.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.RECONCILIATION_PAYMENT_RECEIVED_NOT_FOUND,
    });
  });

  it('un pago ajeno en medio del lote no deja conciliados a los propios', async () => {
    const d = build();
    const own = received('pr1');
    d.paymentsReceivedRepo.findById
      .mockResolvedValueOnce(own)
      .mockResolvedValueOnce(received('pr-b'));

    await expect(
      d.service.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1', 'p2'] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(own.clearingDocumentId).toBeUndefined();
    expect(own.statusConceptId).toBe(BILL.PAYMENT_CLEARED);
  });

  it('el pago emitido de B conciliado desde A responde como inexistente', async () => {
    const d = build();
    const made = received('pr-b');
    d.paymentsMadeRepo.findById.mockResolvedValue(made);

    await expect(
      d.service.clear(
        { clearingDocumentId: 'cd1', paymentMadeIds: ['m1'] } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.RECONCILIATION_PAYMENT_MADE_NOT_FOUND,
    });
    expect(made.clearingDocumentId).toBeUndefined();
  });

  it('correcto: concilia pagos recibidos y emitidos de la práctica de A', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue(received('pr1'));
    d.paymentsMadeRepo.findById.mockResolvedValue(received('pr1'));

    const res = await d.service.clear(
      {
        clearingDocumentId: 'cd1',
        paymentReceivedIds: ['p1'],
        paymentMadeIds: ['m1'],
      } as any,
      actor,
    );

    expect(res.reconciledReceived).toBe(1);
    expect(res.reconciledMade).toBe(1);
  });

  it('el mismo pago de A es ajeno desde B', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue(received('pr1'));

    await expect(
      d.asTenantB.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('sin tenant en el contexto no concilia nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(
      d.raw.clear(
        { clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any,
        actor,
      ),
    );

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.paymentsReceivedRepo.findById).not.toHaveBeenCalled();
  });
});
