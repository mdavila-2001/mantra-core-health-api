import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryReservations, InventoryReservationLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una reserva de stock. */
export interface CreateReservationData {
  pharmacyId: string;
  pharmacySiteId: string;
  patientProfileId?: string;
  medicationRequestId?: string;
  quotationId?: string;
  reservationStatusConceptId: string;
  expiresAt: Date;
  confirmedAt?: Date;
  idempotencyKey?: string;
  actorUserId?: string;
}

/** Datos de una línea de reserva. */
export interface CreateReservationLineData {
  inventoryReservationId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
  inventoryLocationId?: string;
  requestedQuantity: string;
  reservedQuantity: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de las reservas de inventario y sus líneas. */
@Injectable()
export class ReservationsRepository {
  findById(em: EntityManager, id: string): Promise<InventoryReservations | null> {
    return em.findOne(InventoryReservations, { id });
  }

  /** Reservas confirmadas cuyo `expires_at` ya venció (cola del worker). */
  findExpired(em: EntityManager, statusConceptId: string, now: Date): Promise<InventoryReservations[]> {
    return em.find(InventoryReservations, {
      reservationStatusConceptId: statusConceptId,
      expiresAt: { $lt: now },
    });
  }

  findLinesByReservation(em: EntityManager, reservationId: string): Promise<InventoryReservationLines[]> {
    return em.find(InventoryReservationLines, { inventoryReservationId: reservationId });
  }

  create(em: EntityManager, data: CreateReservationData): InventoryReservations {
    return em.create(
      InventoryReservations,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        patientProfileId: data.patientProfileId,
        medicationRequestId: data.medicationRequestId,
        quotationId: data.quotationId,
        reservationStatusConceptId: data.reservationStatusConceptId,
        expiresAt: data.expiresAt,
        confirmedAt: data.confirmedAt,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(em: EntityManager, data: CreateReservationLineData): InventoryReservationLines {
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
