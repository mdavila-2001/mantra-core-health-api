import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PaymentsMadeService } from './payments-made.service';
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
  const paymentsRepo = { create: mockFn(), createAllocation: mockFn() };
  const billsRepo = { findById: mockFn(), findVendor: mockFn() };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new PaymentsMadeService(
    em as any,
    paymentsRepo as any,
    billsRepo as any,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    tx,
    paymentsRepo,
    billsRepo,
    lookup,
  };
}

describe('PaymentsMadeService (UC-17-05)', () => {
  it('executes the payment and updates each bill balance/status', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({
      id: 'pm1',
      amount: '100.00',
      statusConceptId: BILL.PAYMENT_EXECUTED,
    });
    const bill = {
      id: 'b1',
      practiceId: 'pr1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.BILL_APPROVED,
      updatedAt: new Date(),
    };
    d.billsRepo.findById.mockResolvedValue(bill);

    const res = await d.service.execute(
      {
        practiceId: 'pr1',
        amount: '100.00',
        allocations: [{ billId: 'b1', allocatedAmount: '100.00' }],
      },
      actor,
    );

    expect(res.id).toBe('pm1');
    expect(bill.statusConceptId).toBe(BILL.BILL_PAID);
    expect(d.paymentsRepo.createAllocation).toHaveBeenCalled();
  });

  it('rejects when allocated + withholding exceed the amount', async () => {
    const d = build();
    await expect(
      d.service.execute(
        {
          practiceId: 'pr1',
          amount: '100.00',
          allocations: [
            {
              billId: 'b1',
              allocatedAmount: '90.00',
              withholdingAmount: '20.00',
            },
          ],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('throws when a target bill does not exist', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({
      id: 'pm1',
      amount: '10.00',
      statusConceptId: BILL.PAYMENT_EXECUTED,
    });
    d.billsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.execute(
        {
          practiceId: 'pr1',
          amount: '10.00',
          allocations: [{ billId: 'missing', allocatedAmount: '10.00' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('PaymentsMadeService · alcance de tenant (BILL-01)', () => {
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

  const billOf = (practiceId: string) => ({
    id: 'b1',
    practiceId,
    balance: '100.00',
    paidTotal: '0.00',
    statusConceptId: BILL.BILL_APPROVED,
    updatedAt: new Date(),
  });

  const dtoFor = (practiceId: string, extra: Record<string, unknown> = {}) =>
    ({
      practiceId,
      amount: '100.00',
      allocations: [{ billId: 'b1', allocatedAmount: '100.00' }],
      ...extra,
    }) as any;

  it('correcto: el pago de la práctica de A sobre su bill actualiza saldo y estado', async () => {
    const d = build();
    const bill = billOf('pr1');
    d.paymentsRepo.create.mockReturnValue({ id: 'pm1', amount: '100.00' });
    d.billsRepo.findById.mockResolvedValue(bill);

    await d.service.execute(dtoFor('pr1'), actor);

    expect(bill.statusConceptId).toBe(BILL.BILL_PAID);
  });

  it('práctica T1 con bill de T2: 404 indistinguible de una inexistente, sin pago ni cambio de saldo', async () => {
    const foreign = build();
    const foreignBill = billOf('pr-b');
    foreign.billsRepo.findById.mockResolvedValue(foreignBill);
    const absent = build();
    absent.billsRepo.findById.mockResolvedValue(null);

    const a = await rejection(foreign.service.execute(dtoFor('pr1'), actor));
    const b = await rejection(absent.service.execute(dtoFor('pr1'), actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(BillingErrorReason.PAYMENT_MADE_BILL_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.paymentsRepo.create).not.toHaveBeenCalled();
    expect(foreign.paymentsRepo.createAllocation).not.toHaveBeenCalled();
    expect(foreignBill.balance).toBe('100.00');
  });

  it('una práctica de otro tenant en el cuerpo responde como una práctica inexistente', async () => {
    const d = build();

    const foreign = await rejection(d.service.execute(dtoFor('pr-b'), actor));
    const missing = await rejection(d.service.execute(dtoFor('pr-x'), actor));

    expect(foreign.reason).toBe(BillingErrorReason.BILLING_PRACTICE_NOT_FOUND);
    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.billsRepo.findById).not.toHaveBeenCalled();
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('un proveedor de otra práctica responde como un proveedor inexistente', async () => {
    const foreign = build();
    foreign.billsRepo.findVendor.mockResolvedValue({
      id: 'v1',
      practiceId: 'pr-b',
    });
    foreign.billsRepo.findById.mockResolvedValue(billOf('pr1'));
    const absent = build();
    absent.billsRepo.findVendor.mockResolvedValue(null);
    absent.billsRepo.findById.mockResolvedValue(billOf('pr1'));

    const a = await rejection(
      foreign.service.execute(dtoFor('pr1', { vendorId: 'v1' }), actor),
    );
    const b = await rejection(
      absent.service.execute(dtoFor('pr1', { vendorId: 'v1' }), actor),
    );

    expect(a.reason).toBe(BillingErrorReason.BILL_VENDOR_NOT_FOUND);
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('el mismo pago es válido en su tenant y ajeno desde B', async () => {
    const d = build();
    d.billsRepo.findById.mockResolvedValue(billOf('pr1'));

    await expect(
      d.asTenantB.execute(dtoFor('pr1'), actor),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.BILLING_PRACTICE_NOT_FOUND,
    });
  });

  it('sin tenant en el contexto no ejecuta nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.execute(dtoFor('pr1'), actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });
});

describe('PaymentsMadeService · importes (BILL-02)', () => {
  const bill = (balance: string) => ({
    id: 'b1',
    practiceId: 'pr1',
    balance,
    paidTotal: '0.00',
    statusConceptId: BILL.BILL_APPROVED,
    updatedAt: new Date(),
  });

  /**
   * Pago con una sola asignación.
   *
   * @param amount - Monto del pago.
   * @param allocation - Asignación (con descuento y retención opcionales).
   * @returns El cuerpo del pago.
   */
  const payment = (
    amount: string,
    allocation: {
      allocatedAmount: string;
      discountAmount?: string;
      withholdingAmount?: string;
    },
  ) =>
    ({
      practiceId: 'pr1',
      amount,
      allocations: [{ billId: 'b1', ...allocation }],
    }) as any;

  it('un descuento de 99 sobre un pago de 1 no cierra un bill de 100', async () => {
    const d = build();
    const b = bill('100.00');
    d.billsRepo.findById.mockResolvedValue(b);

    await expect(
      d.service.execute(
        payment('1.00', { allocatedAmount: '1.00', discountAmount: '99.00' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_MADE_ALLOCATION_EXCEEDS_AMOUNT,
    });
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
    expect(b.balance).toBe('100.00');
  });

  it.each(['-5.00', '0.00'])(
    'una asignación %s (no positiva) no pasa y no aumenta el saldo',
    async (allocatedAmount) => {
      const d = build();
      const b = bill('100.00');
      d.billsRepo.findById.mockResolvedValue(b);

      await expect(
        d.service.execute(payment('50.00', { allocatedAmount }), actor),
      ).rejects.toMatchObject({
        reason: BillingErrorReason.PAYMENT_MADE_ALLOCATION_AMOUNT_INVALID,
      });
      expect(b.balance).toBe('100.00');
      expect(d.paymentsRepo.create).not.toHaveBeenCalled();
    },
  );

  it('un descuento negativo se rechaza', async () => {
    const d = build();
    d.billsRepo.findById.mockResolvedValue(bill('100.00'));

    await expect(
      d.service.execute(
        payment('50.00', { allocatedAmount: '10.00', discountAmount: '-1.00' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_MADE_DISCOUNT_AMOUNT_INVALID,
    });
  });

  it('una retención negativa no libera cupo del pago y se rechaza', async () => {
    const d = build();
    d.billsRepo.findById.mockResolvedValue(bill('100.00'));

    await expect(
      d.service.execute(
        payment('50.00', {
          allocatedAmount: '50.00',
          withholdingAmount: '-20.00',
        }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_MADE_WITHHOLDING_AMOUNT_INVALID,
    });
  });

  it('asignación más descuento por encima del saldo del bill se rechaza, no se oculta con Math.max', async () => {
    const d = build();
    const b = bill('10.00');
    d.billsRepo.findById.mockResolvedValue(b);
    d.paymentsRepo.create.mockReturnValue({ id: 'pm1', amount: '100.00' });

    await expect(
      d.service.execute(
        payment('100.00', { allocatedAmount: '5.00', discountAmount: '6.00' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_MADE_ALLOCATION_EXCEEDS_BILL_BALANCE,
    });
    expect(d.paymentsRepo.createAllocation).not.toHaveBeenCalled();
    expect(b.balance).toBe('10.00');
  });

  it('límite: asignación más descuento iguales al saldo cierran el bill', async () => {
    const d = build();
    const b = bill('100.00');
    d.billsRepo.findById.mockResolvedValue(b);
    d.paymentsRepo.create.mockReturnValue({ id: 'pm1', amount: '100.00' });

    await d.service.execute(
      payment('100.00', { allocatedAmount: '90.00', discountAmount: '10.00' }),
      actor,
    );

    expect(b.balance).toBe('0.00');
    expect(b.statusConceptId).toBe(BILL.BILL_PAID);
  });
});
