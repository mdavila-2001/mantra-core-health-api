import { Injectable } from '@nestjs/common';
import type { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { BookableSlots, SchedulableResources } from '../entities';

/** Filtro de `GET /scheduling/resources`. */
export interface ListResourcesFilter {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId?: string;
  /**
   * Identificador asociado a state concept, cuando se filtran los dados de baja.
   */
  stateConceptId?: string;
}

/** Filtro de `GET /scheduling/slots`. */
export interface ListSlotsFilter {
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a schedule template.
   */
  scheduleTemplateId?: string;
  /**
   * Valor de from mantenido por la instancia.
   */
  from: Date;
  /**
   * Valor de to mantenido por la instancia.
   */
  to: Date;
  /**
   * Sólo cupos abiertos y con capacidad libre.
   */
  onlyAvailable?: boolean;
  /**
   * Identificador del concepto de cupo abierto, cuando `onlyAvailable`.
   */
  openStatusConceptId?: string;
}

/** Filtro de `GET /scheduling/bookings`. */

/**
 * Lecturas de agenda: recursos, cupos y citas.
 *
 * Vive aparte de `SchedulingCatalogRepository` y `SchedulingBookingsRepository`
 * porque esas dos sirven al flujo de escritura —tomando filas con `FOR UPDATE`—
 * y aquí no se bloquea nada: son consultas de sólo lectura para pintar pantallas.
 */
@Injectable()
export class SchedulingAgendaRepository {
  /**
   * Recursos agendables del tenant, por nombre.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Criterios de la consulta.
   * @returns Resultado conforme al contrato `Promise<SchedulableResources[]>`.
   */
  findResources(
    em: EntityManager,
    filter: ListResourcesFilter,
  ): Promise<SchedulableResources[]> {
    const where: FilterQuery<SchedulableResources> = {
      tenantId: filter.tenantId,
    };
    if (filter.practiceId) where.practiceId = filter.practiceId;
    if (filter.resourceTypeConceptId) {
      where.resourceTypeConceptId = filter.resourceTypeConceptId;
    }
    if (filter.stateConceptId) where.stateConceptId = filter.stateConceptId;

    return em.find(SchedulableResources, where, { orderBy: { name: 'asc' } });
  }

  /**
   * Cupos de la ventana, del más próximo al más lejano.
   *
   * Se pide `limit + 1` para poder decir si la ventana desborda el tope sin
   * pagar un `count(*)` sobre una tabla que crece con cada generación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Criterios de la consulta.
   * @param limit - Tope de resultados.
   * @returns Resultado conforme al contrato `Promise<BookableSlots[]>`.
   */
  findSlots(
    em: EntityManager,
    filter: ListSlotsFilter,
    limit: number,
  ): Promise<BookableSlots[]> {
    const where: FilterQuery<BookableSlots> = {
      startAt: { $gte: filter.from, $lt: filter.to },
    };
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.scheduleTemplateId) {
      where.scheduleTemplateId = filter.scheduleTemplateId;
    }
    if (filter.onlyAvailable) {
      where.remainingCapacity = { $gt: 0 };
      if (filter.openStatusConceptId) {
        where.statusConceptId = filter.openStatusConceptId;
      }
    }

    return em.find(BookableSlots, where, {
      orderBy: { startAt: 'asc' },
      limit: limit + 1,
    });
  }

  /**
   * Citas que cumplen el filtro, junto con el cupo de cada una.
   *
   * La ventana temporal se aplica sobre `bookable_slots.start_at` porque la cita
   * no guarda el instante: filtrar por `created_at` respondería «citas creadas
   * esta semana», que no es lo que pide una agenda.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Criterios de la consulta.
   * @param window - Ventana temporal opcional sobre el cupo.
   * @param limit - Tope de resultados.
   * @returns Citas con su cupo resuelto.
   */
  findSlotById(em: EntityManager, id: string): Promise<BookableSlots | null> {
    return em.findOne(BookableSlots, { id });
  }
}
