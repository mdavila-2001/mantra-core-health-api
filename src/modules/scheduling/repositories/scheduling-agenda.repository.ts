import { Injectable } from '@nestjs/common';
import type { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  AppointmentBookings,
  AppointmentReminders,
  BookableSlots,
  SchedulableResources,
} from '../entities';

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
export interface ListBookingsFilter {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId?: string;
}

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
  async findBookingsWithSlot(
    em: EntityManager,
    filter: ListBookingsFilter,
    window: { from?: Date; to?: Date },
    limit: number,
  ): Promise<
    Array<{ booking: AppointmentBookings; slot: BookableSlots | null }>
  > {
    const where: FilterQuery<AppointmentBookings> = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.patientProfileId) {
      where.patientProfileId = filter.patientProfileId;
    }
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.statusConceptId) where.statusConceptId = filter.statusConceptId;

    // La ventana se resuelve primero sobre los cupos y luego se restringe la
    // consulta de citas a esos ids: dos consultas sencillas en vez de un join
    // manual, y el orden final sale del instante del cupo igualmente.
    let slotIds: string[] | undefined;
    if (window.from || window.to) {
      const slotWhere: FilterQuery<BookableSlots> = {};
      if (window.from && window.to) {
        slotWhere.startAt = { $gte: window.from, $lt: window.to };
      } else if (window.from) {
        slotWhere.startAt = { $gte: window.from };
      } else if (window.to) {
        slotWhere.startAt = { $lt: window.to };
      }
      if (filter.resourceId) slotWhere.resourceId = filter.resourceId;
      const slots = await em.find(BookableSlots, slotWhere, {
        fields: ['id'],
      });
      slotIds = slots.map((slot) => slot.id);
      // Sin cupos en la ventana no hay citas posibles: se evita emitir un
      // `IN ()` vacío, que en SQL no filtra nada y devolvería la tabla entera.
      if (slotIds.length === 0) return [];
      where.bookableSlotId = { $in: slotIds };
    }

    const bookings = await em.find(AppointmentBookings, where, {
      limit: limit + 1,
    });
    if (bookings.length === 0) return [];

    const slots = await em.find(BookableSlots, {
      id: { $in: bookings.map((booking) => booking.bookableSlotId) },
    });
    const byId = new Map(slots.map((slot) => [slot.id, slot]));

    return bookings
      .map((booking) => ({
        booking,
        slot: byId.get(booking.bookableSlotId) ?? null,
      }))
      .sort((a, b) => {
        const left = a.slot?.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const right = b.slot?.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return left - right;
      });
  }

  /**
   * Una cita por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la cita.
   * @returns Resultado conforme al contrato `Promise<AppointmentBookings | null>`.
   */
  findBookingById(
    em: EntityManager,
    id: string,
  ): Promise<AppointmentBookings | null> {
    return em.findOne(AppointmentBookings, { id });
  }

  /**
   * Un cupo por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del cupo.
   * @returns Resultado conforme al contrato `Promise<BookableSlots | null>`.
   */
  findSlotById(em: EntityManager, id: string): Promise<BookableSlots | null> {
    return em.findOne(BookableSlots, { id });
  }

  /**
   * Recordatorios programados de una cita, del más próximo al más lejano.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param bookingId - Identificador de la cita.
   * @returns Resultado conforme al contrato `Promise<AppointmentReminders[]>`.
   */
  findRemindersByBooking(
    em: EntityManager,
    bookingId: string,
  ): Promise<AppointmentReminders[]> {
    return em.find(
      AppointmentReminders,
      { bookingId },
      { orderBy: { scheduledAt: 'asc' } },
    );
  }
}
