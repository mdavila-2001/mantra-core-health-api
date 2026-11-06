import { describe, expect, it, jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { DiagnosticStudyPricesRepository } from '../repositories';
import { LabPortalPricingService } from './lab-portal-pricing.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('LabPortalPricingService version numbers', () => {
  it('locks the schedule before numbering and numbers across all offerings', async () => {
    const tx: any = {
      getReference: mockFn((_cls: unknown, id: string) => ({ id })),
      lock: mockFn(async () => undefined),
      find: mockFn(async () => [{ versionNumber: 4 }]),
    };
    const pricesRepo = new DiagnosticStudyPricesRepository();
    jest
      .spyOn(pricesRepo, 'create')
      .mockImplementation(((_em: any, d: any) => ({ ...d })) as any);
    const service = new LabPortalPricingService({} as any, pricesRepo);
    const ctx: any = {
      schedule: { id: 'ps1' },
      unit: { code: 'LAB1' },
      prices: new Map(),
    };
    const first = await service.setPrice(tx, ctx, 'oA', '10', undefined, 'u1');
    const second = await service.setPrice(tx, ctx, 'oB', '20', undefined, 'u1');
    expect([first.versionNumber, second.versionNumber]).toEqual([5, 6]);
    expect(tx.lock).toHaveBeenCalledTimes(1);
    expect(tx.lock).toHaveBeenCalledWith(
      { id: 'ps1' },
      LockMode.PESSIMISTIC_WRITE,
    );
    expect(tx.lock.mock.invocationCallOrder[0]).toBeLessThan(
      tx.find.mock.invocationCallOrder[0],
    );
    expect(tx.find.mock.calls[0][1]).toEqual({ priceScheduleId: 'ps1' });
  });
});
