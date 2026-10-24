import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { InvoicesService } from './invoices.service';
import { BILL } from '../billing.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT_A = 'tenant-1';
const TENANT_B = 'tenant-b';

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
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const invoicesRepo = {
    findByNumber: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    createLine: mockFn(),
    findByPracticePage: mockFn().mockResolvedValue([]),
    findLinesByInvoice: mockFn().mockResolvedValue([]),
  };
  const linksRepo = { create: mockFn() };
  const practiceTenantLookup = {
    findTenantOfPractice: mockFn().mockResolvedValue('tenant-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new InvoicesService(
    em as any,
    invoicesRepo as any,
    linksRepo,
    practiceTenantLookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    tx,
    em,
    invoicesRepo,
    linksRepo,
    practiceTenantLookup,
  };
}

describe('InvoicesService', () => {
  describe('issueFromEncounter (UC-17-01)', () => {
    it('creates the invoice, flushes before lines and records the encounter link', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue(null);
      const invoice = {
        id: 'inv1',
        invoiceNumber: 'INV-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_ISSUED,
        total: '200.00',
        balance: '200.00',
      };
      d.invoicesRepo.create.mockReturnValue(invoice);

      const res = await d.service.issueFromEncounter(
        {
          practiceId: 'pr1',
          patientProfileId: 'p1',
          encounterId: 'e1',
          tenantId: 't1',
          lines: [
            { quantity: '1', unitPrice: '100.00' },
            { quantity: '1', unitPrice: '100.00' },
          ],
        },
        actor,
      );

      expect(res.id).toBe('inv1');
      expect(res.lineCount).toBe(2);
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.invoicesRepo.createLine).toHaveBeenCalledTimes(2);
      expect(d.linksRepo.create).toHaveBeenCalled();
    });

    it('rechaza una factura que declara un reclamo a la aseguradora (carril 16, REQ-16-029)', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue(null);

      const error = await d.service
        .issueFromEncounter(
          {
            practiceId: 'pr1',
            patientProfileId: 'p1',
            tenantId: 't1',
            claimId: '00000000-0000-4000-8000-000000000001',
            lines: [{ quantity: '1', unitPrice: '500.00' }],
          } as any,
          actor,
        )
        .catch((e: any) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe('INVOICE_LINE_SERVICE_ALREADY_CLAIMED');
      expect(error.details).toEqual({
        claimId: '00000000-0000-4000-8000-000000000001',
      });
      // Se rechaza antes de abrir transacción: no se crea ni se vincula nada.
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.invoicesRepo.create).not.toHaveBeenCalled();
      expect(d.linksRepo.create).not.toHaveBeenCalled();
    });

    it('sin reclamo declarado la factura se emite como siempre', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue(null);
      d.invoicesRepo.create.mockReturnValue({
        id: 'inv1',
        invoiceNumber: 'INV-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_ISSUED,
        total: '100.00',
        balance: '100.00',
      });

      const res = await d.service.issueFromEncounter(
        {
          practiceId: 'pr1',
          patientProfileId: 'p1',
          lines: [{ quantity: '1', unitPrice: '100.00' }],
        } as any,
        actor,
      );

      expect(res.id).toBe('inv1');
    });

    it('rejects a duplicate invoice number (conflict)', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue({ id: 'other' });
      await expect(
        d.service.issueFromEncounter(
          {
            practiceId: 'pr1',
            patientProfileId: 'p1',
            invoiceNumber: 'DUP',
            lines: [{ quantity: '1', unitPrice: '1' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.invoicesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('creditNote (UC-17-03)', () => {
    it('throws when the original invoice does not exist', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.creditNote(
          'missing',
          { reason: 'x', lines: [{ quantity: '1', unitPrice: '1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the credit exceeds the balance and is not a write-off', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        balance: '10.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
      });
      await expect(
        d.service.creditNote(
          'inv1',
          {
            reason: 'x',
            lines: [{ quantity: '1', unitPrice: '100.00' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('issues the credit note and adjusts the original balance', async () => {
      const d = build();
      const original = {
        id: 'inv1',
        balance: '100.00',
        statusConceptId: BILL.INVOICE_ISSUED,
        practiceId: 'pr1',
        patientProfileId: 'p1',
        updatedAt: new Date(),
      };
      d.invoicesRepo.findById.mockResolvedValue(original);
      d.invoicesRepo.create.mockReturnValue({
        id: 'nc1',
        invoiceNumber: 'NC-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_CREDIT_NOTE,
      });

      const res = await d.service.creditNote(
        'inv1',
        {
          reason: 'x',
          tenantId: 't1',
          lines: [{ quantity: '1', unitPrice: '40.00' }],
        },
        actor,
      );

      expect(res.id).toBe('nc1');
      expect(original.balance).toBe('60.00');
      expect(original.statusConceptId).toBe(BILL.INVOICE_ADJUSTED);
      expect(d.linksRepo.create).toHaveBeenCalled();
    });
  });

  describe('createPaymentPlan (UC-17-11)', () => {
    it('rejects when installments do not sum the balance', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        balance: '100.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
        invoiceNumber: 'INV-1',
      });
      await expect(
        d.service.createPaymentPlan(
          {
            sourceInvoiceId: 'inv1',
            installments: [{ dueDate: '2026-01-01', amount: '40.00' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates one child invoice per installment and flips the source to payment plan', async () => {
      const d = build();
      const source = {
        id: 'inv1',
        balance: '100.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
        invoiceNumber: 'INV-1',
        statusConceptId: BILL.INVOICE_ISSUED,
        updatedAt: new Date(),
      };
      d.invoicesRepo.findById.mockResolvedValue(source);
      d.invoicesRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `c-${data.invoiceNumber}`,
        invoiceNumber: data.invoiceNumber,
        total: data.total,
        dueDate: data.dueDate,
      }));

      const res = await d.service.createPaymentPlan(
        {
          sourceInvoiceId: 'inv1',
          tenantId: 't1',
          installments: [
            { dueDate: '2026-01-01', amount: '50.00' },
            { dueDate: '2026-02-01', amount: '50.00' },
          ],
        },
        actor,
      );

      expect(res.installmentCount).toBe(2);
      expect(source.statusConceptId).toBe(BILL.INVOICE_PAYMENT_PLAN);
      expect(d.linksRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('listByPractice (CV-12)', () => {
    it('pages by id and returns a cursor when there is more', async () => {
      const d = build();
      const row = (id: string) => ({
        id,
        invoiceNumber: id,
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_ISSUED,
        issueDate: new Date('2026-01-01'),
        total: '10.00',
        balance: '10.00',
        createdAt: new Date('2026-01-01'),
      });
      d.invoicesRepo.findByPracticePage.mockResolvedValue([row('a'), row('b')]);

      const res = await d.service.listByPractice('pr1', 'tenant-1', {
        limit: 1,
      });

      expect(d.practiceTenantLookup.findTenantOfPractice).toHaveBeenCalledWith(
        'pr1',
      );
      expect(d.invoicesRepo.findByPracticePage).toHaveBeenCalledWith(
        d.em,
        'pr1',
        undefined,
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('throws 404 without a query when the practice belongs to another tenant (isolation)', async () => {
      const d = build();
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('tenant-b');
      await expect(
        d.service.listByPractice('pr1', 'tenant-a', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.invoicesRepo.findByPracticePage).not.toHaveBeenCalled();
    });
  });

  describe('getDetail (CV-12)', () => {
    it('throws 404 without distinguishing another practice from a missing invoice', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        practiceId: 'other-practice',
      });
      await expect(
        d.service.getDetail('inv1', 'pr1', 'tenant-1'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.invoicesRepo.findLinesByInvoice).not.toHaveBeenCalled();
    });

    it('throws 404 when the practice belongs to another tenant, before touching the invoice (isolation)', async () => {
      const d = build();
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('tenant-b');
      await expect(
        d.service.getDetail('inv1', 'pr1', 'tenant-a'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.invoicesRepo.findById).not.toHaveBeenCalled();
    });

    it('returns the header and its lines', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        practiceId: 'pr1',
        invoiceNumber: 'F-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_ISSUED,
      });
      d.invoicesRepo.findLinesByInvoice.mockResolvedValue([
        { id: 'l1', quantity: '1', unitPrice: '10.00' },
      ]);

      const res = await d.service.getDetail('inv1', 'pr1', 'tenant-1');

      expect(res.id).toBe('inv1');
      expect(res.lines).toEqual([
        expect.objectContaining({ id: 'l1', quantity: '1' }),
      ]);
    });
  });
});

describe('InvoicesService · alcance de tenant (BILL-01)', () => {
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

  /**
   * Resuelve la práctica de cada documento: `pr1` es de A, `pr-b` de B.
   *
   * @param d - Doble del servicio.
   */
  function practicesAandB(d: ReturnType<typeof build>) {
    d.practiceTenantLookup.findTenantOfPractice.mockImplementation(
      async (practiceId: string) =>
        practiceId === 'pr1'
          ? TENANT_A
          : practiceId === 'pr-b'
            ? TENANT_B
            : null,
    );
  }

  const issueDto = (practiceId: string) =>
    ({
      practiceId,
      patientProfileId: 'p1',
      encounterId: 'e1',
      lines: [{ quantity: '1', unitPrice: '100.00' }],
    }) as any;

  it('correcto: la factura se emite en la práctica de A y su vínculo lleva el tenant del contexto', async () => {
    const d = build();
    practicesAandB(d);
    d.invoicesRepo.findByNumber.mockResolvedValue(null);
    d.invoicesRepo.create.mockReturnValue({ id: 'inv1', total: '100.00' });

    await d.service.issueFromEncounter(
      { ...issueDto('pr1'), tenantId: TENANT_B },
      actor,
    );

    expect(d.linksRepo.create.mock.calls[0][1].tenantId).toBe(TENANT_A);
  });

  it('emitir en una práctica de B desde A responde como práctica inexistente y no crea nada', async () => {
    const d = build();
    practicesAandB(d);

    const foreign = await rejection(
      d.service.issueFromEncounter(issueDto('pr-b'), actor),
    );
    const missing = await rejection(
      d.service.issueFromEncounter(issueDto('pr-x'), actor),
    );

    expect(foreign.getStatus()).toBe(404);
    expect(foreign.reason).toBe(BillingErrorReason.BILLING_PRACTICE_NOT_FOUND);
    expect(foreign.details).toBeUndefined();
    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
    expect(d.linksRepo.create).not.toHaveBeenCalled();
  });

  it('la nota de crédito sobre una factura de B responde como inexistente y no cambia su saldo', async () => {
    const foreign = build();
    practicesAandB(foreign);
    const foreignInvoice = {
      id: 'inv1',
      practiceId: 'pr-b',
      balance: '100.00',
      statusConceptId: BILL.INVOICE_ISSUED,
    };
    foreign.invoicesRepo.findById.mockResolvedValue(foreignInvoice);
    const absent = build();
    practicesAandB(absent);
    absent.invoicesRepo.findById.mockResolvedValue(null);
    const dto = {
      reason: 'x',
      lines: [{ quantity: '1', unitPrice: '40.00' }],
    } as any;

    const a = await rejection(foreign.service.creditNote('inv1', dto, actor));
    const b = await rejection(absent.service.creditNote('inv1', dto, actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(
      BillingErrorReason.INVOICE_CREDIT_NOTE_ORIGINAL_NOT_FOUND,
    );
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreignInvoice.balance).toBe('100.00');
    expect(foreign.invoicesRepo.create).not.toHaveBeenCalled();
  });

  it('el plan de pagos sobre una factura de B responde como inexistente y no crea cuotas', async () => {
    const d = build();
    practicesAandB(d);
    const source = {
      id: 'inv1',
      practiceId: 'pr-b',
      balance: '100.00',
      statusConceptId: BILL.INVOICE_ISSUED,
    };
    d.invoicesRepo.findById.mockResolvedValue(source);

    const error = await rejection(
      d.service.createPaymentPlan(
        {
          sourceInvoiceId: 'inv1',
          installments: [{ dueDate: '2026-01-01', amount: '100.00' }],
        } as any,
        actor,
      ),
    );

    expect(error.reason).toBe(
      BillingErrorReason.INVOICE_PAYMENT_PLAN_SOURCE_NOT_FOUND,
    );
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
    expect(source.statusConceptId).toBe(BILL.INVOICE_ISSUED);
  });

  it('la factura de A es ajena desde B (mismo UUID, distinto contexto)', async () => {
    const d = build();
    practicesAandB(d);
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
    });

    await expect(
      d.asTenantB.creditNote(
        'inv1',
        { reason: 'x', lines: [{ quantity: '1', unitPrice: '1' }] } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.INVOICE_CREDIT_NOTE_ORIGINAL_NOT_FOUND,
    });
  });

  it('sin tenant en el contexto no emite nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(
      d.raw.issueFromEncounter(issueDto('pr1'), actor),
    );

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
  });
});

describe('InvoicesService · importes de las líneas (BILL-03)', () => {
  const issue = (line: Record<string, string>) =>
    ({
      practiceId: 'pr1',
      patientProfileId: 'p1',
      lines: [{ quantity: '1', unitPrice: '100.00', ...line }],
    }) as any;

  it.each([
    ['cantidad negativa', { quantity: '-1' }],
    ['cantidad cero', { quantity: '0' }],
    ['precio negativo', { unitPrice: '-100.00' }],
    ['descuento negativo', { discount: '-5.00' }],
    ['impuesto negativo', { taxAmount: '-1.00' }],
    ['precio malformado', { unitPrice: '10.001' }],
    ['cantidad con notación científica', { quantity: '1e3' }],
  ])('rechaza %s y no crea la factura', async (_name, line) => {
    const d = build();
    d.invoicesRepo.findByNumber.mockResolvedValue(null);

    await expect(
      d.service.issueFromEncounter(issue(line), actor),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.INVOICE_LINE_AMOUNT_INVALID,
    });
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza un descuento superior a la base de la línea', async () => {
    const d = build();
    d.invoicesRepo.findByNumber.mockResolvedValue(null);

    await expect(
      d.service.issueFromEncounter(
        issue({ quantity: '2', unitPrice: '10.00', discount: '20.01' }),
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.INVOICE_LINE_DISCOUNT_EXCEEDS_BASE,
    });
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
  });

  it('límite: descuento igual a la base deja la línea en cero, sin neto negativo', async () => {
    const d = build();
    d.invoicesRepo.findByNumber.mockResolvedValue(null);
    d.invoicesRepo.create.mockImplementation((_tx: any, data: any) => ({
      id: 'inv1',
      ...data,
    }));

    await d.service.issueFromEncounter(
      issue({ quantity: '2', unitPrice: '10.00', discount: '20.00' }),
      actor,
    );

    const created = d.invoicesRepo.create.mock.calls[0][1];
    expect(created.subtotal).toBe('0.00');
    expect(created.total).toBe('0.00');
    expect(created.balance).toBe('0.00');
  });

  it('calcula la base con decimal exacto (cantidad fraccionaria)', async () => {
    const d = build();
    d.invoicesRepo.findByNumber.mockResolvedValue(null);
    d.invoicesRepo.create.mockImplementation((_tx: any, data: any) => ({
      id: 'inv1',
      ...data,
    }));

    await d.service.issueFromEncounter(
      issue({
        quantity: '1.5',
        unitPrice: '0.10',
        discount: '0.05',
        taxAmount: '0.01',
      }),
      actor,
    );

    const created = d.invoicesRepo.create.mock.calls[0][1];
    expect(created.subtotal).toBe('0.10');
    expect(created.taxTotal).toBe('0.01');
    expect(created.total).toBe('0.11');
  });

  it('la nota de crédito rechaza líneas negativas y no toca el saldo original', async () => {
    const d = build();
    const original = {
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      statusConceptId: BILL.INVOICE_ISSUED,
    };
    d.invoicesRepo.findById.mockResolvedValue(original);

    await expect(
      d.service.creditNote(
        'inv1',
        {
          reason: 'x',
          lines: [{ quantity: '-1', unitPrice: '40.00' }],
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.CREDIT_NOTE_LINE_AMOUNT_INVALID,
    });
    await expect(
      d.service.creditNote(
        'inv1',
        {
          reason: 'x',
          lines: [{ quantity: '1', unitPrice: '40.00', taxAmount: '-100.00' }],
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.CREDIT_NOTE_LINE_AMOUNT_INVALID,
    });
    expect(original.balance).toBe('100.00');
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
  });

  it('la nota de crédito de importe cero se rechaza', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
    });

    await expect(
      d.service.creditNote(
        'inv1',
        { reason: 'x', lines: [{ quantity: '1', unitPrice: '0.00' }] } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.CREDIT_NOTE_LINE_AMOUNT_INVALID,
    });
  });

  it('el write-off trazable sigue permitido: el castigo supera el saldo y lo deja en cero con motivo', async () => {
    const d = build();
    const original = {
      id: 'inv1',
      practiceId: 'pr1',
      balance: '30.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(original);
    d.invoicesRepo.create.mockReturnValue({ id: 'nc1' });

    await d.service.creditNote(
      'inv1',
      {
        reason: 'incobrable',
        writeOff: true,
        lines: [{ quantity: '1', unitPrice: '40.00' }],
      } as any,
      actor,
    );

    expect(original.balance).toBe('0.00');
    expect(d.invoicesRepo.createLine.mock.calls[0][1].description).toBe(
      'incobrable',
    );
  });

  it('una cuota negativa del plan de pagos se rechaza aunque la suma cuadre', async () => {
    const d = build();
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      invoiceNumber: 'INV-1',
      statusConceptId: BILL.INVOICE_ISSUED,
    });

    await expect(
      d.service.createPaymentPlan(
        {
          sourceInvoiceId: 'inv1',
          installments: [
            { dueDate: '2026-01-01', amount: '150.00' },
            { dueDate: '2026-02-01', amount: '-50.00' },
          ],
        } as any,
        actor,
      ),
    ).rejects.toMatchObject({
      reason:
        BillingErrorReason.INVOICE_PAYMENT_PLAN_INSTALLMENT_AMOUNT_INVALID,
    });
    expect(d.invoicesRepo.create).not.toHaveBeenCalled();
  });
});
