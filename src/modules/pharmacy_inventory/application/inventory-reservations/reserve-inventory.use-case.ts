import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  LedgerRepository,
  ReservationsRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import type {
  CreateReservationDto,
  MovementResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';

/** Reserva stock y registra el movimiento contable en una sola transacción. */
@Injectable()
export class ReserveInventoryUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly reservations: ReservationsRepository,
    private readonly stock: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    pharmacyId: string,
    dto: CreateReservationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.reservation.create',
        pharmacyId,
        lines: dto.lines.length,
      },
      'Reserving stock',
    );
    return this.em.transactional(async (tx) => {
      const expiresAt = new Date(
        Date.now() + (dto.expiresInMinutes ?? 60) * 60_000,
      );
      const reservation = this.reservations.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        patientProfileId: dto.patientProfileId,
        medicationRequestId: dto.medicationRequestId,
        quotationId: dto.quotationId,
        reservationStatusConceptId: PINV.RESERVATION_CONFIRMED,
        expiresAt,
        confirmedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      const lineIds: string[] = [];
      const ledgerEntryIds: string[] = [];
      for (const line of dto.lines) {
        const position = await this.stock.findByKeyForUpdate(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        const available = position
          ? numericQuantity(position.availableQuantity)
          : 0;
        if (available < line.requestedQuantity) {
          throw new PreconditionFailedException(
            'Stock disponible insuficiente para reservar',
            {
              productId: line.pharmacyProductId,
              available,
              requested: line.requestedQuantity,
            },
          );
        }

        const created = this.reservations.createLine(tx, {
          inventoryReservationId: reservation.id,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          inventoryLocationId: line.inventoryLocationId,
          requestedQuantity: String(line.requestedQuantity),
          reservedQuantity: String(line.requestedQuantity),
          statusConceptId: PINV.RES_LINE_CONFIRMED,
          actorUserId: actor.id,
        });
        lineIds.push(created.id);

        const sequence = await this.ledger.nextSequence(tx, pharmacyId);
        const entry = this.ledger.append(tx, {
          pharmacyId,
          pharmacySiteId: dto.pharmacySiteId,
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          ledgerSequence: sequence,
          movementTypeConceptId: PINV.MV_RESERVE,
          quantityDelta: '0',
          reservationDelta: String(line.requestedQuantity),
          sourceId: reservation.id,
          recordedByUserId: actor.id,
        });
        ledgerEntryIds.push(entry.id);

        position!.reservedQuantity = String(
          numericQuantity(position!.reservedQuantity) + line.requestedQuantity,
        );
        position!.availableQuantity = recomputeAvailableQuantity(
          position!.onHandQuantity,
          position!.reservedQuantity,
          position!.quarantineQuantity,
        );
        position!.lastLedgerSequence = sequence;
        position!.updatedAt = new Date();
      }
      await tx.flush();
      return { id: reservation.id, lineIds, ledgerEntryIds };
    });
  }
}
