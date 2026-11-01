import { jest } from '@jest/globals';
import { PendingOrderLines } from './pending-order-lines';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

function fixture(available = 10, reserved = 0) {
  const position = {
    pharmacyProductId: 'product',
    availableQuantity: String(available),
    reservedQuantity: String(reserved),
    quarantineQuantity: '0',
    inventoryLotId: undefined as string | undefined,
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
        targets: readonly { productId: string; availableQuantity: number }[],
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
  return { service, order, position, writer };
}

describe('C9 pending and connected stock', () => {
  it('rejects an explicit aggregate confirmation of a pending lot product without changing its stock', async () => {
    const f = fixture(5, 2);
    f.position.inventoryLotId = 'lot';
    const original = { ...f.position };
    const line = {
      pharmacyProductId: 'product',
      requestedQuantity: '3',
      reservedQuantity: '0',
      statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
    };
    await expect(
      f.service.resolveOnConfirm(
        {} as never,
        f.order,
        [line] as never,
        [{ productId: 'product', decision: 'CONFIRMAR_STOCK', quantity: 5 }],
        { tenantId: 'tenant' },
        { id: 'user' } as never,
      ),
    ).rejects.toMatchObject({
      status: 422,
      response: expect.objectContaining({
        reason: 'SITE_PRODUCT_KEPT_BY_LOTS',
      }),
    });
    expect(f.writer.write).not.toHaveBeenCalled();
    expect(f.position).toEqual(original);
    expect(line.statusConceptId).toBe(PINV.RES_LINE_PENDING_CONFIRMATION);
    expect(line.reservedQuantity).toBe('0');
  });

  it('preserves lot positions when the legacy confirmation supplies no aggregate adjustment', async () => {
    const f = fixture(5, 2);
    f.position.inventoryLotId = 'lot';
    const original = { ...f.position };
    const line = {
      pharmacyProductId: 'product',
      requestedQuantity: '3',
      statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
    };
    const result = await f.service.resolveOnConfirm(
      {} as never,
      f.order,
      [line] as never,
      [],
      { tenantId: 'tenant' },
      { id: 'user' } as never,
    );
    expect(result.toReserve).toEqual([{ line, positions: [f.position] }]);
    expect(f.writer.write).not.toHaveBeenCalled();
    expect(f.position).toEqual(original);
  });

  it('no duplica un conteo agregado encima de posiciones por lote', async () => {
    const f = fixture(5);
    f.position.inventoryLotId = 'lot';
    await expect(
      f.service.writeLiveStock(
        {} as never,
        f.order,
        'tenant',
        'product',
        5,
        'user',
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: 'SITE_PRODUCT_KEPT_BY_LOTS',
      }),
    });
    expect(f.writer.write).not.toHaveBeenCalled();
  });
  it('uses the explicit count even when the site already has a position', async () => {
    const f = fixture();
    await f.service.resolveOnConfirm(
      {} as never,
      f.order,
      [
        {
          pharmacyProductId: 'product',
          requestedQuantity: '5',
          statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
        },
      ] as never,
      [{ productId: 'product', decision: 'CONFIRMAR_STOCK', quantity: 2 }],
      { tenantId: 'tenant' } as never,
      { id: 'user' } as never,
    );
    expect(f.writer.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      [{ productId: 'product', availableQuantity: 2 }],
      expect.anything(),
    );
  });
  it('does not make the same ERP units available again while locally reserved', async () => {
    const f = fixture(5);
    await f.service.writeLiveStock(
      {} as never,
      f.order,
      'tenant',
      'product',
      5,
      'user',
    );
    f.position.reservedQuantity = '5';
    f.position.availableQuantity = '0';
    await f.service.writeLiveStock(
      {} as never,
      f.order,
      'tenant',
      'product',
      5,
      'user',
    );
    expect(f.position.availableQuantity).toBe('0');
  });
});
