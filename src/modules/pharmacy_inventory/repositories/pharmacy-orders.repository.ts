import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryReservations, InventoryReservationLines } from '../entities';
import {
  Pharmacies,
  PharmacyProducts,
  PharmacySites,
} from '../../pharmacy/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { MedicationRequests } from '../../clinical/entities';

/**
 * Acceso a datos del pedido de farmacia del paciente (FAR-E1).
 *
 * Un pedido ES una fila de `inventory_reservations` cuyo
 * `reservation_status_concept_id` pertenece al value set `PINV_ORDER_*`; toda
 * consulta de este repositorio acota por ese conjunto para que las reservas de
 * mostrador (estados `PINV_RESERVATION_*`) y los pedidos nunca se mezclen.
 *
 * Las lecturas de nombres (farmacia, sede, producto, concepto) van **en lote**
 * por ids: la cara de lectura del pedido resuelve palabras sin N+1. La farmacia
 * se busca siempre acotada por `tenant_id` — el tenant viaja en la consulta,
 * no se filtra después. A diferencia del directorio, acá NO se exige
 * activa/verificada: un pedido ya creado no pierde su historia porque la
 * farmacia cambió de estado.
 */
@Injectable()
export class PharmacyOrdersRepository {
  /** Un pedido por id, dentro del value set de estados de pedido. */
  findOrderById(
    em: EntityManager,
    id: string,
    orderStatusIds: readonly string[],
  ): Promise<InventoryReservations | null> {
    return em.findOne(InventoryReservations, {
      id,
      reservationStatusConceptId: { $in: [...orderStatusIds] },
    });
  }

  /**
   * Un pedido por id con lock de escritura, para transiciones (cancelar,
   * vencer): el `FOR UPDATE` serializa a dos actores concurrentes y el segundo
   * relee el estado ya confirmado del primero.
   */
  findOrderByIdForUpdate(
    em: EntityManager,
    id: string,
    orderStatusIds: readonly string[],
  ): Promise<InventoryReservations | null> {
    return em.findOne(
      InventoryReservations,
      {
        id,
        reservationStatusConceptId: { $in: [...orderStatusIds] },
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Los pedidos de un paciente, más nuevos primero. */
  findOrdersByPatient(
    em: EntityManager,
    patientProfileId: string,
    orderStatusIds: readonly string[],
  ): Promise<InventoryReservations[]> {
    return em.find(
      InventoryReservations,
      {
        patientProfileId,
        reservationStatusConceptId: { $in: [...orderStatusIds] },
      },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /** El pedido ya creado con esa clave de idempotencia por ese paciente. */
  findOrderByIdempotencyKey(
    em: EntityManager,
    patientProfileId: string,
    idempotencyKey: string,
    orderStatusIds: readonly string[],
  ): Promise<InventoryReservations | null> {
    return em.findOne(InventoryReservations, {
      patientProfileId,
      idempotencyKey,
      reservationStatusConceptId: { $in: [...orderStatusIds] },
    });
  }

  /**
   * Pedidos no terminales ya vencidos, con lock de escritura (cola del
   * vencimiento, del worker o de la expiración perezosa). Con `ids` la
   * consulta se acota a esos pedidos; el filtro de estado y de reloj se
   * reevalúa **después** de obtener el lock, así que el perdedor de una
   * carrera ve la fila ya vencida y no la toma dos veces.
   */
  findDueOrdersForUpdate(
    em: EntityManager,
    nonTerminalStatusIds: readonly string[],
    now: Date,
    ids?: readonly string[],
  ): Promise<InventoryReservations[]> {
    if (ids !== undefined && ids.length === 0) return Promise.resolve([]);
    return em.find(
      InventoryReservations,
      {
        ...(ids ? { id: { $in: [...ids] } } : {}),
        reservationStatusConceptId: { $in: [...nonTerminalStatusIds] },
        expiresAt: { $lt: now },
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Las líneas de un conjunto de pedidos, en una sola consulta. */
  findLinesByReservationIds(
    em: EntityManager,
    reservationIds: readonly string[],
  ): Promise<InventoryReservationLines[]> {
    if (reservationIds.length === 0) return Promise.resolve([]);
    return em.find(InventoryReservationLines, {
      inventoryReservationId: { $in: [...reservationIds] },
    });
  }

  /** Farmacias por id **del tenant activo**: el tenant va en el WHERE. */
  findPharmaciesByIdsInTenant(
    em: EntityManager,
    tenantId: string,
    ids: readonly string[],
  ): Promise<Pharmacies[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Pharmacies, { id: { $in: [...ids] }, tenantId });
  }

  /** Sedes por id, sin filtro de estado: la historia del pedido no se borra. */
  findSitesByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PharmacySites[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PharmacySites, { id: { $in: [...ids] } });
  }

  /** Productos por id, sin filtro de estado, para leer pedidos históricos. */
  findProductsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PharmacyProducts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PharmacyProducts, { id: { $in: [...ids] } });
  }

  /** Farmacias por id sin filtro de tenant (resolución de eventos del worker). */
  findPharmaciesByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Pharmacies[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Pharmacies, { id: { $in: [...ids] } });
  }

  /**
   * La receta **del propio paciente**: titularidad en el WHERE. Lectura pura de
   * `clinical.medication_requests` — el módulo clínico no se modifica; una
   * receta inexistente y una ajena son indistinguibles para quien consulta.
   */
  findOwnMedicationRequest(
    em: EntityManager,
    id: string,
    patientProfileId: string,
  ): Promise<MedicationRequests | null> {
    return em.findOne(MedicationRequests, { id, patientProfileId });
  }

  /** Conceptos por id, para resolver `{code, display}` en lote. */
  findConceptsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: [...ids] } });
  }
}
