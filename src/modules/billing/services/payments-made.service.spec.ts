import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PaymentsMadeService } from './payments-made.service';
import { BILL } from '../billing.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const paymentsRepo = { create: mockFn(), createAllocation: mockFn() };
  const billsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsMadeService(em as any, paymentsRepo as any, billsRepo as any, logger as any);
  return { service, tx, paymentsRepo, billsRepo };
}

describe('PaymentsMadeService (UC-17-05)', () => {
  it('executes the payment and updates each bill balance/status', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pm1', amount: '100.00', statusConceptId: BILL.PAYMENT_EXECUTED });
    const bill = { id: 'b1', balance: '100.00', paidTotal: '0.00', statusConceptId: BILL.BILL_APPROVED, updatedAt: new Date() };
    d.billsRepo.findById.mockResolvedValue(bill);

    const res = await d.service.execute(
      { practiceId: 'pr1', amount: '100.00', allocations: [{ billId: 'b1', allocatedAmount: '100.00' }] } as any,
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
        { practiceId: 'pr1', amount: '100.00', allocations: [{ billId: 'b1', allocatedAmount: '90.00', withholdingAmount: '20.00' }] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('throws when a target bill does not exist', async () => {
    const d = build();
    d.paymentsRepo.create.mockReturnValue({ id: 'pm1', amount: '10.00', statusConceptId: BILL.PAYMENT_EXECUTED });
    d.billsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.execute(
        { practiceId: 'pr1', amount: '10.00', allocations: [{ billId: 'missing', allocatedAmount: '10.00' }] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
