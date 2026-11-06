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

function build(
  options: {
    taken?: unknown;
    amounts?: (string | null)[];
    images?: string[][];
    stored?: unknown;
  } = {},
) {
  const productsRepo = {
    findByPharmacyAndCode: jest.fn(async () => null),
    findByPharmacyAndCatalog: jest.fn(async () => options.taken ?? null),
    findById: jest.fn(async () => options.stored ?? null),
  };
  const products = {
    publishProduct: jest.fn(async () => ({ id: 'product-new' })),
    updateProduct: jest.fn(async () => ({})),
  };
  const amounts = [...(options.amounts ?? [null, null])];
  const prices = { activeAmount: jest.fn(async () => amounts.shift() ?? null) };
  const images = [...(options.images ?? [[], []])];
  const catalog = {
    findImageFileIds: jest.fn(
      async () => new Map([['product-1', images.shift() ?? []]]),
    ),
  };
  const medications = {
    resolveName: jest.fn(async (name: string) =>
      name.trim().toLowerCase() === 'amoxicilina'
        ? { found: true, conceptId: 'concept-amox' }
        : {
            found: false,
            reason: PharmacyErrorReason.MEDICATION_NOT_FOUND,
            message: 'No está',
          },
    ),
  };
  const handler = new ProductsBulkHandler(
    productsRepo as any,
    products as any,
    prices as any,
    catalog as any,
    medications as any,
  );
  return { handler, products, medications };
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

  it('the medication goes by its name: it is resolved to its concept before the usual create', async () => {
    const d = build();
    const row = {
      productCode: 'P9',
      genericName: 'Amoxicilina',
      requiresPrescription: true,
      medicationName: ' AMOXICILINA ',
    } as any;
    await d.handler.create({} as any, CTX, row);
    expect(d.products.publishProduct).toHaveBeenCalledWith(
      'pharmacy-1',
      {
        productCode: 'P9',
        genericName: 'Amoxicilina',
        requiresPrescription: true,
        medicationConceptId: 'concept-amox',
      },
      CTX.actor,
    );
  });

  it('a medication name that is not in the catalog rejects the row with its reason, and nothing is created', async () => {
    const d = build();
    const row = { productCode: 'P9', medicationName: 'Amoxi' } as any;
    expect(await reasonOf(d.handler.create({} as any, CTX, row))).toBe(
      PharmacyErrorReason.MEDICATION_NOT_FOUND,
    );
    expect(d.products.publishProduct).not.toHaveBeenCalled();
  });

  it('a product of the official catalog does not take a medication name', async () => {
    const d = build();
    const row = {
      productCode: 'P9',
      catalogProductId: 'cat-prod-1',
      medicationName: 'Amoxicilina',
    } as any;
    expect(await reasonOf(d.handler.create({} as any, CTX, row))).toBe(
      PharmacyErrorReason.MEDICATION_FROM_CATALOG,
    );
    expect(d.products.publishProduct).not.toHaveBeenCalled();
  });

  it('an existing product is linked by the medication name of its row, and that counts as a change', async () => {
    const d = build({ amounts: ['10.00', '10.00'] });
    const existing = product();
    const tx = {
      refresh: jest.fn(async () => {
        Object.assign(existing, { medicationConceptId: 'concept-amox' });
      }),
    };
    await expect(
      d.handler.update(
        tx as any,
        CTX,
        existing as any,
        { productCode: 'P1', medicationName: 'amoxicilina' } as any,
      ),
    ).resolves.toEqual({ id: 'product-1', changed: true });
    expect(d.products.updateProduct).toHaveBeenCalledWith(
      'pharmacy-1',
      'product-1',
      { medicationConceptId: 'concept-amox' },
      CTX.actor,
    );
  });

  it('a row that only changes the images is a change, not UNCHANGED', async () => {
    const d = build({
      amounts: ['10.00', '10.00'],
      images: [['img-1'], ['img-2']],
    });
    const tx = { refresh: jest.fn(async () => undefined) };
    await expect(
      d.handler.update(
        tx as any,
        CTX,
        product() as any,
        {
          productCode: 'P1',
          imageFileIds: ['22222222-2222-4222-8222-222222222222'],
        } as any,
      ),
    ).resolves.toEqual({ id: 'product-1', changed: true });
  });

  it('the same official product and presentation in two rows is another key of the row', () => {
    const d = build();
    expect(
      d.handler.otherKeysOf({
        productCode: 'A',
        catalogProductId: 'CAT-1',
        catalogPresentationCode: 'CN1',
      }),
    ).toEqual([{ field: 'catalogProductId', key: 'cat-1|CN1' }]);
    expect(d.handler.otherKeysOf({ productCode: 'A' })).toEqual([]);
  });

  it('warns about a saved product that needs a prescription and has no medication', async () => {
    const unlinked = build({
      stored: product({ requiresPrescription: true }),
    });
    expect(
      await unlinked.handler.warningsFor({} as any, CTX, 'product-1'),
    ).toEqual([
      expect.objectContaining({
        field: 'medicationConceptId',
        reason: PharmacyErrorReason.MEDICATION_NOT_LINKED,
      }),
    ]);
    const linked = build({
      stored: product({
        requiresPrescription: true,
        medicationConceptId: 'concept-amox',
      }),
    });
    expect(
      await linked.handler.warningsFor({} as any, CTX, 'product-1'),
    ).toEqual([]);
    const free = build({ stored: product({ requiresPrescription: false }) });
    expect(await free.handler.warningsFor({} as any, CTX, 'product-1')).toEqual(
      [],
    );
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
