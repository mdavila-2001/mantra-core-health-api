import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  allowAllScope,
  SCOPE_PHARMACY_ID,
} from '../scope/pharmacy-inventory-scope.testing';
import { ApproveInventoryCountUseCase } from './approve-inventory-count.use-case';
import { OpenInventoryCountUseCase } from './open-inventory-count.use-case';

const logger = { info: jest.fn() };

describe('Inventory count use cases', () => {
  it('opens a session and snapshots expected on-hand for each requested line', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const positions = {
      findByKey: jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce({ onHandQuantity: '8' })
        .mockResolvedValueOnce(null),
    };
    const sessions = {
      countOpenAtLocation: jest.fn(async () => 0),
      create: jest.fn(() => ({ id: 'session-1' })),
      createLine: jest
        .fn<(...args: any[]) => any>()
        .mockReturnValueOnce({ id: 'line-1' })
        .mockReturnValueOnce({ id: 'line-2' }),
    };
    const useCase = new OpenInventoryCountUseCase(
      em as any,
      sessions as any,
      positions as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'site-1',
        {
          inventoryLocationId: 'loc-1',
          freeze: true,
          items: [
            { pharmacyProductId: 'product-1', inventoryLotId: 'lot-1' },
            { pharmacyProductId: 'product-2', inventoryLotId: 'lot-2' },
          ],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({
      id: 'session-1',
      lineIds: ['line-1', 'line-2'],
      adjustments: 0,
    });
    expect(sessions.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        pharmacySiteId: 'site-1',
        inventoryLocationId: 'loc-1',
        freezeModeConceptId: PINV.COUNT_FREEZE_FULL,
        statusConceptId: PINV.COUNT_FROZEN,
        actorUserId: 'user-1',
      }),
    );
    expect(sessions.createLine).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({ expectedQuantity: '8' }),
    );
    expect(sessions.createLine).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({ expectedQuantity: '0' }),
    );
    expect(tx.flush).toHaveBeenCalledTimes(2);
  });

  it('rejects opening a second count session for the location', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const sessions = { countOpenAtLocation: jest.fn(async () => 1) };
    const useCase = new OpenInventoryCountUseCase(
      em as any,
      sessions as any,
      {} as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'site-1',
        { inventoryLocationId: 'loc-1', freeze: false, items: [] } as any,
        { id: 'user-1' } as any,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves counted lines and writes exact variance adjustments to the ledger and stock', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const session: any = {
      id: 'session-1',
      pharmacySiteId: 'site-1',
      inventoryLocationId: 'loc-1',
      statusConceptId: PINV.COUNT_OPEN,
    };
    const lines = new Map([
      [
        'line-1',
        {
          id: 'line-1',
          inventoryCountSessionId: 'session-1',
          pharmacyProductId: 'product-1',
          inventoryLotId: 'lot-1',
          expectedQuantity: '5',
        },
      ],
      [
        'line-2',
        {
          id: 'line-2',
          inventoryCountSessionId: 'session-1',
          pharmacyProductId: 'product-2',
          inventoryLotId: 'lot-2',
          expectedQuantity: '5',
        },
      ],
    ]);
    const sessions = {
      findById: jest.fn(async () => session),
      findLineById: jest.fn(async (_tx: unknown, id: string) => lines.get(id)),
    };
    const positions = new Map<string, any>([
      [
        'product-1',
        { onHandQuantity: '5', reservedQuantity: '1', quarantineQuantity: '1' },
      ],
      [
        'product-2',
        { onHandQuantity: '5', reservedQuantity: '1', quarantineQuantity: '1' },
      ],
    ]);
    const stock = {
      findByKeyForUpdate: jest.fn(
        async (_tx: unknown, key: { pharmacyProductId: string }) =>
          positions.get(key.pharmacyProductId),
      ),
    };
    const ledger = {
      nextSequence: jest.fn(
        async (_tx: unknown, _siteId: string) => 'sequence-1',
      ),
      append: jest.fn(),
    };
    const useCase = new ApproveInventoryCountUseCase(
      em as any,
      sessions as any,
      stock as any,
      ledger as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'session-1',
        {
          counts: [
            { lineId: 'line-1', countedQuantity: 7 },
            { lineId: 'line-2', countedQuantity: 3 },
          ],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({
      id: 'session-1',
      lineIds: ['line-1', 'line-2'],
      adjustments: 2,
    });
    // PINV-02: el asiento lleva la farmacia verdadera (la de la sede) y la
    // sede, no la sede en el lugar de la farmacia.
    expect(ledger.nextSequence).toHaveBeenCalledWith(tx, SCOPE_PHARMACY_ID);
    expect(ledger.append).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({
        quantityDelta: '2',
        pharmacyId: SCOPE_PHARMACY_ID,
        pharmacySiteId: 'site-1',
      }),
    );
    expect(ledger.append).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({
        quantityDelta: '-2',
        pharmacyId: SCOPE_PHARMACY_ID,
        pharmacySiteId: 'site-1',
      }),
    );
    expect(
      [...positions.values()].map((position) => position.onHandQuantity),
    ).toEqual(['7', '3']);
    expect(
      [...positions.values()].map((position) => position.availableQuantity),
    ).toEqual(['5', '1']);
    expect(session.statusConceptId).toBe(PINV.COUNT_APPROVED);
    expect(session.approvedByUserId).toBe('user-1');
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects approval when the session is not in an approvable state', async () => {
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) =>
        work({ flush: jest.fn() }),
      ),
    };
    const useCase = new ApproveInventoryCountUseCase(
      em as any,
      {
        findById: jest.fn(async () => ({
          id: 'session-1',
          statusConceptId: PINV.COUNT_APPROVED,
        })),
      } as any,
      {} as any,
      {} as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'session-1',
        { counts: [] } as any,
        { id: 'user-1' } as any,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
