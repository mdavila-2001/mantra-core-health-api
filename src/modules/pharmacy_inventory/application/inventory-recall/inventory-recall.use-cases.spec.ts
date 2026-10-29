import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  allowAllScope,
  SCOPE_PHARMACY_ID,
} from '../scope/pharmacy-inventory-scope.testing';
import { CreateRecallHoldUseCase } from './create-recall-hold.use-case';
import { ReleaseRecallHoldUseCase } from './release-recall-hold.use-case';

const logger = { info: jest.fn() };

describe('Inventory recall use cases', () => {
  it('creates an active hold and quarantines all on-hand stock in the specified position', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const lot: any = { id: 'lot-1' };
    const position: any = {
      onHandQuantity: '9',
      reservedQuantity: '2',
      quarantineQuantity: '1',
    };
    const holds = { create: jest.fn(() => ({ id: 'hold-1' })) };
    const lots = { findById: jest.fn(async () => lot) };
    const stock = { findByKey: jest.fn(async () => position) };
    const ledger = {
      nextSequence: jest.fn(async () => 'sequence-1'),
      append: jest.fn(),
    };
    const useCase = new CreateRecallHoldUseCase(
      em as any,
      holds as any,
      lots as any,
      stock as any,
      ledger as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        {
          pharmacyId: 'pharmacy-1',
          pharmacySiteId: 'site-1',
          inventoryLocationId: 'location-1',
          pharmacyProductId: 'product-1',
          inventoryLotId: 'lot-1',
          recallReference: 'RECALL-1',
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({ id: 'hold-1' });
    expect(holds.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        inventoryLotId: 'lot-1',
        recallReference: 'RECALL-1',
        holdStatusConceptId: PINV.HOLD_ACTIVE,
        actorUserId: 'user-1',
      }),
    );
    expect(lot.recallStatusConceptId).toBe(PINV.LOT_RECALLED);
    expect(position.quarantineQuantity).toBe('10');
    expect(position.availableQuantity).toBe('-3');
    expect(ledger.append).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_QUARANTINE_HOLD,
        quantityDelta: '0',
        quarantineDelta: '9',
      }),
    );
    expect(tx.flush).toHaveBeenCalledTimes(2);
  });

  it('releases quarantine without reducing on-hand stock', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const hold: any = {
      id: 'hold-1',
      holdStatusConceptId: PINV.HOLD_ACTIVE,
      pharmacyProductId: 'product-1',
      inventoryLotId: 'lot-1',
    };
    const lot: any = { id: 'lot-1', pharmacyProductId: 'product-1' };
    const positions: any[] = [
      {
        inventoryLocationId: 'location-1',
        pharmacyProductId: 'product-1',
        inventoryLotId: 'lot-1',
        onHandQuantity: '10',
        reservedQuantity: '2',
        quarantineQuantity: '4',
      },
    ];
    const holds = { findById: jest.fn(async () => hold) };
    const lots = { findById: jest.fn(async () => lot) };
    const stock = { findByLot: jest.fn(async () => positions) };
    const ledger = {
      nextSequence: jest.fn(async () => 'sequence-1'),
      append: jest.fn(),
    };
    const useCase = new ReleaseRecallHoldUseCase(
      em as any,
      holds as any,
      lots as any,
      stock as any,
      ledger as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'hold-1',
        { writeOff: false } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({ id: 'hold-1', status: 'RELEASED' });
    expect(hold.holdStatusConceptId).toBe(PINV.HOLD_RELEASED);
    expect(lot.recallStatusConceptId).toBe(PINV.LOT_RECALL_CLEARED);
    expect(positions[0]).toMatchObject({
      onHandQuantity: '10',
      quarantineQuantity: '0',
      availableQuantity: '8',
    });
    // PINV-02: farmacia y sede verdaderas, y secuencia de la farmacia; no el
    // id de la ubicación en su lugar.
    expect(ledger.nextSequence).toHaveBeenCalledWith(tx, SCOPE_PHARMACY_ID);
    expect(ledger.append).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        pharmacyId: SCOPE_PHARMACY_ID,
        pharmacySiteId: 'site-1',
        inventoryLocationId: 'location-1',
        movementTypeConceptId: PINV.MV_QUARANTINE_RELEASE,
        quantityDelta: '0',
        quarantineDelta: '-4',
      }),
    );
  });

  it('writes quarantined stock off when requested', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const position: any = {
      inventoryLocationId: 'location-1',
      pharmacyProductId: 'product-1',
      inventoryLotId: 'lot-1',
      onHandQuantity: '10',
      reservedQuantity: '1',
      quarantineQuantity: '4',
    };
    const ledger = {
      nextSequence: jest.fn(async () => 'sequence-1'),
      append: jest.fn(),
    };
    const useCase = new ReleaseRecallHoldUseCase(
      em as any,
      {
        findById: jest.fn(async () => ({
          id: 'hold-1',
          holdStatusConceptId: PINV.HOLD_ACTIVE,
          pharmacyProductId: 'product-1',
          inventoryLotId: 'lot-1',
        })),
      } as any,
      {
        findById: jest.fn(async () => ({
          id: 'lot-1',
          pharmacyProductId: 'product-1',
        })),
      } as any,
      { findByLot: jest.fn(async () => [position]) } as any,
      ledger as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'hold-1',
        { writeOff: true } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({ id: 'hold-1', status: 'WRITTEN_OFF' });
    expect(position).toMatchObject({
      onHandQuantity: '6',
      quarantineQuantity: '0',
      availableQuantity: '5',
    });
    expect(ledger.append).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_WRITE_OFF,
        quantityDelta: '-4',
        quarantineDelta: '-4',
      }),
    );
  });

  it('rejects releasing a hold that is not active', async () => {
    const useCase = new ReleaseRecallHoldUseCase(
      {
        transactional: jest.fn(async (work: (tx: any) => unknown) => work({})),
      } as any,
      {
        findById: jest.fn(async () => ({
          id: 'hold-1',
          holdStatusConceptId: PINV.HOLD_RELEASED,
        })),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'hold-1',
        { writeOff: false } as any,
        { id: 'user-1' } as any,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
