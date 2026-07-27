import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReimbursementsService } from './reimbursements.service';
import { BILL } from '../billing.concepts';
import { ConflictException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reimbursementsRepo = { findByClaim: mockFn(), create: mockFn() };
  const invoicesRepo = { findById: mockFn() };
  const linksRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ReimbursementsService(
    em as any,
    reimbursementsRepo,
    invoicesRepo as any,
    linksRepo,
    logger as any,
  );
  return { service, reimbursementsRepo, invoicesRepo, linksRepo };
}

describe('ReimbursementsService (UC-17-08)', () => {
  it('links the reimbursement and credits the invoice', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    const invoice = {
      id: 'inv1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);
    d.reimbursementsRepo.create.mockReturnValue({
      id: 'r1',
      claimId: 'c1',
      amount: '30.00',
      statusConceptId: BILL.REIMBURSEMENT_POSTED,
    });

    const res = await d.service.link(
      {
        claimId: 'c1',
        invoiceId: 'inv1',
        amount: '30.00',
        tenantId: 't1',
      },
      actor,
    );

    expect(res.id).toBe('r1');
    expect(invoice.paidTotal).toBe('30.00');
    expect(invoice.balance).toBe('70.00');
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PARTIALLY_PAID);
    expect(d.linksRepo.create).toHaveBeenCalled();
  });

  it('rejects a claim that already has a reimbursement (conflict / idempotency)', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.link(
        { claimId: 'c1', invoiceId: 'inv1', amount: '30.00' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the invoice does not exist', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    d.invoicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.link(
        { claimId: 'c1', invoiceId: 'missing', amount: '30.00' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
