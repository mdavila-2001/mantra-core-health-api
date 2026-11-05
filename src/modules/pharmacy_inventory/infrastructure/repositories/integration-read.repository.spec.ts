import { jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { IntegrationReadRepository } from './integration-read.repository';

describe('IntegrationReadRepository.findMarkedNotAvailable', () => {
  it('asks nothing for no products', async () => {
    const em = { execute: jest.fn() };
    const marked = await new IntegrationReadRepository().findMarkedNotAvailable(
      em as any,
      'site-1',
      [],
    );
    expect(marked.size).toBe(0);
    expect(em.execute).not.toHaveBeenCalled();
  });

  it('keeps only a site with nothing for sale whose last entry is a manual adjustment', async () => {
    const em = {
      execute: jest.fn(async () => [{ pharmacy_product_id: 'product-a' }]),
    };
    const marked = await new IntegrationReadRepository().findMarkedNotAvailable(
      em as any,
      'site-1',
      ['product-a', 'product-b'],
    );
    expect([...marked]).toEqual(['product-a']);
    const [sql, params] = em.execute.mock.calls[0] as unknown as [
      string,
      unknown[],
    ];
    // One marker per id (the driver does not turn an array into a Postgres one).
    expect(sql).toContain('in (?, ?)');
    expect(sql).toContain('s.available <= 0');
    expect(sql).toContain(
      'order by le.pharmacy_product_id, le.ledger_sequence desc',
    );
    expect(params).toEqual([
      'site-1',
      PINV.LOCATION_ACTIVE,
      'product-a',
      'product-b',
      'site-1',
      'product-a',
      'product-b',
      PINV.MV_COUNT_ADJUSTMENT,
    ]);
  });
});

describe('IntegrationReadRepository.findPharmacyCode', () => {
  it('reads the code of the pharmacy, or null', async () => {
    const em = {
      findOne: jest
        .fn<() => Promise<unknown>>()
        .mockResolvedValueOnce({ id: 'pharmacy-1', code: 'FARM-1' })
        .mockResolvedValueOnce(null),
    };
    const repo = new IntegrationReadRepository();
    expect(await repo.findPharmacyCode(em as any, 'pharmacy-1')).toBe('FARM-1');
    expect(await repo.findPharmacyCode(em as any, 'pharmacy-2')).toBeNull();
  });
});
