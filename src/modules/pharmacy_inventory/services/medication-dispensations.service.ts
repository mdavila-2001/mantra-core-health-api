import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DispensationsRepository,
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../repositories';
import { CreateDispensationDto, ReverseDispensationDto, MovementResponseDto, StatusResultDto } from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number => (v == null ? 0 : Number(v));
const recompute = (onHand: string, reserved: string, quarantine: string): string =>
  String(num(onHand) - num(reserved) - num(quarantine));

/** Dispensación de prescripciones (UC-25-03) y su reversión/devolución (UC-25-11). */
@Injectable()
export class MedicationDispensationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly dispensationsRepo: DispensationsRepository,
    private readonly reservationsRepo: ReservationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicationDispensationsService.name);
  }

  /** UC-25-03: dispensa una prescripción, descontando stock del lote. */
  async dispense(
    pharmacyId: string,
    dto: CreateDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.dispensation.create', pharmacyId, patient: dto.patientProfileId },
      'Dispensing medication',
    );
    return this.em.transactional(async (tx) => {
      if (dto.inventoryReservationId) {
        const reservation = await this.reservationsRepo.findById(tx, dto.inventoryReservationId);
        if (!reservation) {
          throw new ResourceNotFoundException('Reserva no encontrada', {
            reservationId: dto.inventoryReservationId,
          });
        }
      }

      const dispensation = this.dispensationsRepo.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        patientProfileId: dto.patientProfileId,
        medicationRequestId: dto.medicationRequestId,
        inventoryReservationId: dto.inventoryReservationId,
        dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
        dispensedAt: new Date(),
        idempotencyKey: dto.idempotencyKey,
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
        if (!position || num(position.onHandQuantity) < line.dispensedQuantity) {
          throw new PreconditionFailedException('Stock insuficiente para dispensar', {
            productId: line.pharmacyProductId,
            onHand: position ? num(position.onHandQuantity) : 0,
            requested: line.dispensedQuantity,
          });
        }

        const created = this.dispensationsRepo.createLine(tx, {
          medicationDispensationId: dispensation.id,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          dispensedQuantity: String(line.dispensedQuantity),
          patientAmount: line.patientAmount != null ? String(line.patientAmount) : undefined,
          insurerAmount: line.insurerAmount != null ? String(line.insurerAmount) : undefined,
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
          movementTypeConceptId: PINV.MV_DISPENSE,
          quantityDelta: String(-line.dispensedQuantity),
          sourceId: dispensation.id,
          recordedByUserId: actor.id,
        });
        ledgerEntryIds.push(entry.id);

        position.onHandQuantity = String(num(position.onHandQuantity) - line.dispensedQuantity);
        // Si la reserva cubría este lote, se libera al dispensar.
        if (dto.inventoryReservationId && num(position.reservedQuantity) >= line.dispensedQuantity) {
          position.reservedQuantity = String(num(position.reservedQuantity) - line.dispensedQuantity);
        }
        position.availableQuantity = recompute(
          position.onHandQuantity,
          position.reservedQuantity,
          position.quarantineQuantity,
        );
        position.lastLedgerSequence = sequence;
        position.updatedAt = new Date();
      }

      if (dto.inventoryReservationId) {
        const reservation = await this.reservationsRepo.findById(tx, dto.inventoryReservationId);
        if (reservation) {
          reservation.reservationStatusConceptId = PINV.RESERVATION_FULFILLED;
          touch(reservation, actor.id);
          const rlines = await this.reservationsRepo.findLinesByReservation(tx, reservation.id);
          for (const rl of rlines) {
            rl.fulfilledQuantity = rl.reservedQuantity;
            rl.statusConceptId = PINV.RES_LINE_FULFILLED;
            touch(rl, actor.id);
          }
        }
      }
      await tx.flush();

      return { id: dispensation.id, lineIds, ledgerEntryIds };
    });
  }

  /** UC-25-11: reversa una dispensación con un asiento compensatorio. */
  async reverse(
    id: string,
    dto: ReverseDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info({ operation: 'pharmacy_inventory.dispensation.reverse', dispensationId: id }, 'Reversing dispensation');
    return this.em.transactional(async (tx) => {
      const dispensation = await this.dispensationsRepo.findById(tx, id);
      if (!dispensation) {
        throw new ResourceNotFoundException('Dispensación no encontrada', { dispensationId: id });
      }
      if (dispensation.dispensationStatusConceptId !== PINV.DISPENSE_DISPENSED) {
        throw new PreconditionFailedException('La dispensación no está en estado reversible', {
          dispensationId: id,
        });
      }

      dispensation.dispensationStatusConceptId = PINV.DISPENSE_REVERSED;
      touch(dispensation, actor.id);

      const lines = await this.dispensationsRepo.findLines(tx, id);
      for (const dl of lines) {
        const locationId = dto.inventoryLocationId;
        const sequence = await this.ledgerRepo.nextSequence(tx, dispensation.pharmacyId);
        if (locationId) {
          this.ledgerRepo.append(tx, {
            pharmacyId: dispensation.pharmacyId,
            pharmacySiteId: dispensation.pharmacySiteId,
            inventoryLocationId: locationId,
            pharmacyProductId: dl.pharmacyProductId,
            inventoryLotId: dl.inventoryLotId,
            ledgerSequence: sequence,
            movementTypeConceptId: PINV.MV_DISPENSE_REVERSAL,
            quantityDelta: String(num(dl.dispensedQuantity)),
            sourceId: dispensation.id,
            recordedByUserId: actor.id,
          });
          const position = await this.stockRepo.findByKey(tx, {
            inventoryLocationId: locationId,
            pharmacyProductId: dl.pharmacyProductId,
            inventoryLotId: dl.inventoryLotId,
          });
          if (position) {
            position.onHandQuantity = String(num(position.onHandQuantity) + num(dl.dispensedQuantity));
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
      await tx.flush();

      return { id: dispensation.id, status: 'REVERSED' };
    });
  }
}
