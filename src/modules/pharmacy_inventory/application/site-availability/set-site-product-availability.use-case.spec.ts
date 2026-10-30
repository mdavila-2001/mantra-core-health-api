import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { SetSiteProductAvailabilityUseCase } from './set-site-product-availability.use-case';

const REF = {
  pharmacyId: 'pharmacy-1',
  siteId: 'site-1',
  productId: 'product-a',
};
const ACTOR = { id: 'user-1' } as any;
const logger = { info: jest.fn() };

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-a',
    pharmacyId: 'pharmacy-1',
    statusConceptId: PHARM.PRODUCT_ACTIVE,
    stockQuantity: 7,
    outOfStockDeclared: false,
    ...overrides,
  };
}

function build(
  options: {
    product?: Record<string, unknown> | null;
    lots?: number;
    scope?: ReturnType<typeof allowAllScope>;
  } = {},
) {
  const tx = {};
  const em = {
    transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
  };
  const scope = options.scope ?? allowAllScope();
  const scopeRepo = {
    findProductInPharmacy: jest.fn(async () =>
      options.product === undefined ? product() : options.product,
    ),
  };
  const positions = {
    countLotPositionsInSite: jest.fn(async () => options.lots ?? 0),
  };
  const writer = {
    write: jest.fn(async (_tx: unknown, _site: unknown, targets: any[]) =>
      targets.map((t) => ({
        productId: t.productId,
        changed: true,
        position: {
          availableQuantity: String(t.availableQuantity),
          updatedAt: new Date('2026-10-30T12:00:00Z'),
        },
      })),
    ),
  };
  const useCase = new SetSiteProductAvailabilityUseCase(
    em as any,
    scope,
    scopeRepo as any,
    positions as any,
    writer as any,
    logger as any,
  );
  return { useCase, scope, writer, em };
}

async function reasonOf(
  promise: Promise<unknown>,
): Promise<string | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as DomainException).reason;
  }
  return undefined;
}

describe('SetSiteProductAvailabilityUseCase', () => {
  it('answers with exactly the five keys of the contract', async () => {
    const d = build();
    const response = await d.useCase.execute(REF, { available: false }, ACTOR);
    expect(response).toEqual({
      siteId: 'site-1',
      productId: 'product-a',
      available: false,
      quantity: 0,
      stockUpdatedAt: '2026-10-30T12:00:00.000Z',
    });
    expect(Object.keys(response).sort()).toEqual([
      'available',
      'productId',
      'quantity',
      'siteId',
      'stockUpdatedAt',
    ]);
  });

  it('writes through the ledger writer with a count adjustment', async () => {
    const d = build();
    await d.useCase.execute(REF, { available: true, quantity: 3 }, ACTOR);
    expect(d.writer.write).toHaveBeenCalledWith(
      {},
      { tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', siteId: 'site-1' },
      [{ productId: 'product-a', availableQuantity: 3 }],
      {
        movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
        actorUserId: 'user-1',
      },
    );
  });

  it('«No lo tengo» leaves 0 even if the body brings a quantity', async () => {
    const d = build();
    await d.useCase.execute(REF, { available: false, quantity: 9 }, ACTOR);
    expect(d.writer.write.mock.calls[0][2]).toEqual([
      { productId: 'product-a', availableQuantity: 0 },
    ]);
  });

  it.each([
    [7, 7],
    [0, 1],
    [null, 1],
  ])(
    '«Lo tengo» without quantity takes the declared stock %p → %p',
    async (stockQuantity, expected) => {
      const d = build({ product: product({ stockQuantity }) });
      const response = await d.useCase.execute(REF, { available: true }, ACTOR);
      expect(response.quantity).toBe(expected);
    },
  );

  it('rejects «Lo tengo» with quantity 0 with a 400 before opening the transaction', async () => {
    const d = build();
    const error = await d.useCase
      .execute(REF, { available: true, quantity: 0 }, ACTOR)
      .catch((e: DomainException) => e);
    expect(error).toBeInstanceOf(DomainException);
    expect((error as DomainException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('a site of another pharmacy answers the same 404', async () => {
    const scope = allowAllScope();
    scope.requireSite.mockRejectedValueOnce(scope.notAvailable());
    const d = build({ scope });
    await expect(
      d.useCase.execute(REF, { available: false }, ACTOR),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.writer.write).not.toHaveBeenCalled();
  });

  it('a product of another pharmacy (or none) answers the same 404', async () => {
    const d = build({ product: null });
    await expect(
      d.useCase.execute(REF, { available: false }, ACTOR),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.writer.write).not.toHaveBeenCalled();
  });

  it.each([PHARM.PRODUCT_DRAFT, PHARM.PRODUCT_RETIRED])(
    'a product that is not published → 422 PRODUCT_NOT_PUBLISHED',
    async (statusConceptId) => {
      const d = build({ product: product({ statusConceptId }) });
      expect(
        await reasonOf(d.useCase.execute(REF, { available: true }, ACTOR)),
      ).toBe(PharmacyInventoryErrorReason.PRODUCT_NOT_PUBLISHED);
      expect(d.writer.write).not.toHaveBeenCalled();
    },
  );

  it('«Lo tengo» over a pharmacy-wide «no tengo» → 422 PRODUCT_OUT_OF_STOCK_DECLARED without writing', async () => {
    const d = build({ product: product({ outOfStockDeclared: true }) });
    const error = await d.useCase
      .execute(REF, { available: true }, ACTOR)
      .catch((e: PreconditionFailedException) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    const body = (error as PreconditionFailedException).getResponse() as any;
    expect(body.reason).toBe(
      PharmacyInventoryErrorReason.PRODUCT_OUT_OF_STOCK_DECLARED,
    );
    expect(body.details.reason).toBe(
      PharmacyInventoryErrorReason.PRODUCT_OUT_OF_STOCK_DECLARED,
    );
    expect(d.writer.write).not.toHaveBeenCalled();
  });

  it('«No lo tengo» over a pharmacy-wide «no tengo» is allowed', async () => {
    const d = build({ product: product({ outOfStockDeclared: true }) });
    await expect(
      d.useCase.execute(REF, { available: false }, ACTOR),
    ).resolves.toEqual(expect.objectContaining({ quantity: 0 }));
  });

  it('a product kept by lots on the site → 422 SITE_PRODUCT_KEPT_BY_LOTS', async () => {
    const d = build({ lots: 2 });
    expect(
      await reasonOf(d.useCase.execute(REF, { available: true }, ACTOR)),
    ).toBe(PharmacyInventoryErrorReason.SITE_PRODUCT_KEPT_BY_LOTS);
    expect(d.writer.write).not.toHaveBeenCalled();
  });
});
