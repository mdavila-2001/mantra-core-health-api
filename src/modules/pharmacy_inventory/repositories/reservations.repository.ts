import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryReservations, InventoryReservationLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una reserva de stock. */
export interface CreateReservationData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a medication request.
   */
  medicationRequestId?: string;
  /**
   * Identificador asociado a quotation.
   */
  quotationId?: string;
  /**
   * Identificador asociado a reservation status concept.
   */
  reservationStatusConceptId: string;
  /**
   * Modalidad de entrega del pedido de paciente (`PINV_DELIVERY_*`, v4.2.1).
   * Las reservas de mostrador no la llevan: queda sin sellar.
   */
  deliveryModeConceptId?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  confirmedAt?: Date;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de una línea de reserva. */
export interface CreateReservationLineData {
  /**
   * Identificador asociado a inventory reservation.
   */
  inventoryReservationId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Identificador asociado a inventory location.
   */
  inventoryLocationId?: string;
  /**
   * Valor de requested quantity mantenido por la instancia.
   */
  requestedQuantity: string;
  /**
   * Valor de reserved quantity mantenido por la instancia.
   */
  reservedQuantity: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de las reservas de inventario y sus líneas. */
@Injectable()
export class ReservationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryReservations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryReservations | null> {
    return em.findOne(InventoryReservations, { id });
  }

  /** Reservas confirmadas cuyo `expires_at` ya venció (cola del worker). */
  findExpired(
    em: EntityManager,
    statusConceptId: string,
    now: Date,
  ): Promise<InventoryReservations[]> {
    return em.find(InventoryReservations, {
      reservationStatusConceptId: statusConceptId,
      expiresAt: { $lt: now },
    });
  }

  /**
   * Obtiene find lines by reservation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reservationId - Identificador de reservation.
   * @returns Resultado de find lines by reservation conforme al contrato `Promise<InventoryReservationLines[]>`.
   */
  findLinesByReservation(
    em: EntityManager,
    reservationId: string,
  ): Promise<InventoryReservationLines[]> {
    return em.find(InventoryReservationLines, {
      inventoryReservationId: reservationId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryReservations`.
   */
  create(
    em: EntityManager,
    data: CreateReservationData,
  ): InventoryReservations {
    return em.create(
      InventoryReservations,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        patientProfileId: data.patientProfileId,
        medicationRequestId: data.medicationRequestId,
        quotationId: data.quotationId,
        reservationStatusConceptId: data.reservationStatusConceptId,
        deliveryModeConceptId: data.deliveryModeConceptId,
        expiresAt: data.expiresAt,
        confirmedAt: data.confirmedAt,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `InventoryReservationLines`.
   */
  createLine(
    em: EntityManager,
    data: CreateReservationLineData,
  ): InventoryReservationLines {
    return em.create(
      InventoryReservationLines,
      {
        inventoryReservationId: data.inventoryReservationId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        inventoryLocationId: data.inventoryLocationId,
        requestedQuantity: data.requestedQuantity,
        reservedQuantity: data.reservedQuantity,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
