import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  BookableSlots,
  SlotHolds,
  AppointmentBookings,
  BookingReschedules,
  BookingCancellations,
  WaitlistEntries,
  AppointmentReminders,
  type CancellationPolicySnapshot,
} from '../entities';
import { AppointmentBookingsHistory } from '../../audit/entities/appointment_bookings_history.entity';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de booking history data.
 */
export interface BookingHistoryData {
  /**
   * Identificador asociado a appointment booking.
   */
  appointmentBookingId: string;
  /**
   * Valor de revision no mantenido por la instancia.
   */
  revisionNo: number;
  /**
   * Identificador asociado a operation concept.
   */
  operationConceptId: string;
  /**
   * Valor de data snapshot mantenido por la instancia.
   */
  dataSnapshot: unknown;
  /**
   * Identificador asociado a changed by user.
   */
  changedByUserId?: string;
  /**
   * Identificador asociado a change reason concept.
   */
  changeReasonConceptId?: string;
}

/**
 * Describe el contrato estructural de create hold data.
 */
export interface CreateHoldData {
  /**
   * Identificador asociado a bookable slot.
   */
  bookableSlotId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a held by user.
   */
  heldByUserId: string;
  /**
   * Valor de hold token mantenido por la instancia.
   */
  holdToken: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create booking data.
 */
export interface CreateBookingData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a bookable slot.
   */
  bookableSlotId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Identificador asociado a booking channel concept.
   */
  bookingChannelConceptId: string;
  /**
   * Identificador asociado a booked by user.
   */
  bookedByUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  confirmedAt?: Date;
  /**
   * Identificador asociado a booking policy.
   */
  bookingPolicyId?: string;
  /**
   * Valor de cancellation policy snapshot mantenido por la instancia.
   */
  cancellationPolicySnapshot?: CancellationPolicySnapshot;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create waitlist data.
 */
export interface CreateWaitlistData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de desired from mantenido por la instancia.
   */
  desiredFrom?: Date;
  /**
   * Valor de desired to mantenido por la instancia.
   */
  desiredTo?: Date;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reminder data.
 */
export interface CreateReminderData {
  /**
   * Identificador asociado a booking.
   */
  bookingId: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId: string;
  /**
   * Valor de offset minutes mantenido por la instancia.
   */
  offsetMinutes: number;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos del flujo de reserva: holds, citas, cambios, lista de espera y recordatorios. */
@Injectable()
export class SchedulingBookingsRepository {
  /**
   * `SELECT ... FOR UPDATE` sobre el slot. Es la pieza central del anti-double-booking:
   * serializa el decremento de `remaining_capacity` entre peticiones concurrentes.
   */
  findSlotForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<BookableSlots | null> {
    return em.findOne(
      BookableSlots,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find slot by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find slot by id conforme al contrato `Promise<BookableSlots | null>`.
   */
  findSlotById(em: EntityManager, id: string): Promise<BookableSlots | null> {
    return em.findOne(BookableSlots, { id });
  }

  /**
   * Crea create hold.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create hold conforme al contrato `SlotHolds`.
   */
  createHold(em: EntityManager, data: CreateHoldData): SlotHolds {
    return em.create(
      SlotHolds,
      {
        bookableSlotId: data.bookableSlotId,
        patientProfileId: data.patientProfileId,
        heldByUserId: data.heldByUserId,
        holdToken: data.holdToken,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** El token es la clave pública del hold; su UNIQUE evita confirmar dos veces. */
  findHoldByTokenForUpdate(
    em: EntityManager,
    holdToken: string,
  ): Promise<SlotHolds | null> {
    return em.findOne(
      SlotHolds,
      { holdToken },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Lote de holds vencidos para el worker. `SKIP LOCKED` evita que dos workers
   * compitan por las mismas filas en vez de repartirse el trabajo.
   */
  findExpiredHolds(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<SlotHolds[]> {
    return em.find(
      SlotHolds,
      { statusConceptId: activeStatusConceptId, expiresAt: { $lte: now } },
      { limit, lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  /**
   * Crea create booking.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create booking conforme al contrato `AppointmentBookings`.
   */
  createBooking(
    em: EntityManager,
    data: CreateBookingData,
  ): AppointmentBookings {
    return em.create(
      AppointmentBookings,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        bookableSlotId: data.bookableSlotId,
        resourceId: data.resourceId,
        serviceConceptId: data.serviceConceptId,
        bookingChannelConceptId: data.bookingChannelConceptId,
        bookedByUserId: data.bookedByUserId,
        statusConceptId: data.statusConceptId,
        confirmedAt: data.confirmedAt,
        bookingPolicyId: data.bookingPolicyId,
        cancellationPolicySnapshot: data.cancellationPolicySnapshot,
        reasonText: data.reasonText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find booking by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find booking by id for update conforme al contrato `Promise<AppointmentBookings | null>`.
   */
  findBookingByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AppointmentBookings | null> {
    return em.findOne(
      AppointmentBookings,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Citas vigentes del paciente: la política limita cuántas puede tener a la vez. */
  countActiveBookingsForPatient(
    em: EntityManager,
    patientProfileId: string,
    activeStatuses: string[],
  ): Promise<number> {
    return em.count(AppointmentBookings, {
      patientProfileId,
      statusConceptId: { $in: activeStatuses },
    });
  }

  /**
   * Ejecuta la operación record reschedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record reschedule conforme al contrato `BookingReschedules`.
   */
  recordReschedule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a booking.
       */
      bookingId: string;
      /**
       * Identificador asociado a from slot.
       */
      fromSlotId: string;
      /**
       * Identificador asociado a to slot.
       */
      toSlotId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId?: string;
      /**
       * Identificador asociado a rescheduled by user.
       */
      rescheduledByUserId?: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
    },
  ): BookingReschedules {
    return em.create(
      BookingReschedules,
      {
        bookingId: data.bookingId,
        fromSlotId: data.fromSlotId,
        toSlotId: data.toSlotId,
        reasonConceptId: data.reasonConceptId,
        rescheduledByUserId: data.rescheduledByUserId,
        occurredAt: data.occurredAt,
        recordedAt: new Date(),
        recordedByUserId: data.rescheduledByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create cancellation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cancellation conforme al contrato `BookingCancellations`.
   */
  createCancellation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a booking.
       */
      bookingId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId: string;
      /**
       * Identificador asociado a cancelled by user.
       */
      cancelledByUserId?: string;
      /**
       * Valor de is no show mantenido por la instancia.
       */
      isNoShow: boolean;
      /**
       * Valor de fee amount mantenido por la instancia.
       */
      feeAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de cancelled at mantenido por la instancia.
       */
      cancelledAt: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): BookingCancellations {
    return em.create(
      BookingCancellations,
      {
        bookingId: data.bookingId,
        reasonConceptId: data.reasonConceptId,
        cancelledByUserId: data.cancelledByUserId,
        isNoShow: data.isNoShow,
        feeAmount: data.feeAmount,
        currencyConceptId: data.currencyConceptId,
        cancelledAt: data.cancelledAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create waitlist entry.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create waitlist entry conforme al contrato `WaitlistEntries`.
   */
  createWaitlistEntry(
    em: EntityManager,
    data: CreateWaitlistData,
  ): WaitlistEntries {
    return em.create(
      WaitlistEntries,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        resourceId: data.resourceId,
        serviceConceptId: data.serviceConceptId,
        desiredFrom: data.desiredFrom,
        desiredTo: data.desiredTo,
        priority: data.priority,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Candidatos de la lista de espera para un slot liberado, por prioridad y
   * antigüedad: a igual prioridad, primero quien esperaba hace más tiempo.
   */
  findWaitlistCandidates(
    em: EntityManager,
    resourceId: string,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<WaitlistEntries[]> {
    return em.find(
      WaitlistEntries,
      { resourceId, statusConceptId: activeStatusConceptId },
      { orderBy: { priority: 'DESC', createdAt: 'ASC' }, limit },
    );
  }

  /**
   * Crea create reminder.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reminder conforme al contrato `AppointmentReminders`.
   */
  createReminder(
    em: EntityManager,
    data: CreateReminderData,
  ): AppointmentReminders {
    return em.create(
      AppointmentReminders,
      {
        bookingId: data.bookingId,
        channelConceptId: data.channelConceptId,
        offsetMinutes: data.offsetMinutes,
        scheduledAt: data.scheduledAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Registra una transición de estado de la cita en el historial existente
   * (`audit.appointment_bookings_history`, append-only). Es lo que deja constancia
   * de cada cambio de estado gobernado por la máquina de estados (C-10).
   */
  recordBookingHistory(
    em: EntityManager,
    data: BookingHistoryData,
  ): AppointmentBookingsHistory {
    return em.create(
      AppointmentBookingsHistory,
      {
        appointmentBookingId: data.appointmentBookingId,
        revisionNo: data.revisionNo,
        operationConceptId: data.operationConceptId,
        validFrom: new Date(),
        dataSnapshot: data.dataSnapshot,
        changedByUserId: data.changedByUserId,
        changeReasonConceptId: data.changeReasonConceptId,
        recordedAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Recordatorios cuya hora ya llegó y siguen pendientes de envío. */
  findDueReminders(
    em: EntityManager,
    scheduledStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<AppointmentReminders[]> {
    return em.find(
      AppointmentReminders,
      { statusConceptId: scheduledStatusConceptId, scheduledAt: { $lte: now } },
      { limit },
    );
  }
}
