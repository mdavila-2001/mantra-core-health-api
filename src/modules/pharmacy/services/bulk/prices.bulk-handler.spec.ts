import { jest } from '@jest/globals';
import { PHARM } from '../../pharmacy.concepts';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';
import { validateRow } from '../pharmacy-bulk.service';
import { BulkPriceRowDto } from '../../dto';
import { BulkRowRejection } from './bulk-handler';
import { PricesBulkHandler } from './prices.bulk-handler';

const CTX = { pharmacy: { id: 'pharmacy-1' }, actor: { id: 'user-1' } } as any;
const PRODUCT = {
  id: 'product-1',
  productCode: 'P1',
  statusConceptId: PHARM.PRODUCT_ACTIVE,
};

function build(
  options: { product?: unknown; prices?: { unitAmount: string }[] } = {},
) {
  const productsRepo = {
    findByPharmacyAndCode: jest.fn(async () =>
      options.product === undefined ? PRODUCT : options.product,
    ),
  };
  const catalogRepo = {
    lockCatalogPriceList: jest.fn(async () => ({ id: 'list-1' })),
  };
  const pricesRepo = {
    findActiveByListAndProduct: jest.fn(async () => options.prices ?? []),
  };
  const products = { updateProduct: jest.fn(async () => ({})) };
  const handler = new PricesBulkHandler(
    productsRepo as any,
    catalogRepo as any,
    pricesRepo as any,
    products as any,
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

describe('PricesBulkHandler', () => {
  it('a product without an active price does not exist yet (CREATE sets it)', async () => {
    const d = build();
    await expect(
      d.handler.findExisting({} as any, CTX, 'P1'),
    ).resolves.toBeNull();
    await expect(
      d.handler.create({} as any, CTX, {
        productCode: 'P1',
        unitPrice: '12.50',
      }),
    ).resolves.toBe('product-1');
    expect(d.products.updateProduct).toHaveBeenCalledWith(
      'pharmacy-1',
      'product-1',
      { unitPrice: '12.50' },
      CTX.actor,
    );
  });

  it('another amount is UPDATED through the versioned price', async () => {
    const d = build({ prices: [{ unitAmount: '10.00' }] });
    const existing = await d.handler.findExisting({} as any, CTX, 'P1');
    expect(existing).toEqual({ product: PRODUCT, amount: '10.00' });
    await expect(
      d.handler.update({} as any, CTX, existing!, {
        productCode: 'P1',
        unitPrice: 12.5,
      }),
    ).resolves.toEqual({ id: 'product-1', changed: true });
    expect(d.products.updateProduct).toHaveBeenCalledTimes(1);
  });

  it('the same amount is UNCHANGED and writes no version', async () => {
    const d = build({ prices: [{ unitAmount: '12.50' }] });
    const existing = await d.handler.findExisting({} as any, CTX, 'P1');
    await expect(
      d.handler.update({} as any, CTX, existing!, {
        productCode: 'P1',
        unitPrice: '12.5',
      }),
    ).resolves.toEqual({ id: 'product-1', changed: false });
    expect(d.products.updateProduct).not.toHaveBeenCalled();
  });

  it('a code that is not a product of the pharmacy → PRODUCT_NOT_FOUND', async () => {
    const d = build({ product: null });
    expect(await reasonOf(d.handler.findExisting({} as any, CTX, 'P1X'))).toBe(
      PharmacyErrorReason.PRODUCT_NOT_FOUND,
    );
  });

  it('a retired product → PRODUCT_RETIRED', async () => {
    const d = build({
      product: { ...PRODUCT, statusConceptId: PHARM.PRODUCT_RETIRED },
    });
    expect(await reasonOf(d.handler.findExisting({} as any, CTX, 'P1'))).toBe(
      PharmacyErrorReason.PRODUCT_RETIRED,
    );
  });

  it('12.345 is not an amount: the row is rejected by its DTO', async () => {
    const rejection = await validateRow(BulkPriceRowDto, {
      productCode: 'P1',
      unitPrice: '12.345',
    }).catch((e: BulkRowRejection) => e);
    expect(rejection).toBeInstanceOf(BulkRowRejection);
    expect((rejection as BulkRowRejection).errors[0].field).toBe('unitPrice');
  });
});
