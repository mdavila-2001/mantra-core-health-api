import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AccountingFiscalController } from './accounting-fiscal.controller';
import { AccountingAccrualController } from './accounting-accrual.controller';
import { AccountingSubledgerController } from './accounting-subledger.controller';
import { AccountingAssetController } from './accounting-asset.controller';
import { AccountingLiabilityController } from './accounting-liability.controller';
import { AccountingExchangeRateController } from './accounting-exchange-rate.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('Accounting controllers (delegación)', () => {
  it('Fiscal delega openFiscalYear (UC-16-04) y lockPeriod (UC-16-05)', async () => {
    const svc = { openFiscalYear: mockFn(), lockPeriod: mockFn() };
    const c = new AccountingFiscalController(svc as any);
    await c.openFiscalYear({ code: 'FY' } as any, actor);
    await c.lockPeriod('per1', { reason: 'x' }, actor);
    expect(svc.openFiscalYear).toHaveBeenCalledWith({ code: 'FY' }, actor);
    expect(svc.lockPeriod).toHaveBeenCalledWith('per1', { reason: 'x' }, actor);
  });

  it('Accrual delega create (UC-16-06) y run (UC-16-07)', async () => {
    const svc = { createAccrualObject: mockFn(), runAccruals: mockFn() };
    const c = new AccountingAccrualController(svc as any);
    await c.createAccrualObject({ objectNumber: 'A' } as any, actor);
    await c.runAccruals({ accrualObjectId: 'a' } as any, actor);
    expect(svc.createAccrualObject).toHaveBeenCalledWith(
      { objectNumber: 'A' },
      actor,
    );
    expect(svc.runAccruals).toHaveBeenCalledWith(
      { accrualObjectId: 'a' },
      actor,
    );
  });

  it('Subledger delega createOpenItem (UC-16-08) y clear (UC-16-09)', async () => {
    const svc = { createOpenItem: mockFn(), clearOpenItems: mockFn() };
    const c = new AccountingSubledgerController(svc as any);
    await c.createOpenItem({ tenantId: 't' } as any, actor);
    await c.clearOpenItems({ tenantId: 't' } as any, actor);
    expect(svc.createOpenItem).toHaveBeenCalledWith({ tenantId: 't' }, actor);
    expect(svc.clearOpenItems).toHaveBeenCalledWith({ tenantId: 't' }, actor);
  });

  it('Asset delega capitalize (UC-16-10) y depreciation run (UC-16-11)', async () => {
    const svc = { capitalize: mockFn(), runDepreciation: mockFn() };
    const c = new AccountingAssetController(svc as any);
    await c.capitalize({ code: 'A' } as any, actor);
    await c.runDepreciation({ fiscalPeriodId: 'fp' } as any, actor);
    expect(svc.capitalize).toHaveBeenCalledWith({ code: 'A' }, actor);
    expect(svc.runDepreciation).toHaveBeenCalledWith(
      { fiscalPeriodId: 'fp' },
      actor,
    );
  });

  it('Liability delega pay (UC-16-12)', async () => {
    const svc = { payLiability: mockFn() };
    const c = new AccountingLiabilityController(svc as any);
    await c.pay('l1', { amount: '10' } as any, actor);
    expect(svc.payLiability).toHaveBeenCalledWith(
      'l1',
      { amount: '10' },
      actor,
    );
  });

  it('ExchangeRate delega register (UC-16-14)', async () => {
    const svc = { registerRate: mockFn() };
    const c = new AccountingExchangeRateController(svc as any);
    await c.register({ rate: '3.75' } as any, actor);
    expect(svc.registerRate).toHaveBeenCalledWith({ rate: '3.75' }, actor);
  });
});
