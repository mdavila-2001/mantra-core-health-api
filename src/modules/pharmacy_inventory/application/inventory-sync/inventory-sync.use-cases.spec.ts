import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { reconcileSyncItem } from '../../domain/sync/reconciliation';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { CreateInventorySyncBatchUseCase } from './create-inventory-sync-batch.use-case';
import { ReconcileInventorySyncBatchUseCase } from './reconcile-inventory-sync-batch.use-case';

const logger = { info: jest.fn() };

describe('Inventory sync use cases', () => {
  it('ingests a batch and reuses items with an existing idempotency key', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const sync = {
      createBatch: jest.fn(() => ({ id: 'batch-1' })),
      findItemByIdempotencyKey: jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce({ id: 'item-existing' })
        .mockResolvedValueOnce(null),
      createItem: jest.fn(() => ({ id: 'item-new' })),
      findBatchById: jest.fn(async () => ({
        id: 'batch-0',
        pharmacyIntegrationConnectionId: 'connection-1',
      })),
    };
    const useCase = new CreateInventorySyncBatchUseCase(
      em as any,
      sync as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        {
          pharmacyIntegrationConnectionId: 'connection-1',
          sourceBatchIdentifier: 'erp-batch-1',
          items: [
            {
              idempotencyKey: 'item-key-1',
              pharmacyProductId: 'product-1',
              externalProductCode: 'EXT-1',
              externalQuantity: 3,
            },
            {
              idempotencyKey: 'item-key-2',
              pharmacyProductId: 'product-2',
              externalProductCode: 'EXT-2',
              externalQuantity: 4,
            },
          ],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({
      id: 'batch-1',
      itemIds: ['item-existing', 'item-new'],
    });
    expect(sync.createBatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        directionConceptId: PINV.SYNC_DIRECTION_INBOUND,
        statusConceptId: PINV.BATCH_RECEIVED,
        actorUserId: 'user-1',
      }),
    );
    expect(sync.createItem).toHaveBeenCalledTimes(1);
    expect(sync.createItem).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        pharmacyInventorySyncBatchId: 'batch-1',
        externalQuantity: '4',
        reconciliationStatusConceptId: PINV.SYNC_ITEM_PENDING,
      }),
    );
    expect(tx.flush).toHaveBeenCalledTimes(2);
  });

  it('classifies mapped and unmapped items and completes the received batch', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const batch: any = {
      id: 'batch-1',
      statusConceptId: PINV.BATCH_RECEIVED,
    };
    const items: any[] = [
      { pharmacyProductId: 'product-1', externalQuantity: '3.25' },
      { pharmacyProductId: null, externalQuantity: '2' },
    ];
    const sync = {
      findBatchById: jest.fn(async () => batch),
      findItems: jest.fn(async () => items),
    };
    const useCase = new ReconcileInventorySyncBatchUseCase(
      {
        transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
      } as any,
      sync as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute('batch-1', { id: 'worker-1' } as any),
    ).resolves.toEqual({
      batchId: 'batch-1',
      itemsProcessed: 2,
      discrepancies: 1,
    });
    expect(items[0]).toMatchObject({
      reconciliationStatusConceptId: PINV.SYNC_ITEM_MATCHED,
      normalizedQuantity: '3.25',
    });
    expect(items[1]).toMatchObject({
      reconciliationStatusConceptId: PINV.SYNC_ITEM_DISCREPANCY,
      errorCode: 'UNMAPPED_PRODUCT',
      errorDetail: 'No se encontró un producto para el código externo',
    });
    expect(batch).toMatchObject({
      statusConceptId: PINV.BATCH_COMPLETED,
      itemCount: 2,
      completedAt: expect.any(Date),
    });
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects a batch that has already left RECEIVED', async () => {
    const useCase = new ReconcileInventorySyncBatchUseCase(
      {
        transactional: jest.fn(async (work: (tx: any) => unknown) => work({})),
      } as any,
      {
        findBatchById: jest.fn(async () => ({
          id: 'batch-1',
          statusConceptId: PINV.BATCH_COMPLETED,
        })),
      } as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute('batch-1', { id: 'worker-1' } as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('keeps reconciliation classification pure and deterministic', () => {
    expect(reconcileSyncItem('product-1', undefined)).toEqual({
      statusConceptId: PINV.SYNC_ITEM_MATCHED,
      normalizedQuantity: '0',
    });
    expect(reconcileSyncItem(null, '1')).toEqual({
      statusConceptId: PINV.SYNC_ITEM_DISCREPANCY,
      errorCode: 'UNMAPPED_PRODUCT',
      errorDetail: 'No se encontró un producto para el código externo',
    });
  });
});
