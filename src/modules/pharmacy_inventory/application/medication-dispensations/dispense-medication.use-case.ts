import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
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
import type {
  InventoryReservationLines,
  InventoryReservations,
} from '../../entities';
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
        pharmacy,
        dto.patientProfileId,
        dto.medicationRequestId,
      );
      let reservationRow: InventoryReservations | null = null;
      // Las líneas que salen de un botiquín de piso se rigen por `available_quantity`.
      const wardStock = new Set<string>();
      for (const line of dto.lines) {
        await this.scope.requireStockKey(tx, site, line);
        const location = await this.scope.requireLocation(
          tx,
          site,
          line.inventoryLocationId,
        );
        if (location.locationTypeConceptId === PINV.LOCATION_TYPE_WARD_STOCK) {
          wardStock.add(line.inventoryLocationId);
        }
      }

      if (dto.inventoryReservationId) {
        // Bloqueada hasta el fin de la transacción: dos dispensas contra la misma
        // reserva se serializan y la segunda la encuentra ya consumida.
        const reservation = await this.reservationsRepo.findByIdForUpdate(
          tx,
          dto.inventoryReservationId,
        );
        reservationRow = reservation;
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

      // Una línea de botiquín de piso sólo se exime de `available_quantity` hasta lo que
      // una reserva activa, de esta ubicación, producto y lote, todavía tiene reservado.
      const strictReservation =
        reservationRow && wardStock.size > 0
          ? await this.loadStrictReservation(tx, reservationRow)
          : null;
      const consumed = new Map<string, number>();

      for (const line of dto.lines) {
        const position = await this.stockRepo.findByKeyForUpdate(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        // Botiquín de piso: no se dispensa lo que está reservado para otro ni en
        // cuarentena. Una reserva activa que respalda esta línea exime sólo hasta lo que
        // le queda reservado; el resto se somete a lo disponible.
        const isWard = wardStock.has(line.inventoryLocationId);
        let covered = 0;
        let coveringLine: InventoryReservationLines | undefined;
        if (isWard && strictReservation) {
          coveringLine = this.coveringLine(strictReservation, line, consumed);
          covered = Math.min(
            line.dispensedQuantity,
            num(coveringLine.reservedQuantity) -
              num(coveringLine.fulfilledQuantity) -
              (consumed.get(coveringLine.id) ?? 0),
          );
        }
        if (
          isWard &&
          (!position ||
            num(position.availableQuantity) < line.dispensedQuantity - covered)
        ) {
          throw new ConflictException(
            'El botiquín no tiene stock disponible suficiente',
            {
              productId: line.pharmacyProductId,
              available: position ? num(position.availableQuantity) : 0,
              requested: line.dispensedQuantity,
            },
            PharmacyInventoryErrorReason.INSUFFICIENT_AVAILABLE_STOCK,
          );
        }
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
          ...(coveringLine ? { reservationDelta: String(-covered) } : {}),
          sourceId: dispensation.id,
          recordedByUserId: actor.id,
        });
        ledgerEntryIds.push(entry.id);

        position.onHandQuantity = String(
          num(position.onHandQuantity) - line.dispensedQuantity,
        );
        if (coveringLine) {
          // Sólo se libera lo que la reserva tenía: ni más, ni de otra posición.
          position.reservedQuantity = String(
            Math.max(num(position.reservedQuantity) - covered, 0),
          );
          consumed.set(
            coveringLine.id,
            (consumed.get(coveringLine.id) ?? 0) + covered,
          );
        } else if (
          // Si la reserva cubría este lote, se libera al dispensar.
          dto.inventoryReservationId &&
          num(position.reservedQuantity) >= line.dispensedQuantity
        ) {
          position.reservedQuantity = String(
            num(position.reservedQuantity) - line.dispensedQuantity,
          );
          // En una dispensa mixta (botiquín y otra ubicación) la línea de la reserva
          // que cubría esta posición también se consume.
          const legacy = strictReservation?.lines.find(
            (rl) =>
              rl.inventoryLocationId === line.inventoryLocationId &&
              rl.pharmacyProductId === line.pharmacyProductId &&
              (rl.inventoryLotId ?? null) === (line.inventoryLotId ?? null),
          );
          if (legacy) {
            consumed.set(
              legacy.id,
              (consumed.get(legacy.id) ?? 0) +
                Math.min(
                  line.dispensedQuantity,
                  num(legacy.reservedQuantity) -
                    num(legacy.fulfilledQuantity) -
                    (consumed.get(legacy.id) ?? 0),
                ),
            );
          }
        }
        position.availableQuantity = recompute(
          position.onHandQuantity,
          position.reservedQuantity,
          position.quarantineQuantity,
        );
        position.lastLedgerSequence = sequence;
        position.updatedAt = new Date();
      }

      if (dto.inventoryReservationId && reservationRow) {
        const reservation = reservationRow;
        const rlines = strictReservation
          ? strictReservation.lines
          : await this.reservationsRepo.findLinesByReservation(
              tx,
              reservation.id,
            );
        let allFulfilled = true;
        for (const rl of rlines) {
          const used = consumed.get(rl.id);
          if (strictReservation) {
            // Con líneas de botiquín, cada línea de la reserva se consume por lo que se dispensó.
            if (used !== undefined) {
              rl.fulfilledQuantity = String(num(rl.fulfilledQuantity) + used);
              if (num(rl.fulfilledQuantity) >= num(rl.reservedQuantity)) {
                rl.statusConceptId = PINV.RES_LINE_FULFILLED;
              }
              touch(rl, actor.id);
            }
            if (rl.statusConceptId !== PINV.RES_LINE_FULFILLED) {
              allFulfilled = false;
            }
          } else {
            rl.fulfilledQuantity = rl.reservedQuantity;
            rl.statusConceptId = PINV.RES_LINE_FULFILLED;
            touch(rl, actor.id);
          }
        }
        if (!strictReservation || allFulfilled) {
          reservation.reservationStatusConceptId = PINV.RESERVATION_FULFILLED;
          touch(reservation, actor.id);
        }
      }
      await tx.flush();

      return { id: dispensation.id, lineIds, ledgerEntryIds };
    });
  }

  /**
   * La reserva ya bloqueada, validada como respaldo de líneas de botiquín: activa
   * (`CONFIRMED`) y no vencida. Su pertenencia a la farmacia y a la sede se comprobó antes.
   *
   * @throws ConflictException (409 `RESERVATION_NOT_APPLICABLE`) si cancelada, vencida o consumida.
   */
  private async loadStrictReservation(
    tx: EntityManager,
    reservation: InventoryReservations,
  ): Promise<{ lines: InventoryReservationLines[] }> {
    if (
      reservation.reservationStatusConceptId !== PINV.RESERVATION_CONFIRMED ||
      reservation.expiresAt.getTime() <= Date.now()
    ) {
      throw this.notApplicable();
    }
    return {
      lines: await this.reservationsRepo.findLinesByReservation(
        tx,
        reservation.id,
      ),
    };
  }

  /**
   * La línea de la reserva que respalda esta línea de dispensa: misma ubicación,
   * producto y lote, vigente y con algo todavía reservado.
   *
   * @throws ConflictException (409 `RESERVATION_NOT_APPLICABLE`) si no hay ninguna.
   */
  private coveringLine(
    reservation: { lines: InventoryReservationLines[] },
    line: {
      inventoryLocationId: string;
      pharmacyProductId: string;
      inventoryLotId?: string;
    },
    consumed: ReadonlyMap<string, number>,
  ): InventoryReservationLines {
    const found = reservation.lines.find(
      (rl) =>
        rl.inventoryLocationId === line.inventoryLocationId &&
        rl.pharmacyProductId === line.pharmacyProductId &&
        (rl.inventoryLotId ?? null) === (line.inventoryLotId ?? null) &&
        rl.statusConceptId === PINV.RES_LINE_CONFIRMED &&
        num(rl.reservedQuantity) -
          num(rl.fulfilledQuantity) -
          (consumed.get(rl.id) ?? 0) >
          0,
    );
    if (!found) throw this.notApplicable();
    return found;
  }

  private notApplicable(): ConflictException {
    return new ConflictException(
      'La reserva no respalda esta dispensa',
      undefined,
      PharmacyInventoryErrorReason.RESERVATION_NOT_APPLICABLE,
    );
  }
}
