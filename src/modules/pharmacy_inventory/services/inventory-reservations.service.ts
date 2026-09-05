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
import {
  CreateReservationDto,
  MovementResponseDto,
  ExpireReservationsResponseDto,
} from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

/**
 * Ejecuta la operación num.
 *
 * @param v - Valor de v requerido por la operación.
 * @returns Resultado de num conforme al contrato `number`.
 */
const num = (v: string | null | undefined): number =>
  v == null ? 0 : Number(v);
/**
 * Ejecuta la operación recompute.
 *
 * @param onHand - Valor de on hand requerido por la operación.
 * @param reserved - Valor de reserved requerido por la operación.
 * @param quarantine - Valor de quarantine requerido por la operación.
 * @returns Resultado de recompute conforme al contrato `string`.
 */
const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Reservas de stock (UC-25-04) y liberación de reservas vencidas (UC-25-05). */
@Injectable()
export class InventoryReservationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reservationsRepo - Valor de reservations repo requerido por la operación.
   * @param stockRepo - Valor de stock repo requerido por la operación.
   * @param ledgerRepo - Valor de ledger repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
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
        const position = await this.stockRepo.findByKeyForUpdate(tx, {
          inventoryLocationId: line.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        const available = position ? num(position.availableQuantity) : 0;
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

        position!.reservedQuantity = String(
          num(position!.reservedQuantity) + line.requestedQuantity,
        );
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
  async expire(
    actor: AuthenticatedUser,
  ): Promise<ExpireReservationsResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.reservation.expire' },
      'Expiring reservations',
    );
    return this.em.transactional(async (tx) => {
      const expired = await this.reservationsRepo.findExpired(
        tx,
        PINV.RESERVATION_CONFIRMED,
        new Date(),
      );
      let count = 0;

      for (const reservation of expired) {
        reservation.reservationStatusConceptId = PINV.RESERVATION_EXPIRED;
        reservation.releasedAt = new Date();
        touch(reservation, actor.id);

        await this.releaseConfirmedLines(tx, reservation, actor);
        count += 1;
      }
      await tx.flush();

      return { expiredCount: count };
    });
  }

  /**
   * Libera las líneas CONFIRMED de una reserva: marca cada una como
   * `RES_LINE_RELEASED`, asienta `MV_RESERVATION_RELEASE` en el ledger y
   * recalcula la posición de stock. Es la única contabilidad de liberación del
   * módulo: la usan la expiración (UC-25-05) y la cancelación/vencimiento del
   * pedido de paciente (FAR-E1) — duplicarla sería tener dos ledgers.
   *
   * Solo toca líneas en `RES_LINE_CONFIRMED`: una ya liberada no se libera dos
   * veces, y una ya FULFILLED no tiene reserva que devolver. El **estado de la
   * cabecera lo decide el llamador** (EXPIRED, `PINV_ORDER_CANCELADO`,
   * `PINV_ORDER_VENCIDO`…): esta primitiva solo devuelve stock.
   *
   * @param tx - Transacción activa del caso de uso.
   * @param reservation - Reserva/pedido cuya reserva de stock se devuelve.
   * @param actor - Quien provoca la liberación.
   * @param options - `onlyLineIds` acota la liberación a esas líneas (FAR-E2:
   *                  marcar un renglón NO_DISPONIBLE devuelve SOLO su stock);
   *                  sin opciones se liberan todas las CONFIRMED, como siempre.
   * @returns Cuántas líneas se liberaron.
   */
  async releaseConfirmedLines(
    tx: EntityManager,
    reservation: {
      /** Reserva a la que pertenecen las líneas. */
      id: string;
      /** Farmacia del ledger. */
      pharmacyId: string;
      /** Sede del asiento. */
      pharmacySiteId: string;
    },
    actor: AuthenticatedUser,
    options?: {
      /** Solo estas líneas; las demás CONFIRMED quedan intactas. */
      onlyLineIds?: readonly string[];
    },
  ): Promise<number> {
    const lines = await this.reservationsRepo.findLinesByReservation(
      tx,
      reservation.id,
    );
    const only =
      options?.onlyLineIds === undefined ? null : new Set(options.onlyLineIds);
    let released = 0;
    for (const rl of lines) {
      if (rl.statusConceptId !== PINV.RES_LINE_CONFIRMED) continue;
      if (only !== null && !only.has(rl.id)) continue;
      rl.statusConceptId = PINV.RES_LINE_RELEASED;
      touch(rl, actor.id);
      released += 1;

      if (rl.inventoryLocationId) {
        const position = await this.stockRepo.findByKeyForUpdate(tx, {
          inventoryLocationId: rl.inventoryLocationId,
          pharmacyProductId: rl.pharmacyProductId,
          inventoryLotId: rl.inventoryLotId,
        });
        const sequence = await this.ledgerRepo.nextSequence(
          tx,
          reservation.pharmacyId,
        );
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
          position.reservedQuantity = String(
            num(position.reservedQuantity) - num(rl.reservedQuantity),
          );
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
    return released;
  }
}
