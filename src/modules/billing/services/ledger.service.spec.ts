import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { LedgerService } from './ledger.service';
import {
  ConflictException,
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
  const invoicesRepo = { findById: mockFn() };
  const billsRepo = { findById: mockFn() };
  const paymentsReceivedRepo = { findById: mockFn() };
  const paymentsMadeRepo = { findById: mockFn() };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new LedgerService(
    em as any,
    invoicesRepo as any,
    billsRepo as any,
    paymentsReceivedRepo as any,
    paymentsMadeRepo as any,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    invoicesRepo,
    billsRepo,
    paymentsReceivedRepo,
    paymentsMadeRepo,
  };
}

describe('LedgerService (UC-17-06)', () => {
  it('posts an invoice by setting its transaction id', async () => {
    const d = build();
    const invoice = {
      practiceId: 'pr1',
      transactionId: undefined,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.postToLedger(
      'inv1',
      { documentType: 'INVOICE', transactionId: 'txn1' } as any,
      actor,
    );

    expect(res.posted).toBe(true);
    expect(res.transactionId).toBe('txn1');
    expect(invoice.transactionId).toBe('txn1');
  });

  it('throws when the document does not exist', async () => {
    const d = build();
    d.billsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.postToLedger(
        'b1',
        { documentType: 'BILL', transactionId: 'txn1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects re-posting an already posted document (conflict / idempotency)', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue({
      practiceId: 'pr1',
      transactionId: 'existing',
      updatedAt: new Date(),
    });
    await expect(
      d.service.postToLedger(
        'p1',
        { documentType: 'PAYMENT_RECEIVED', transactionId: 'txn1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('LedgerService · alcance de tenant (BILL-01)', () => {
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

  const dto = { documentType: 'INVOICE', transactionId: 'txn1' } as any;

  it('el documento de B contabilizado desde A responde como inexistente y no se ancla', async () => {
    const foreign = build();
    const foreignInvoice = {
      practiceId: 'pr-b',
      transactionId: undefined,
      updatedAt: new Date(),
    };
    foreign.invoicesRepo.findById.mockResolvedValue(foreignInvoice);
    const absent = build();
    absent.invoicesRepo.findById.mockResolvedValue(null);

    const a = await rejection(foreign.service.postToLedger('inv1', dto, actor));
    const b = await rejection(absent.service.postToLedger('inv1', dto, actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(BillingErrorReason.LEDGER_DOCUMENT_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreignInvoice.transactionId).toBeUndefined();
  });

  it('un documento ajeno ya contabilizado no delata su estado (404, no 409)', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue({
      practiceId: 'pr-b',
      transactionId: 'existing',
      updatedAt: new Date(),
    });

    await expect(
      d.service.postToLedger('inv1', dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it.each(['BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'] as const)(
    'el documento %s de B responde como inexistente',
    async (documentType) => {
      const d = build();
      const foreign = {
        practiceId: 'pr-b',
        transactionId: undefined,
        updatedAt: new Date(),
      };
      d.billsRepo.findById.mockResolvedValue(foreign);
      d.paymentsReceivedRepo.findById.mockResolvedValue(foreign);
      d.paymentsMadeRepo.findById.mockResolvedValue(foreign);

      await expect(
        d.service.postToLedger(
          'doc1',
          { documentType, transactionId: 't' } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: BillingErrorReason.LEDGER_DOCUMENT_NOT_FOUND,
      });
      expect(foreign.transactionId).toBeUndefined();
    },
  );

  it('el documento de A es ajeno desde B', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue({
      practiceId: 'pr1',
      transactionId: undefined,
      updatedAt: new Date(),
    });

    await expect(
      d.asTenantB.postToLedger('inv1', dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('sin tenant en el contexto no contabiliza nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.postToLedger('inv1', dto, actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.invoicesRepo.findById).not.toHaveBeenCalled();
  });
});
