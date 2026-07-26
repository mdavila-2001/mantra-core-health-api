import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { LedgerService } from './ledger.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const invoicesRepo = { findById: mockFn() };
  const billsRepo = { findById: mockFn() };
  const paymentsReceivedRepo = { findById: mockFn() };
  const paymentsMadeRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new LedgerService(
    em as any,
    invoicesRepo as any,
    billsRepo as any,
    paymentsReceivedRepo as any,
    paymentsMadeRepo as any,
    logger as any,
  );
  return { service, invoicesRepo, billsRepo, paymentsReceivedRepo, paymentsMadeRepo };
}

describe('LedgerService (UC-17-06)', () => {
  it('posts an invoice by setting its transaction id', async () => {
    const d = build();
    const invoice = { transactionId: undefined, updatedAt: new Date() };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.postToLedger('inv1', { documentType: 'INVOICE', transactionId: 'txn1' } as any, actor);

    expect(res.posted).toBe(true);
    expect(res.transactionId).toBe('txn1');
    expect(invoice.transactionId).toBe('txn1');
  });

  it('throws when the document does not exist', async () => {
    const d = build();
    d.billsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.postToLedger('b1', { documentType: 'BILL', transactionId: 'txn1' } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects re-posting an already posted document (conflict / idempotency)', async () => {
    const d = build();
    d.paymentsReceivedRepo.findById.mockResolvedValue({ transactionId: 'existing', updatedAt: new Date() });
    await expect(
      d.service.postToLedger('p1', { documentType: 'PAYMENT_RECEIVED', transactionId: 'txn1' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
