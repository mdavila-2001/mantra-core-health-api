import { jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { TransferInventoryUseCase } from './transfer-inventory.use-case';

describe('TransferInventoryUseCase', () => {
  const dto = {
    pharmacySiteId: 'site-1',
    fromLocationId: 'from-1',
    toLocationId: 'to-1',
    pharmacyProductId: 'product-1',
    inventoryLotId: 'lot-1',
    quantity: 3,
  };

  it('writes correlated out/in ledger entries and updates both stock positions transactionally', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const fromPosition = {
      onHandQuantity: '8',
      availableQuantity: '7',
      reservedQuantity: '1',
      quarantineQuantity: '0',
    };
    const toPosition = {
      onHandQuantity: '2',
      availableQuantity: '1',
      reservedQuantity: '1',
      quarantineQuantity: '0',
    };
    const stock = {
      findByKeyForUpdate: jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce(fromPosition)
        .mockResolvedValueOnce(toPosition),
      create: jest.fn(),
    };
    const ledger = {
      nextSequence: jest
        .fn<(...args: any[]) => Promise<string>>()
        .mockResolvedValueOnce('10')
        .mockResolvedValueOnce('11'),
      append: jest
        .fn<(...args: any[]) => any>()
        .mockReturnValueOnce({ id: 'ledger-out' })
        .mockReturnValueOnce({ id: 'ledger-in' }),
    };
    const useCase = new TransferInventoryUseCase(
      em as any,
      stock as any,
      ledger as any,
      allowAllScope(),
      { info: jest.fn() } as any,
    );

    const result = await useCase.execute(
      'pharmacy-1',
      dto as any,
      {
        id: 'actor-1',
      } as any,
    );

    expect(result).toEqual({
      correlationId: expect.any(String),
      outLedgerEntryId: 'ledger-out',
      inLedgerEntryId: 'ledger-in',
    });
    const correlationId = result.correlationId;
    expect(ledger.append).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_TRANSFER_OUT,
        quantityDelta: '-3',
        correlationId,
        recordedByUserId: 'actor-1',
      }),
    );
    expect(ledger.append).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_TRANSFER_IN,
        quantityDelta: '3',
        correlationId,
        recordedByUserId: 'actor-1',
      }),
    );
    expect(fromPosition).toMatchObject({
      onHandQuantity: '5',
      availableQuantity: '4',
      lastLedgerSequence: '10',
    });
    expect(toPosition).toMatchObject({
      onHandQuantity: '5',
      availableQuantity: '4',
      lastLedgerSequence: '11',
    });
    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(tx.flush).toHaveBeenCalledTimes(2);
  });

  it('rejects a transfer when source stock is insufficient', async () => {
    const tx = { flush: jest.fn() };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const ledger = { nextSequence: jest.fn(), append: jest.fn() };
    const useCase = new TransferInventoryUseCase(
      em as any,
      {
        findByKeyForUpdate: jest.fn(async () => ({ availableQuantity: '2' })),
      } as any,
      ledger as any,
      allowAllScope(),
      { info: jest.fn() } as any,
    );

    await expect(
      useCase.execute('pharmacy-1', dto as any, { id: 'actor-1' } as any),
    ).rejects.toThrow('Stock disponible insuficiente en origen');
    expect(ledger.append).not.toHaveBeenCalled();
  });
});
