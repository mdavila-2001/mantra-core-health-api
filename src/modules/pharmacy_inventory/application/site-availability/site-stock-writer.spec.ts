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
  existing?: Position | null;
  /** Ubicaciones activas de la sede, además de la por defecto. */
  otherLocations?: { id: string }[];
  /** Posiciones sin lote en esas otras ubicaciones. */
  elsewhere?: Position[];
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
    findActiveInSite: jest.fn(async () => [
      ...(options.location === null
        ? []
        : [options.location ?? { id: 'loc-1' }]),
      ...(options.otherLocations ?? []),
    ]),
  };
  const created: Position[] = [];
  const positions = {
    findByKeyForUpdate: jest.fn(async () => options.existing ?? null),
    findLooseForUpdate: jest.fn(async () => options.elsewhere ?? []),
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

  it('locks every position of the write before the ledger: site → positions → ledger', async () => {
    const d = build({});
    const order: string[] = [];
    d.tx.execute.mockImplementation((async (_sql: string, params: string[]) => {
      order.push(params[0]);
      return [];
    }) as any);
    d.positions.findByKeyForUpdate.mockImplementation((async (
      _tx: unknown,
      key: { pharmacyProductId: string },
    ) => {
      order.push(`position:${key.pharmacyProductId}`);
      return null;
    }) as any);
    d.ledger.nextSequence.mockImplementation(async () => {
      order.push('ledger');
      return '41';
    });

    await d.writer.write(
      d.tx as any,
      SITE,
      [
        { productId: 'product-a', availableQuantity: 2 },
        { productId: 'product-b', availableQuantity: 5 },
      ],
      movement,
    );

    expect(order).toEqual([
      'pharmacy_inventory.site:site-1',
      'position:product-a',
      'position:product-b',
      'ledger',
    ]);
  });

  it('lockSite takes the same site lock as a write', async () => {
    const d = build({});
    await d.writer.lockSite(d.tx as any, 'site-9');
    expect(d.tx.execute).toHaveBeenCalledWith(
      'select pg_advisory_xact_lock(hashtext(?))',
      ['pharmacy_inventory.site:site-9'],
    );
  });

  it('writes only the requested products: a product without a position stays on the catalogue', async () => {
    const d = build({});

    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 0 }],
      movement,
    );

    expect(d.created.map((p) => p.pharmacyProductId)).toEqual(['product-a']);
    expect(result.position.availableQuantity).toBe('0');
  });

  it('the first «No lo tengo» on a product without a position leaves an entry', async () => {
    const d = build({});

    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 0 }],
      movement,
    );

    // No mueve unidades, pero desde ahí la sede lo lleva por el libro: queda
    // el asiento de quién y cuándo lo decidió.
    expect(d.ledger.append).toHaveBeenCalledTimes(1);
    expect(d.ledger.append).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        pharmacyProductId: 'product-a',
        quantityDelta: '0',
        movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
        recordedByUserId: 'user-1',
      }),
    );
    expect(result.changed).toBe(true);
    expect(result.position.lastLedgerSequence).toBe('41');
  });

  it('«No lo tengo» also zeroes the loose stock left in another active location', async () => {
    const other = position({
      inventoryLocationId: 'loc-2',
      onHandQuantity: '5',
      reservedQuantity: '1',
      availableQuantity: '4',
    });
    const d = build({
      existing: position({ onHandQuantity: '2', availableQuantity: '2' }),
      otherLocations: [{ id: 'loc-2' }],
      elsewhere: [other],
    });

    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 0 }],
      movement,
    );

    // Solo se buscan las otras ubicaciones, y con bloqueo.
    expect(d.positions.findLooseForUpdate).toHaveBeenCalledWith(
      d.tx,
      ['loc-2'],
      ['product-a'],
    );
    expect(result.position.availableQuantity).toBe('0');
    // Lo reservado por un pedido sigue en pie; lo vendible queda en cero.
    expect(other.onHandQuantity).toBe('1');
    expect(other.availableQuantity).toBe('0');
    expect(d.ledger.append).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        inventoryLocationId: 'loc-2',
        quantityDelta: '-4',
      }),
    );
    expect(d.ledger.append).toHaveBeenCalledTimes(2);
    expect(result.changed).toBe(true);
  });

  it('«Lo tengo, 3» leaves 3 for sale in the site, not 3 plus what another location held', async () => {
    const other = position({
      inventoryLocationId: 'loc-2',
      onHandQuantity: '4',
      availableQuantity: '4',
    });
    const d = build({
      existing: position({ onHandQuantity: '0', availableQuantity: '0' }),
      otherLocations: [{ id: 'loc-2' }],
      elsewhere: [other],
    });

    const [result] = await d.writer.write(
      d.tx as any,
      SITE,
      [{ productId: 'product-a', availableQuantity: 3 }],
      movement,
    );

    expect(result.position.availableQuantity).toBe('3');
    expect(other.availableQuantity).toBe('0');
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

  it('asks for one sequence even when it writes 500 products', async () => {
    const d = build({});
    const targets = Array.from({ length: 500 }, (_, i) => ({
      productId: `product-${i}`,
      availableQuantity: 3,
    }));
    await d.writer.write(d.tx as any, SITE, targets, movement);
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
