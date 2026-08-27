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
import { PersonProfiles, Persons } from '../../profiles/entities';

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

  /**
   * La bandeja del tenant (FAR-E2): pedidos de las farmacias dadas, más
   * nuevos primero. Los `pharmacyIds` vienen de {@link findPharmaciesByTenant}
   * — el recorte por organización ya ocurrió en esa consulta, y éste lo repite
   * en el WHERE; nunca es un filtro a posteriori. Los filtros opcionales son
   * exactamente los que el modelo declara: estado (`reservation_status_concept_id`),
   * sede (`pharmacy_site_id`) y ventana de creación (`created_at`).
   */
  findOrdersForPharmacies(
    em: EntityManager,
    pharmacyIds: readonly string[],
    statusIds: readonly string[],
    filters: {
      /** Sede puntual, si la bandeja se acota. */
      siteId?: string;
      /** Creados desde este instante, inclusive. */
      from?: Date;
      /** Creados hasta este instante, exclusive. */
      to?: Date;
      /** Tope de filas servidas. */
      limit: number;
    },
  ): Promise<InventoryReservations[]> {
    if (pharmacyIds.length === 0) return Promise.resolve([]);
    const createdAt = {
      ...(filters.from ? { $gte: filters.from } : {}),
      ...(filters.to ? { $lt: filters.to } : {}),
    };
    return em.find(
      InventoryReservations,
      {
        pharmacyId: { $in: [...pharmacyIds] },
        reservationStatusConceptId: { $in: [...statusIds] },
        ...(filters.siteId ? { pharmacySiteId: filters.siteId } : {}),
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      },
      { orderBy: { createdAt: 'DESC' }, limit: filters.limit },
    );
  }

  /** Las farmacias de la organización: el tenant va en el WHERE. */
  findPharmaciesByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<Pharmacies[]> {
    return em.find(Pharmacies, { tenantId });
  }

  /**
   * Nombres de personas por id de perfil de paciente, en lote.
   *
   * `patient_profiles.profile_id` ES el id de la persona (la convención de los
   * subtipos de `profiles`); se tolera la convención vieja resolviendo por
   * `person_profiles` los ids que no matchearon directo — el mismo camino que
   * `SchedulingNoticeRepository.findDisplayNameForProfile`, pero en dos
   * consultas para N perfiles en vez de dos por perfil.
   */
  async findPersonNamesByProfileIds(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    if (profileIds.length === 0) return names;

    const direct = await em.find(Persons, { id: { $in: [...profileIds] } });
    for (const person of direct) {
      const name = personDisplayName(person);
      if (name !== null) names.set(person.id, name);
    }

    const missing = profileIds.filter((id) => !names.has(id));
    if (missing.length === 0) return names;
    const profiles = await em.find(PersonProfiles, {
      id: { $in: [...missing] },
    });
    if (profiles.length === 0) return names;
    const persons = await em.find(Persons, {
      id: { $in: profiles.map((profile) => profile.personId) },
    });
    const personById = new Map(persons.map((person) => [person.id, person]));
    for (const profile of profiles) {
      const person = personById.get(profile.personId);
      const name = person ? personDisplayName(person) : null;
      if (name !== null) names.set(profile.id, name);
    }
    return names;
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

  /**
   * El prescriptor de una receta, para el aviso de cierre (FAR-E3): la
   * dispensación notifica a quien recetó. Lectura puntual de `clinical` —
   * el módulo no se modifica, se consume, igual que en la validación del alta.
   */
  async findPrescriberProfileId(
    em: EntityManager,
    medicationRequestId: string,
  ): Promise<string | null> {
    const request = await em.findOne(MedicationRequests, {
      id: medicationRequestId,
    });
    return request?.prescriberProfileId ?? null;
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

/** El nombre pintable de una persona: display, o nombre y apellido. */
function personDisplayName(person: Persons): string | null {
  const compuesto = [person.name, person.lastName]
    .filter((parte): parte is string => typeof parte === 'string')
    .join(' ')
    .trim();
  return person.displayName ?? (compuesto === '' ? null : compuesto);
}
