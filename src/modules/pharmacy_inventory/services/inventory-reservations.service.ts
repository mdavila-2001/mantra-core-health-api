import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../repositories';
import { CreateReservationDto, MovementResponseDto, ExpireReservationsResponseDto } from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number => (v == null ? 0 : Number(v));
const recompute = (onHand: string, reserved: string, quarantine: string): string =>
  String(num(onHand) - num(reserved) - num(quarantine));

/** Reservas de stock (UC-25-04) y liberación de reservas vencidas (UC-25-05). */
@Injectable()
export class InventoryReservationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly reservationsRepo: ReservationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryReservationsService.name);
  }

  /** UC-25-04: reserva stock disponible para una prescripción/cotización. */
  async reserve(
    pharmacyId: string,
    dto: CreateReservationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.reservation.create', pharmacyId, lines: dto.lines.length },
      'Reserving stock',
    );
    return this.em.transactional(async (tx) => {
      const expiresAt = new Date(Date.now() + (dto.expiresInMinutes ?? 60) * 60_000);
      const reservation = this.reservationsRepo.create(tx, {
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
        const position = await this.stockRepo.findByKey(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        const available = position ? num(position.availableQuantity) : 0;
        if (available < line.requestedQuantity) {
          throw new PreconditionFailedException('Stock disponible insuficiente para reservar', {
            productId: line.pharmacyProductId,
            available,
            requested: line.requestedQuantity,
          });
        }

        const created = this.reservationsRepo.createLine(tx, {
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

        const sequence = await this.ledgerRepo.nextSequence(tx, pharmacyId);
        const entry = this.ledgerRepo.append(tx, {
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

        position!.reservedQuantity = String(num(position!.reservedQuantity) + line.requestedQuantity);
        position!.availableQuantity = recompute(
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

  /** UC-25-05: worker idempotente que libera reservas CONFIRMED vencidas. */
  async expire(actor: AuthenticatedUser): Promise<ExpireReservationsResponseDto> {
    this.logger.info({ operation: 'pharmacy_inventory.reservation.expire' }, 'Expiring reservations');
    return this.em.transactional(async (tx) => {
      const expired = await this.reservationsRepo.findExpired(tx, PINV.RESERVATION_CONFIRMED, new Date());
      let count = 0;

      for (const reservation of expired) {
        reservation.reservationStatusConceptId = PINV.RESERVATION_EXPIRED;
        reservation.releasedAt = new Date();
        touch(reservation, actor.id);

        const lines = await this.reservationsRepo.findLinesByReservation(tx, reservation.id);
        for (const rl of lines) {
          rl.statusConceptId = PINV.RES_LINE_RELEASED;
          touch(rl, actor.id);

          if (rl.inventoryLocationId) {
            const position = await this.stockRepo.findByKey(tx, {
              inventoryLocationId: rl.inventoryLocationId,
              pharmacyProductId: rl.pharmacyProductId,
              inventoryLotId: rl.inventoryLotId,
            });
            const sequence = await this.ledgerRepo.nextSequence(tx, reservation.pharmacyId);
            this.ledgerRepo.append(tx, {
              pharmacyId: reservation.pharmacyId,
              pharmacySiteId: reservation.pharmacySiteId,
              inventoryLocationId: rl.inventoryLocationId,
              pharmacyProductId: rl.pharmacyProductId,
              inventoryLotId: rl.inventoryLotId,
              ledgerSequence: sequence,
              movementTypeConceptId: PINV.MV_RESERVATION_RELEASE,
              quantityDelta: '0',
              reservationDelta: String(-num(rl.reservedQuantity)),
              sourceId: reservation.id,
              recordedByUserId: actor.id,
            });
            if (position) {
              position.reservedQuantity = String(num(position.reservedQuantity) - num(rl.reservedQuantity));
              position.availableQuantity = recompute(
                position.onHandQuantity,
                position.reservedQuantity,
                position.quarantineQuantity,
              );
              position.lastLedgerSequence = sequence;
              position.updatedAt = new Date();
            }
          }
        }
        count += 1;
      }
      await tx.flush();

      return { expiredCount: count };
    });
  }
}
