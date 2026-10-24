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
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

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
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsReceivedService(
    em as any,
    paymentsRepo as any,
    invoicesRepo as any,
    logger as any,
  );
  return { service, tx, paymentsRepo, invoicesRepo };
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
