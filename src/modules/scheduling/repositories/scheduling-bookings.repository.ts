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

export interface BookingHistoryData {
  appointmentBookingId: string;
  revisionNo: number;
  operationConceptId: string;
  dataSnapshot: unknown;
  changedByUserId?: string;
  changeReasonConceptId?: string;
}

export interface CreateHoldData {
  bookableSlotId: string;
  patientProfileId?: string;
  heldByUserId: string;
  holdToken: string;
  statusConceptId: string;
  expiresAt: Date;
  actorUserId?: string;
}

export interface CreateBookingData {
  tenantId: string;
  patientProfileId: string;
  bookableSlotId: string;
  resourceId?: string;
  serviceConceptId?: string;
  bookingChannelConceptId: string;
  bookedByUserId?: string;
  statusConceptId: string;
  confirmedAt?: Date;
  bookingPolicyId?: string;
  cancellationPolicySnapshot?: CancellationPolicySnapshot;
  reasonText?: string;
  actorUserId?: string;
}

export interface CreateWaitlistData {
  tenantId: string;
  patientProfileId: string;
  resourceId?: string;
  serviceConceptId?: string;
  desiredFrom?: Date;
  desiredTo?: Date;
  priority: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateReminderData {
  bookingId: string;
  channelConceptId: string;
  offsetMinutes: number;
  scheduledAt: Date;
  statusConceptId: string;
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

  findSlotById(em: EntityManager, id: string): Promise<BookableSlots | null> {
    return em.findOne(BookableSlots, { id });
  }

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

  recordReschedule(
    em: EntityManager,
    data: {
      bookingId: string;
      fromSlotId: string;
      toSlotId: string;
      reasonConceptId?: string;
      rescheduledByUserId?: string;
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

  createCancellation(
    em: EntityManager,
    data: {
      bookingId: string;
      reasonConceptId: string;
      cancelledByUserId?: string;
      isNoShow: boolean;
      feeAmount?: string;
      currencyConceptId?: string;
      cancelledAt: Date;
      statusConceptId: string;
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
