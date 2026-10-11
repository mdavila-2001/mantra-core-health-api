import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { touch, type AuthenticatedUser } from '../../../../common';
import {
  LedgerRepository,
  ReservationsRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';
import type {
  ReleaseConfirmedLinesOptions,
  ReservationReference,
} from './reservation-reference';

/** Devuelve stock confirmado y escribe su movimiento de liberación. */
@Injectable()
export class ReleaseConfirmedReservationLinesUseCase {
  constructor(
    private readonly reservations: ReservationsRepository,
    private readonly stock: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
  ) {}

  async execute(
    tx: EntityManager,
    reservation: ReservationReference,
    actor: AuthenticatedUser,
    options?: ReleaseConfirmedLinesOptions,
  ): Promise<number> {
    const lines = await this.reservations.findLinesByReservation(
      tx,
      reservation.id,
    );
    const only =
      options?.onlyLineIds === undefined ? null : new Set(options.onlyLineIds);
    let released = 0;
    for (const line of lines) {
      if (line.statusConceptId !== PINV.RES_LINE_CONFIRMED) continue;
      if (only !== null && !only.has(line.id)) continue;
      line.statusConceptId = PINV.RES_LINE_RELEASED;
      touch(line, actor.id);
      released += 1;

      if (line.inventoryLocationId) {
        const position = await this.stock.findByKeyForUpdate(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        const sequence = await this.ledger.nextSequence(
          tx,
          reservation.pharmacyId,
        );
        this.ledger.append(tx, {
          pharmacyId: reservation.pharmacyId,
          pharmacySiteId: reservation.pharmacySiteId,
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          ledgerSequence: sequence,
          movementTypeConceptId: PINV.MV_RESERVATION_RELEASE,
          quantityDelta: '0',
          reservationDelta: String(-numericQuantity(line.reservedQuantity)),
          sourceId: reservation.id,
          recordedByUserId: actor.id,
        });
        if (position) {
          position.reservedQuantity = String(
            numericQuantity(position.reservedQuantity) -
              numericQuantity(line.reservedQuantity),
          );
          position.availableQuantity = recomputeAvailableQuantity(
            position.onHandQuantity,
            position.reservedQuantity,
            position.quarantineQuantity,
          );
          position.lastLedgerSequence = sequence;
          position.updatedAt = new Date();
        }
      }
    }
    return released;
  }
}
