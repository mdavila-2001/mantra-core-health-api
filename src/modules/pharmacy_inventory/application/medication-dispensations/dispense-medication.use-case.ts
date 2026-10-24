import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  DispensationsRepository,
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../../infrastructure/repositories';
import {
  CreateDispensationDto,
  MovementResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { ORDER_STATUS_IDS } from '../../domain/order-status-ids';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

const num = (v: string | null | undefined): number =>
  v == null ? 0 : Number(v);

const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Dispensación transaccional e idempotente de una prescripción. */
@Injectable()
export class DispenseMedicationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly dispensationsRepo: DispensationsRepository,
    private readonly reservationsRepo: ReservationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
  ) {}

  /** UC-25-03: dispensa una prescripción, descontando stock del lote. */
  async execute(
    pharmacyId: string,
    dto: CreateDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.dispensation.create',
        pharmacyId,
        patient: dto.patientProfileId,
      },
      'Dispensing medication',
    );
    return this.em.transactional(async (tx) => {
      const pharmacy = await this.scope.requireManagedPharmacy(
        tx,
        pharmacyId,
        actor,
      );

      // Idempotencia: un retry con la misma clave devuelve la dispensación ya
      // creada SIN repetir el descuento de stock ni los asientos del ledger.
      if (dto.idempotencyKey) {
        const existing = await this.dispensationsRepo.findByIdempotencyKey(
          tx,
          pharmacyId,
          dto.idempotencyKey,
        );
        if (existing) {
          const existingLines = await this.dispensationsRepo.findLines(
            tx,
            existing.id,
          );
          const existingLedgerIds = await this.ledgerRepo.findEntryIdsBySource(
            tx,
            existing.id,
          );
          return {
            id: existing.id,
            lineIds: existingLines.map((l) => l.id),
            ledgerEntryIds: existingLedgerIds,
          };
        }
      }

      // Sede, ubicaciones, productos, lotes, paciente y receta: toda la cadena
      // se resuelve antes de la primera escritura.
      const site = await this.scope.requireSite(
        tx,
        pharmacy,
        dto.pharmacySiteId,
      );
      await this.scope.requirePatientContext(
        tx,
        dto.patientProfileId,
        dto.medicationRequestId,
      );
      for (const line of dto.lines) {
        await this.scope.requireStockKey(tx, site, line);
      }

      if (dto.inventoryReservationId) {
        const reservation = await this.reservationsRepo.findById(
          tx,
          dto.inventoryReservationId,
        );
        // La reserva debe ser de esta farmacia y de esta sede.
        if (
          !reservation ||
          reservation.pharmacyId !== pharmacy.pharmacyId ||
          reservation.pharmacySiteId !== site.siteId
        ) {
          throw this.scope.notAvailable();
        }
        // Un pedido de paciente NO se dispensa por acá: su entrega exige el
        // código de retiro y acumula por línea (FAR-E3). Esta ruta cierra la
        // reserva entera de un golpe, y sobre un pedido eso sería saltarse la
        // prueba de posesión y pisar la máquina de estados del mostrador.
        if (ORDER_STATUS_IDS.includes(reservation.reservationStatusConceptId)) {
          throw new PreconditionFailedException(
            'La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /pharmacy/orders/:id/dispense',
            { reservationId: dto.inventoryReservationId },
          );
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
        const position = await this.stockRepo.findByKeyForUpdate(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        if (
          !position ||
          num(position.onHandQuantity) < line.dispensedQuantity
        ) {
          throw new PreconditionFailedException(
            'Stock insuficiente para dispensar',
            {
              productId: line.pharmacyProductId,
              onHand: position ? num(position.onHandQuantity) : 0,
              requested: line.dispensedQuantity,
            },
          );
        }

        const created = this.dispensationsRepo.createLine(tx, {
          medicationDispensationId: dispensation.id,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          dispensedQuantity: String(line.dispensedQuantity),
          patientAmount:
            line.patientAmount != null ? String(line.patientAmount) : undefined,
          insurerAmount:
            line.insurerAmount != null ? String(line.insurerAmount) : undefined,
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

        position.onHandQuantity = String(
          num(position.onHandQuantity) - line.dispensedQuantity,
        );
        // Si la reserva cubría este lote, se libera al dispensar.
        if (
          dto.inventoryReservationId &&
          num(position.reservedQuantity) >= line.dispensedQuantity
        ) {
          position.reservedQuantity = String(
            num(position.reservedQuantity) - line.dispensedQuantity,
          );
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
        const reservation = await this.reservationsRepo.findById(
          tx,
          dto.inventoryReservationId,
        );
        if (reservation) {
          reservation.reservationStatusConceptId = PINV.RESERVATION_FULFILLED;
          touch(reservation, actor.id);
          const rlines = await this.reservationsRepo.findLinesByReservation(
            tx,
            reservation.id,
          );
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
}
