import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyCatalogService } from './pharmacy-catalog.service';
import { ResourceNotFoundException } from '../../../common';
import { PHARM } from '../pharmacy.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const forked = {};
  const em = { fork: mockFn(() => forked) };
  const pharmaciesRepo = { findById: mockFn() };
  const productsRepo = { findByPharmacyAndStatus: mockFn() };
  const pricesRepo = { findActiveByProduct: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyCatalogService(
    em as any,
    pharmaciesRepo as any,
    productsRepo as any,
    pricesRepo as any,
    logger as any,
  );
  return { service, em, pharmaciesRepo, productsRepo, pricesRepo };
}

describe('PharmacyCatalogService (UC-24-11)', () => {
  it('throws when the pharmacy does not exist', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue(null);
    await expect(d.service.projectCatalog('ph1', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('projects active products with their active prices', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue({ id: 'ph1' });
    d.productsRepo.findByPharmacyAndStatus.mockResolvedValue([
      { id: 'pr1', productCode: 'P-1', brandName: 'Acme' },
    ]);
    d.pricesRepo.findActiveByProduct.mockResolvedValue([
      { pharmacyPriceListId: 'pl1', unitAmount: '10', versionNumber: 1 },
    ]);

    const res = await d.service.projectCatalog('ph1', actor);

    expect(res.productCount).toBe(1);
    expect(res.entries[0]).toMatchObject({
      productId: 'pr1',
      productCode: 'P-1',
    });
    expect(res.entries[0].prices[0]).toMatchObject({
      priceListId: 'pl1',
      unitAmount: '10',
    });
    expect(d.em.fork).toHaveBeenCalled();
    expect(d.productsRepo.findByPharmacyAndStatus).toHaveBeenCalledWith(
      expect.anything(),
      'ph1',
      PHARM.PRODUCT_ACTIVE,
    );
  });
});
