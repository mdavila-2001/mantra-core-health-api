import { jest } from '@jest/globals';
import { PharmacyDirectoryAdapter } from './pharmacy-directory.adapter';

describe('PharmacyDirectoryAdapter', () => {
  it('delegates visibility reads with the caller unit of work and tenant', async () => {
    const uow = {};
    const result = [{ id: 'ph-1', tenantId: 'tenant-1' }];
    const pharmacy = {
      findVisibleByTenant: jest.fn(async () => result),
    };
    const adapter = new PharmacyDirectoryAdapter(pharmacy as any);

    await expect(
      adapter.findVisibleByTenant(uow as any, 'tenant-1'),
    ).resolves.toBe(result);
    expect(pharmacy.findVisibleByTenant).toHaveBeenCalledWith(uow, 'tenant-1');
  });

  it('delegates price reads without changing the date or product filters', async () => {
    const uow = {};
    const now = new Date('2026-10-11T00:00:00.000Z');
    const result: unknown[] = [];
    const pharmacy = {
      findCurrentPrices: jest.fn(async () => result),
    };
    const adapter = new PharmacyDirectoryAdapter(pharmacy as any);

    await expect(
      adapter.findCurrentPrices(uow as any, ['list-1'], ['product-1'], now),
    ).resolves.toBe(result);
    expect(pharmacy.findCurrentPrices).toHaveBeenCalledWith(
      uow,
      ['list-1'],
      ['product-1'],
      now,
    );
  });
});
