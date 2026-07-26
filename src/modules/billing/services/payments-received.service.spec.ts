import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PaymentsReceivedService } from './payments-received.service';
import { BILL } from '../billing.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const paymentsRepo = { create: mockFn(), createAllocation: mockFn() };
  const invoicesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsReceivedService(em as any, paymentsRepo as any, invoicesRepo as any, logger as any);
  return { service, tx, paymentsRepo, invoicesRepo };
}

describe('PaymentsReceivedService (UC-17-02)', () => {
  it('applies the payment, allocates and updates each invoice balance/status', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00', statusConceptId: BILL.PAYMENT_CLEARED });
    const invoice = { id: 'inv1', balance: '100.00', paidTotal: '0.00', statusConceptId: BILL.INVOICE_ISSUED, updatedAt: new Date() };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.apply(
      { practiceId: 'pr1', amount: '50.00', allocations: [{ invoiceId: 'inv1', allocatedAmount: '50.00' }] } as any,
      actor,
    );

    expect(res.id).toBe('pay1');
    expect(res.allocations).toHaveLength(1);
    expect(invoice.paidTotal).toBe('50.00');
    expect(invoice.balance).toBe('50.00');
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PARTIALLY_PAID);
    expect(d.paymentsRepo.createAllocation).toHaveBeenCalled();
  });

  it('marks the invoice PAID when the balance reaches zero', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '100.00', statusConceptId: BILL.PAYMENT_CLEARED });
    const invoice = { id: 'inv1', balance: '100.00', paidTotal: '0.00', statusConceptId: BILL.INVOICE_ISSUED, updatedAt: new Date() };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    await d.service.apply(
      { practiceId: 'pr1', amount: '100.00', allocations: [{ invoiceId: 'inv1', allocatedAmount: '100.00' }] } as any,
      actor,
    );
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PAID);
  });

  it('rejects when the allocated sum exceeds the payment amount', async () => {
    const d = build();
    await expect(
      d.service.apply(
        { practiceId: 'pr1', amount: '10.00', allocations: [{ invoiceId: 'inv1', allocatedAmount: '50.00' }] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.paymentsRepo.create).not.toHaveBeenCalled();
  });

  it('throws when a target invoice does not exist', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pay1', amount: '50.00', statusConceptId: BILL.PAYMENT_CLEARED });
    d.invoicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.apply(
        { practiceId: 'pr1', amount: '50.00', allocations: [{ invoiceId: 'missing', allocatedAmount: '50.00' }] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
