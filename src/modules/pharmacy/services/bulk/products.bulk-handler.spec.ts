import { jest } from '@jest/globals';
import { PHARM } from '../../pharmacy.concepts';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import { BulkRowRejection } from './bulk-handler';
import { ProductsBulkHandler } from './products.bulk-handler';

const CTX = { pharmacy: { id: 'pharmacy-1' }, actor: { id: 'user-1' } } as any;

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    productCode: 'P1',
    brandName: 'Paracetamol',
    stockQuantity: 5,
    outOfStockDeclared: false,
    statusConceptId: PHARM.PRODUCT_ACTIVE,
    pharmacyProductCategoryId: 'cat-1',
    ...overrides,
  };
}

function build(options: { taken?: unknown; amounts?: (string | null)[] } = {}) {
  const productsRepo = {
    findByPharmacyAndCode: jest.fn(async () => null),
    findByPharmacyAndCatalog: jest.fn(async () => options.taken ?? null),
  };
  const products = {
    publishProduct: jest.fn(async () => ({ id: 'product-new' })),
    updateProduct: jest.fn(async () => ({})),
  };
  const amounts = [...(options.amounts ?? [null, null])];
  const prices = { activeAmount: jest.fn(async () => amounts.shift() ?? null) };
  const handler = new ProductsBulkHandler(
    productsRepo as any,
    products as any,
    prices as any,
  );
  return { handler, products };
}

async function reasonOf(
  promise: Promise<unknown>,
): Promise<string | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as BulkRowRejection).errors?.[0]?.reason;
  }
  return undefined;
}

describe('ProductsBulkHandler', () => {
  it('creates through publishProduct', async () => {
    const d = build();
    const row = {
      productCode: 'P9',
      brandName: 'Nuevo',
      unitPrice: '3',
    } as any;
    await expect(d.handler.create({} as any, CTX, row)).resolves.toBe(
      'product-new',
    );
    expect(d.products.publishProduct).toHaveBeenCalledWith(
      'pharmacy-1',
      row,
      CTX.actor,
    );
  });

  it('the official catalog product already loaded with another code → CATALOG_PRODUCT_TAKEN', async () => {
    const d = build({ taken: { productCode: 'OTRO' } });
    const row = { productCode: 'P9', catalogProductId: 'cat-prod-1' } as any;
    expect(await reasonOf(d.handler.create({} as any, CTX, row))).toBe(
      PharmacyErrorReason.CATALOG_PRODUCT_TAKEN,
    );
    expect(d.products.publishProduct).not.toHaveBeenCalled();
  });

  it('changes price and category through updateProduct, without the code', async () => {
    const d = build({ amounts: ['10.00', '12.00'] });
    const existing = product();
    const tx = {
      refresh: jest.fn(async () => {
        existing.pharmacyProductCategoryId = 'cat-2';
      }),
    };
    await expect(
      d.handler.update(
        tx as any,
        CTX,
        existing as any,
        {
          productCode: 'P1',
          unitPrice: '12',
          category: 'Vitaminas',
        } as any,
      ),
    ).resolves.toEqual({ id: 'product-1', changed: true });
    expect(d.products.updateProduct).toHaveBeenCalledWith(
      'pharmacy-1',
      'product-1',
      { unitPrice: '12', category: 'Vitaminas' },
      CTX.actor,
    );
  });

  it('a row that leaves everything as it was is UNCHANGED', async () => {
    const d = build({ amounts: ['10.00', '10.00'] });
    const tx = { refresh: jest.fn(async () => undefined) };
    await expect(
      d.handler.update(
        tx as any,
        CTX,
        product() as any,
        {
          productCode: 'P1',
          unitPrice: '10',
        } as any,
      ),
    ).resolves.toEqual({ id: 'product-1', changed: false });
  });

  it('a retired code → PRODUCT_RETIRED without calling the service', async () => {
    const d = build();
    const retired = product({ statusConceptId: PHARM.PRODUCT_RETIRED });
    expect(
      await reasonOf(
        d.handler.update(
          {} as any,
          CTX,
          retired as any,
          { productCode: 'P1' } as any,
        ),
      ),
    ).toBe(PharmacyErrorReason.PRODUCT_RETIRED);
    expect(d.products.updateProduct).not.toHaveBeenCalled();
  });
});
