import { jest } from '@jest/globals';
import { PendingOrderLines } from './pending-order-lines';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

function fixture(lot?: string) {
  const position = {
    pharmacyProductId: 'product',
    inventoryLotId: lot,
    availableQuantity: '5',
    reservedQuantity: '2',
    quarantineQuantity: '0',
  };
  const read = {
    findActiveLocationsBySites: jest.fn(async () => [{ id: 'location' }]),
    findStockPositions: jest.fn(async () => [position]),
  };
  const writer = {
    lockSite: jest.fn(async () => undefined),
    write: jest.fn(
      async (
        _tx: unknown,
        _site: unknown,
        targets: readonly { availableQuantity: number }[],
      ) => {
        position.availableQuantity = String(targets[0].availableQuantity);
        return [];
      },
    ),
  };
  const service = new PendingOrderLines(read as never, writer as never);
  const order = {
    id: 'order',
    pharmacyId: 'pharmacy',
    pharmacySiteId: 'site',
  } as never;
  const line = {
    pharmacyProductId: 'product',
    requestedQuantity: '3',
    reservedQuantity: '0',
    statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
  };
  return { service, writer, position, order, line };
}

describe('approved aggregate confirmation contract', () => {
  it('rejects an aggregate count over lot positions without changing stock or the pending line', async () => {
    const f = fixture('lot');
    const before = { ...f.position };
    await expect(
      f.service.resolveOnConfirm(
        {} as never,
        f.order,
        [f.line] as never,
        [{ productId: 'product', decision: 'CONFIRMAR_STOCK', quantity: 3 }],
        { tenantId: 'tenant' },
        { id: 'actor' } as never,
      ),
    ).rejects.toMatchObject({
      status: 422,
      response: expect.objectContaining({
        reason: 'SITE_PRODUCT_KEPT_BY_LOTS',
      }),
    });
    expect(f.writer.write).not.toHaveBeenCalled();
    expect(f.position).toEqual(before);
    expect(f.line.statusConceptId).toBe(PINV.RES_LINE_PENDING_CONFIRMATION);
  });

  it('preserves canonical ledger authority on an existing loose position', async () => {
    const f = fixture();
    await f.service.resolveOnConfirm(
      {} as never,
      f.order,
      [f.line] as never,
      [{ productId: 'product', decision: 'CONFIRMAR_STOCK', quantity: 9 }],
      { tenantId: 'tenant' },
      { id: 'actor' } as never,
    );
    expect(f.position.availableQuantity).toBe('5');
    expect(f.writer.write).not.toHaveBeenCalled();
    expect(f.position.reservedQuantity).toBe('2');
  });

  it('preserves legacy confirmation without an aggregate adjustment', async () => {
    const f = fixture('lot');
    const result = await f.service.resolveOnConfirm(
      {} as never,
      f.order,
      [f.line] as never,
      [],
      { tenantId: 'tenant' },
      { id: 'actor' } as never,
    );
    expect(result.toReserve).toEqual([
      { line: f.line, positions: [f.position] },
    ]);
    expect(f.writer.write).not.toHaveBeenCalled();
  });
});
