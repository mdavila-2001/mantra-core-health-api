import { jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { SiteStockWriter } from './site-stock-writer';

const SITE = {
  tenantId: 'tenant-1',
  pharmacyId: 'pharmacy-1',
  siteId: 'site-1',
};

interface Position {
  inventoryLocationId: string;
  pharmacyProductId: string;
  onHandQuantity: string;
  reservedQuantity: string;
  quarantineQuantity: string;
  availableQuantity: string;
  lastLedgerSequence: string;
  updatedAt: Date;
}

function position(overrides: Partial<Position> = {}): Position {
  return {
    inventoryLocationId: 'loc-1',
    pharmacyProductId: 'product-a',
    onHandQuantity: '0',
    reservedQuantity: '0',
    quarantineQuantity: '0',
    availableQuantity: '0',
    lastLedgerSequence: '0',
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  };
}

function build(options: {
  location?: { id: string } | null;
  missing?: {
    productId: string;
    stockQuantity: number | null;
    outOfStockDeclared: boolean;
  }[];
  existing?: Position | null;
}) {
  const tx = {
    execute: jest.fn(async () => []),
    flush: jest.fn(async () => undefined),
  };
  const locations = {
    findFirstActiveInSite: jest.fn(async () =>
      options.location === undefined ? { id: 'loc-1' } : options.location,
    ),
    create: jest.fn(() => ({ id: 'loc-new' })),
  };
  const created: Position[] = [];
  const positions = {
    findProductsWithoutPositionInSite: jest.fn(
      async () => options.missing ?? [],
    ),
    findByKeyForUpdate: jest.fn(async () => options.existing ?? null),
    create: jest.fn((_tx: unknown, data: Partial<Position>) => {
      const row = position({
        onHandQuantity: '0',
        availableQuantity: '0',
        ...data,
      });
      created.push(row);
      return row;
    }),
  };
  const ledger = {
    nextSequence: jest.fn(async () => '41'),
    append: jest.fn(),
  };
  const writer = new SiteStockWriter(
    locations as any,
    positions as any,
    ledger as any,
  );
  return { writer, tx, locations, positions, ledger, created };
}

const movement = {
  movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
  actorUserId: 'user-1',
};

describe('SiteStockWriter', () => {
  it('locks the site before touching anything', async () => {
    const d = build({
      existing: position({ onHandQuantity: '3', availableQuantity: '3' }),
    });
    await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 3 }],
      movement,
    );
    expect(d.tx.execute).toHaveBeenCalledWith(
      'select pg_advisory_xact_lock(hashtext(?))',
      ['pharmacy_inventory.site:site-1'],
    );
  });

  it('initialises a site with no positions: one position and one entry per product, then applies the request', async () => {
    const d = build({
      missing: [
        { productId: 'product-a', stockQuantity: 5, outOfStockDeclared: false },
        {
          productId: 'product-b',
          stockQuantity: null,
          outOfStockDeclared: false,
        },
        { productId: 'product-c', stockQuantity: 0, outOfStockDeclared: false },
        {
          productId: 'product-d',
          stockQuantity: null,
          outOfStockDeclared: true,
        },
      ],
      existing: position({ onHandQuantity: '5', availableQuantity: '5' }),
    });

    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 0 }],
      movement,
    );

    expect(
      d.created.map((p) => [p.pharmacyProductId, p.onHandQuantity]),
    ).toEqual([
      ['product-a', '5'],
      ['product-b', '1'],
      ['product-c', '0'],
      ['product-d', '0'],
    ]);
    // Asientos solo donde hay existencia: A (5), B (1) y el cambio pedido de A (−5).
    expect(
      d.ledger.append.mock.calls.map(([, e]: any) => [
        e.pharmacyProductId,
        e.quantityDelta,
        e.ledgerSequence,
      ]),
    ).toEqual([
      ['product-a', '5', '41'],
      ['product-b', '1', '42'],
      ['product-a', '-5', '43'],
    ]);
    expect(d.ledger.nextSequence).toHaveBeenCalledTimes(1);
    expect(result.changed).toBe(true);
    expect(result.position.availableQuantity).toBe('0');
  });

  it('only fills in what is missing on a site that already keeps its own stock', async () => {
    const d = build({
      missing: [
        { productId: 'product-g', stockQuantity: 2, outOfStockDeclared: false },
      ],
      existing: position({
        onHandQuantity: '1',
        availableQuantity: '1',
        pharmacyProductId: 'product-b',
      }),
    });
    await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-b', availableQuantity: 2 }],
      movement,
    );
    expect(d.created.map((p) => p.pharmacyProductId)).toEqual(['product-g']);
    expect(d.ledger.append).toHaveBeenCalledTimes(2);
  });

  it('creates the general location when the site has none', async () => {
    const d = build({ location: null });
    await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 1 }],
      movement,
    );
    expect(d.locations.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        pharmacySiteId: 'site-1',
        code: 'GENERAL',
        name: 'Depósito general',
        statusConceptId: PINV.LOCATION_ACTIVE,
      }),
    );
    expect(d.positions.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        inventoryLocationId: 'loc-new',
        pharmacyProductId: 'product-a',
      }),
    );
  });

  it('keeps reserved and quarantined units on top of the sellable quantity', async () => {
    const d = build({
      existing: position({
        onHandQuantity: '6',
        reservedQuantity: '2',
        quarantineQuantity: '1',
        availableQuantity: '3',
      }),
    });
    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 0 }],
      movement,
    );
    expect(result.position.onHandQuantity).toBe('3');
    expect(result.position.availableQuantity).toBe('0');
    expect(d.ledger.append).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        quantityDelta: '-3',
        movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
      }),
    );
  });

  it('writes no entry when nothing changes', async () => {
    const d = build({
      existing: position({ onHandQuantity: '4', availableQuantity: '4' }),
    });
    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 4 }],
      movement,
    );
    expect(result.changed).toBe(false);
    expect(d.ledger.append).not.toHaveBeenCalled();
    expect(d.ledger.nextSequence).not.toHaveBeenCalled();
  });

  it('asks for one sequence even when it initialises 500 products', async () => {
    const missing = Array.from({ length: 500 }, (_, i) => ({
      productId: `product-${i}`,
      stockQuantity: 3,
      outOfStockDeclared: false,
    }));
    const d = build({
      missing,
      existing: position({ onHandQuantity: '3', availableQuantity: '3' }),
    });
    await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-0', availableQuantity: 3 }],
      movement,
    );
    expect(d.ledger.nextSequence).toHaveBeenCalledTimes(1);
    expect(d.ledger.append).toHaveBeenCalledTimes(500);
    const sequences = d.ledger.append.mock.calls.map(
      ([, e]: any) => e.ledgerSequence,
    );
    expect(new Set(sequences).size).toBe(500);
    expect(sequences[499]).toBe('540');
  });

  it('records the movement type and source of the caller', async () => {
    const d = build({ existing: position({ onHandQuantity: '0' }) });
    await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 7 }],
      {
        movementTypeConceptId: PINV.MV_SYNC_ADJUSTMENT,
        sourceId: 'batch-1',
        actorUserId: 'user-1',
      },
    );
    expect(d.ledger.append).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_SYNC_ADJUSTMENT,
        sourceId: 'batch-1',
        quantityDelta: '7',
        pharmacySiteId: 'site-1',
        pharmacyId: 'pharmacy-1',
      }),
    );
  });
});
