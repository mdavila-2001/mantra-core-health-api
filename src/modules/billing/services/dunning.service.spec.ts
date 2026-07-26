import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DunningService } from './dunning.service';
import { BILL } from '../billing.concepts';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dunningRepo = { findRunByNumber: mockFn(), createRun: mockFn(), createItem: mockFn() };
  const invoicesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DunningService(em as any, dunningRepo as any, invoicesRepo as any, logger as any);
  return { service, tx, dunningRepo, invoicesRepo };
}

describe('DunningService (UC-17-10)', () => {
  it('creates the run and one item per overdue invoice, then completes the run', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue(null);
    const run = { id: 'run1', runNumber: 'R-1', statusConceptId: BILL.DUNNING_RUN_RUNNING };
    d.dunningRepo.createRun.mockReturnValue(run);
    const invoice = { id: 'inv1', statusConceptId: BILL.INVOICE_ISSUED, updatedAt: new Date() };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.execute(
      { tenantId: 't1', runNumber: 'R-1', items: [{ invoiceId: 'inv1', outstandingAmount: '50.00', daysOverdue: 30 }] } as any,
      actor,
    );

    expect(res.itemCount).toBe(1);
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.dunningRepo.createItem).toHaveBeenCalledTimes(1);
    expect(run.statusConceptId).toBe(BILL.DUNNING_RUN_COMPLETED);
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_IN_COLLECTION);
  });

  it('rejects a duplicate run number for the tenant (conflict)', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.execute({ tenantId: 't1', runNumber: 'R-1', items: [{ invoiceId: 'inv1' }] } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
