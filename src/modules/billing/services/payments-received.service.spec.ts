import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PaymentsReceivedService } from './payments-received.service';
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
  const invoicesRepo = {
    findById: mockFn(),
    // Carril 16: sin objeción abierta del paciente salvo que el caso la pida.
    hasOpenPatientObjection: mockFn().mockResolvedValue(false),
  };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new PaymentsReceivedService(
    em as any,
    paymentsRepo as any,
    invoicesRepo as any,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    tx,
    paymentsRepo,
    invoicesRepo,
    lookup,
  };
}

describe('PaymentsReceivedService (UC-17-02)', () => {
  it('applies the payment, allocates and updates each invoice balance/status', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({
      id: 'pay1',
      amount: '50.00',
      statusConceptId: BILL.PAYMENT_CLEARED,
    });
    const invoice = {
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.apply(
      {
        practiceId: 'pr1',
        amount: '50.00',
        allocations: [{ invoiceId: 'inv1', allocatedAmount: '50.00' }],
      },
      actor,
    );

    expect(res.id).toBe('pay1');
    expect(res.allocations).toHaveLength(1);
    expect(invoice.paidTotal).toBe('50.00');
    expect(invoice.balance).toBe('50.00');
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PARTIALLY_PAID);
    expect(d.paymentsRepo.createAllocation).toHaveBeenCalled();
  });

  describe('pausa por objeción del paciente (carril 16, REQ-16-032)', () => {
    const pausedInvoice = () => ({
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    });
    const payment = () => ({
      practiceId: 'pr1',
      amount: '50.00',
      allocations: [{ invoiceId: 'inv1', allocatedAmount: '50.00' }],
    });

    it('con una objeción abierta rechaza el cobro con 422 y no asigna nada', async () => {
      const d = build();
      d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
      const invoice = pausedInvoice();
      d.invoicesRepo.findById.mockResolvedValue(invoice);
      d.invoicesRepo.hasOpenPatientObjection.mockResolvedValue(true);

      const error = await d.service
        .apply(payment(), actor)
        .catch((e: any) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe('PAYMENT_RECEIVED_INVOICE_ON_HOLD');
      expect(error.details).toEqual({ invoiceId: 'inv1' });
      expect(d.paymentsRepo.createAllocation).not.toHaveBeenCalled();
      expect(invoice.paidTotal).toBe('0.00');
      expect(invoice.balance).toBe('100.00');
      expect(invoice.statusConceptId).toBe(BILL.INVOICE_ISSUED);
    });

    it('consulta la pausa de la factura dentro de la transacción del cobro', async () => {
      const d = build();
      d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
      d.invoicesRepo.findById.mockResolvedValue(pausedInvoice());

      await d.service.apply(payment(), actor);

      expect(d.invoicesRepo.hasOpenPatientObjection).toHaveBeenCalledWith(
        d.tx,
        'inv1',
      );
    });

    it('sin objeción abierta el cobro se aplica como siempre', async () => {
      const d = build();
      d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
      const invoice = pausedInvoice();
      d.invoicesRepo.findById.mockResolvedValue(invoice);

      await d.service.apply(payment(), actor);

      expect(d.paymentsRepo.createAllocation).toHaveBeenCalledTimes(1);
      expect(invoice.balance).toBe('50.00');
    });

    it('una factura inexistente sigue dando 404, no se mira la pausa', async () => {
      const d = build();
      d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
      d.invoicesRepo.findById.mockResolvedValue(null);

      await expect(d.service.apply(payment(), actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.invoicesRepo.hasOpenPatientObjection).not.toHaveBeenCalled();
    });
  });

  it('marks the invoice PAID when the balance reaches zero', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({
      id: 'pay1',
      amount: '100.00',
      statusConceptId: BILL.PAYMENT_CLEARED,
    });
    const invoice = {
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    await d.service.apply(
      {
        practiceId: 'pr1',
        amount: '100.00',
        allocations: [{ invoiceId: 'inv1', allocatedAmount: '100.00' }],
      },
      actor,
    );
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PAID);
  });

  it('rejects when the allocated sum exceeds the payment amount', async () => {
    const d = build();
    await expect(
      d.service.apply(
        {
          practiceId: 'pr1',
          amount: '10.00',
          allocations: [{ invoiceId: 'inv1', allocatedAmount: '50.00' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('throws when a target invoice does not exist', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({
      id: 'pay1',
      amount: '50.00',
      statusConceptId: BILL.PAYMENT_CLEARED,
    });
    d.invoicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.apply(
        {
          practiceId: 'pr1',
          amount: '50.00',
          allocations: [{ invoiceId: 'missing', allocatedAmount: '50.00' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('PaymentsReceivedService · alcance de tenant (BILL-01)', () => {
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

  const dtoFor = (practiceId: string, invoiceId = 'inv1') =>
    ({
      practiceId,
      amount: '50.00',
      allocations: [{ invoiceId, allocatedAmount: '50.00' }],
    }) as any;

  const invoiceOf = (practiceId: string) => ({
    id: 'inv1',
    practiceId,
    balance: '100.00',
    paidTotal: '0.00',
    statusConceptId: BILL.INVOICE_ISSUED,
    updatedAt: new Date(),
  });

  it('correcto: el cobro de la práctica de A sobre su factura crea pago y asignación', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr1'));

    const res = await d.service.apply(dtoFor('pr1'), actor);

    expect(res.id).toBe('pay1');
    expect(d.paymentsRepo.createAllocation).toHaveBeenCalledTimes(1);
  });

  it('práctica T1 con factura de T2: 404 indistinguible de una inexistente, sin pago ni cambio de saldo', async () => {
    const foreign = build();
    const foreignInvoice = invoiceOf('pr-b');
    foreign.invoicesRepo.findById.mockResolvedValue(foreignInvoice);
    const absent = build();
    absent.invoicesRepo.findById.mockResolvedValue(null);

    const a = await rejection(foreign.service.apply(dtoFor('pr1'), actor));
    const b = await rejection(absent.service.apply(dtoFor('pr1'), actor));

    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(
      BillingErrorReason.PAYMENT_RECEIVED_INVOICE_NOT_FOUND,
    );
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.paymentsRepo.create).not.toHaveBeenCalled();
    expect(foreign.paymentsRepo.createAllocation).not.toHaveBeenCalled();
    expect(foreignInvoice.balance).toBe('100.00');
    expect(foreignInvoice.paidTotal).toBe('0.00');
  });

  it('una práctica de otro tenant en el cuerpo responde como una práctica inexistente', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr-b'));

    const foreign = await rejection(d.service.apply(dtoFor('pr-b'), actor));
    const missing = await rejection(d.service.apply(dtoFor('pr-x'), actor));

    expect(foreign.getStatus()).toBe(404);
    expect(foreign.reason).toBe(BillingErrorReason.BILLING_PRACTICE_NOT_FOUND);
    expect(foreign.details).toBeUndefined();
    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.invoicesRepo.findById).not.toHaveBeenCalled();
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('el mismo cobro es válido en su tenant y ajeno desde B', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00' });
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr1'));

    await expect(d.asTenantB.apply(dtoFor('pr1'), actor)).rejects.toMatchObject(
      { reason: BillingErrorReason.BILLING_PRACTICE_NOT_FOUND },
    );
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('sin tenant en el contexto no aplica nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.apply(dtoFor('pr1'), actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });
});

describe('PaymentsReceivedService · importes (BILL-02)', () => {
  const invoice = (balance: string) => ({
    id: 'inv1',
    practiceId: 'pr1',
    balance,
    paidTotal: '0.00',
    statusConceptId: BILL.INVOICE_ISSUED,
    updatedAt: new Date(),
  });

  /**
   * Cobro con una sola asignación.
   *
   * @param amount - Monto del pago.
   * @param allocation - Asignación (con descuento opcional).
   * @returns El cuerpo del cobro.
   */
  const payment = (
    amount: string,
    allocation: { allocatedAmount: string; discountAmount?: string },
  ) =>
    ({
      practiceId: 'pr1',
      amount,
      allocations: [{ invoiceId: 'inv1', ...allocation }],
    }) as any;

  it('un descuento de 99 sobre un pago de 1 no cierra una factura de 100', async () => {
    const d = build();
    const inv = invoice('100.00');
    d.invoicesRepo.findById.mockResolvedValue(inv);

    await expect(
      d.service.apply(
        payment('1.00', { allocatedAmount: '1.00', discountAmount: '99.00' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_AMOUNT,
    });
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
    expect(inv.balance).toBe('100.00');
    expect(inv.statusConceptId).toBe(BILL.INVOICE_ISSUED);
  });

  it.each(['-5.00', '0', '0.00'])(
    'una asignación %s (no positiva) no pasa y no aumenta el saldo',
    async (allocatedAmount) => {
      const d = build();
      const inv = invoice('100.00');
      d.invoicesRepo.findById.mockResolvedValue(inv);

      await expect(
        d.service.apply(payment('50.00', { allocatedAmount }), actor),
      ).rejects.toMatchObject({
        reason: BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_AMOUNT_INVALID,
      });
      expect(d.paymentsRepo.create).not.toHaveBeenCalled();
      expect(inv.balance).toBe('100.00');
    },
  );

  it('un descuento negativo se rechaza', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue(invoice('100.00'));

    await expect(
      d.service.apply(
        payment('50.00', { allocatedAmount: '10.00', discountAmount: '-1.00' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.PAYMENT_RECEIVED_DISCOUNT_AMOUNT_INVALID,
    });
  });

  it.each(['1e3', '10.001', 'abc', '-1'])(
    'un monto malformado (%s) se rechaza como no positivo',
    async (amount) => {
      const d = build();

      await expect(
        d.service.apply(payment(amount, { allocatedAmount: '1.00' }), actor),
      ).rejects.toMatchObject({
        reason: BillingErrorReason.PAYMENT_RECEIVED_AMOUNT_NOT_POSITIVE,
      });
      expect(d.paymentsRepo.create).not.toHaveBeenCalled();
    },
  );

  it('asignación más descuento por encima del saldo de la factura se rechaza, no se oculta con Math.max', async () => {
    const d = build();
    const inv = invoice('10.00');
    d.invoicesRepo.findById.mockResolvedValue(inv);
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '100.00' });

    await expect(
      d.service.apply(
        payment('100.00', {
          allocatedAmount: '5.00',
          discountAmount: '6.00',
        }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason:
        BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE,
    });
    expect(d.paymentsRepo.createAllocation).not.toHaveBeenCalled();
    expect(inv.balance).toBe('10.00');
  });

  it('límite: asignación más descuento iguales al saldo y al pago cierran la factura', async () => {
    const d = build();
    const inv = invoice('100.00');
    d.invoicesRepo.findById.mockResolvedValue(inv);
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '100.00' });

    await d.service.apply(
      payment('100.00', { allocatedAmount: '90.00', discountAmount: '10.00' }),
      actor,
    );

    expect(inv.paidTotal).toBe('90.00');
    expect(inv.balance).toBe('0.00');
    expect(inv.statusConceptId).toBe(BILL.INVOICE_PAID);
  });

  it('dos asignaciones a la misma factura no superan su saldo entre las dos', async () => {
    const d = build();
    const inv = invoice('100.00');
    d.invoicesRepo.findById.mockResolvedValue(inv);
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '200.00' });

    await expect(
      d.service.apply(
        {
          practiceId: 'pr1',
          amount: '200.00',
          allocations: [
            { invoiceId: 'inv1', allocatedAmount: '60.00' },
            { invoiceId: 'inv1', allocatedAmount: '60.00' },
          ],
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason:
        BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE,
    });
  });
});
