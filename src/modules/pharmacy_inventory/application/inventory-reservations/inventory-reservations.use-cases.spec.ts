import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { allowAllScope } from '../scope/pharmacy-inventory-scope.testing';
import { ExpireInventoryReservationsUseCase } from './expire-inventory-reservations.use-case';
import { ReleaseConfirmedReservationLinesUseCase } from './release-confirmed-reservation-lines.use-case';
import { ReserveInventoryUseCase } from './reserve-inventory.use-case';

const logger = { info: jest.fn() };

describe('Inventory reservation use cases', () => {
  it('reserves available stock and updates its ledger position', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const position: any = {
      availableQuantity: '5',
      onHandQuantity: '10',
      reservedQuantity: '1',
      quarantineQuantity: '4',
    };
    const reservations = {
      create: jest.fn(() => ({ id: 'reservation-1' })),
      createLine: jest.fn(() => ({ id: 'line-1' })),
    };
    const stock = { findByKeyForUpdate: jest.fn(async () => position) };
    const ledger = {
      nextSequence: jest.fn(async () => 'sequence-1'),
      append: jest.fn(() => ({ id: 'entry-1' })),
    };
    const useCase = new ReserveInventoryUseCase(
      em as any,
      reservations as any,
      stock as any,
      ledger as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'pharmacy-1',
        {
          pharmacySiteId: 'site-1',
          expiresInMinutes: 30,
          lines: [
            {
              inventoryLocationId: 'location-1',
              pharmacyProductId: 'product-1',
              inventoryLotId: 'lot-1',
              requestedQuantity: 2,
            },
          ],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({
      id: 'reservation-1',
      lineIds: ['line-1'],
      ledgerEntryIds: ['entry-1'],
    });
    expect(reservations.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        pharmacyId: 'pharmacy-1',
        pharmacySiteId: 'site-1',
        reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
      }),
    );
    expect(ledger.append).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_RESERVE,
        quantityDelta: '0',
        reservationDelta: '2',
      }),
    );
    expect(position).toMatchObject({
      reservedQuantity: '3',
      availableQuantity: '3',
    });
    expect(tx.flush).toHaveBeenCalledTimes(2);
  });

  it('rejects a reservation that exceeds available stock', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const useCase = new ReserveInventoryUseCase(
      {
        transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
      } as any,
      { create: jest.fn(() => ({ id: 'reservation-1' })) } as any,
      {
        findByKeyForUpdate: jest.fn(async () => ({ availableQuantity: '1' })),
      } as any,
      {} as any,
      allowAllScope(),
      logger as any,
    );

    await expect(
      useCase.execute(
        'pharmacy-1',
        {
          pharmacySiteId: 'site-1',
          lines: [
            {
              inventoryLocationId: 'location-1',
              pharmacyProductId: 'product-1',
              inventoryLotId: 'lot-1',
              requestedQuantity: 2,
            },
          ],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('expires confirmed reservations and releases their lines in the same transaction', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const reservation: any = {
      id: 'reservation-1',
      pharmacyId: 'pharmacy-1',
      pharmacySiteId: 'site-1',
      reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
    };
    const reservations = { findExpired: jest.fn(async () => [reservation]) };
    const releaseLines = { execute: jest.fn(async () => 2) };
    const useCase = new ExpireInventoryReservationsUseCase(
      {
        transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
      } as any,
      reservations as any,
      releaseLines as any,
      logger as any,
    );
    const actor = { id: 'worker-1' } as any;

    await expect(useCase.execute(actor)).resolves.toEqual({ expiredCount: 1 });
    expect(reservation.reservationStatusConceptId).toBe(
      PINV.RESERVATION_EXPIRED,
    );
    expect(releaseLines.execute).toHaveBeenCalledWith(tx, reservation, actor);
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('releases only selected confirmed lines and records the exact reservation delta', async () => {
    const tx = {};
    const selected: any = {
      id: 'line-1',
      statusConceptId: PINV.RES_LINE_CONFIRMED,
      inventoryLocationId: 'location-1',
      pharmacyProductId: 'product-1',
      inventoryLotId: 'lot-1',
      reservedQuantity: '2.5',
    };
    const other: any = {
      id: 'line-2',
      statusConceptId: PINV.RES_LINE_CONFIRMED,
      inventoryLocationId: 'location-1',
      pharmacyProductId: 'product-2',
      inventoryLotId: 'lot-2',
      reservedQuantity: '1',
    };
    const fulfilled: any = {
      id: 'line-3',
      statusConceptId: PINV.RES_LINE_FULFILLED,
      inventoryLocationId: 'location-1',
      pharmacyProductId: 'product-3',
      inventoryLotId: 'lot-3',
      reservedQuantity: '1',
    };
    const position: any = {
      onHandQuantity: '10',
      reservedQuantity: '3',
      quarantineQuantity: '1',
    };
    const reservations = {
      findLinesByReservation: jest.fn(async () => [selected, other, fulfilled]),
    };
    const stock = { findByKeyForUpdate: jest.fn(async () => position) };
    const ledger = {
      nextSequence: jest.fn(async () => 'sequence-1'),
      append: jest.fn(),
    };
    const useCase = new ReleaseConfirmedReservationLinesUseCase(
      reservations as any,
      stock as any,
      ledger as any,
    );

    await expect(
      useCase.execute(
        tx as any,
        {
          id: 'reservation-1',
          pharmacyId: 'pharmacy-1',
          pharmacySiteId: 'site-1',
        },
        { id: 'user-1' } as any,
        { onlyLineIds: ['line-1'] },
      ),
    ).resolves.toBe(1);
    expect(selected.statusConceptId).toBe(PINV.RES_LINE_RELEASED);
    expect(other.statusConceptId).toBe(PINV.RES_LINE_CONFIRMED);
    expect(fulfilled.statusConceptId).toBe(PINV.RES_LINE_FULFILLED);
    expect(ledger.append).toHaveBeenCalledTimes(1);
    expect(ledger.append).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_RESERVATION_RELEASE,
        reservationDelta: '-2.5',
      }),
    );
    expect(position).toMatchObject({
      reservedQuantity: '0.5',
      availableQuantity: '8.5',
    });
  });
});
