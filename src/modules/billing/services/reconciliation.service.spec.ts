import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReconciliationService } from './reconciliation.service';
import { BILL } from '../billing.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const paymentsReceivedRepo = { findById: mockFn() };
  const paymentsMadeRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ReconciliationService(em as any, paymentsReceivedRepo as any, paymentsMadeRepo as any, logger as any);
  return { service, paymentsReceivedRepo, paymentsMadeRepo };
}

describe('ReconciliationService (UC-17-07)', () => {
  it('reconciles the listed received payments', async () => {
    const d = build();
    const payment = { clearingDocumentId: undefined, statusConceptId: BILL.PAYMENT_CLEARED, updatedAt: new Date() };
    d.paymentsReceivedRepo.findById.mockResolvedValue(payment);

    const res = await d.service.clear({ clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any, actor);

    expect(res.reconciledReceived).toBe(1);
    expect(payment.clearingDocumentId).toBe('cd1');
    expect(payment.statusConceptId).toBe(BILL.PAYMENT_RECONCILED);
  });

  it('rejects when no payment id is provided', async () => {
    const d = build();
    await expect(d.service.clear({ clearingDocumentId: 'cd1' } as any, actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('throws when a payment does not exist', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.clear({ clearingDocumentId: 'cd1', paymentReceivedIds: ['missing'] } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects an already reconciled payment', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue({ clearingDocumentId: 'prev', statusConceptId: BILL.PAYMENT_RECONCILED });
    await expect(
      d.service.clear({ clearingDocumentId: 'cd1', paymentReceivedIds: ['p1'] } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
