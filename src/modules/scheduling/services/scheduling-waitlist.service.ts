import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SchedulingBookingsRepository } from '../repositories';
import {
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  WorkerBatchResultDto,
  WaitlistCandidateSlotsResponseDto,
} from '../dto';

const DEFAULT_WORKER_BATCH = 100;
const DEFAULT_PRIORITY = 0;

/**
 * Lista de espera y recordatorios de cita (UC-41-11/12/13/14).
 */
@Injectable()
export class SchedulingWaitlistService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param bookingsRepo - Valor de bookings repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingWaitlistService.name);
  }

  /** UC-41-11: inscribe al paciente en la lista de espera. */
  async enroll(
    dto: CreateWaitlistEntryDto,
    actor: AuthenticatedUser,
  ): Promise<WaitlistEntryResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.waitlist.enroll',
        patientProfileId: dto.patientProfileId,
      },
      'Enrolling patient in waitlist',
    );

    return this.em.transactional(async (tx) => {
      const entry = this.bookingsRepo.createWaitlistEntry(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        resourceId: dto.resourceId,
        desiredFrom: dto.desiredFrom ? new Date(dto.desiredFrom) : undefined,
        desiredTo: dto.desiredTo ? new Date(dto.desiredTo) : undefined,
        priority: dto.priority ?? DEFAULT_PRIORITY,
        statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: entry.id,
        priority: dto.priority ?? DEFAULT_PRIORITY,
        statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
      };
    });
  }

  /**
   * UC-41-12 (worker): promueve candidatos de la lista de espera a un slot libre.
   *
   * La promoción **no reserva la cita**: marca al candidato como cubierto y deja que
   * el flujo normal de hold/confirmación se ejecute con su consentimiento. Reservar
   * automáticamente a nombre del paciente sería decidir por él.
   */
  async promoteWaitlist(
    slotId: string,
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    return this.em.transactional(async (tx) => {
      const slot = await this.bookingsRepo.findSlotById(tx, slotId);
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', { slotId });
      }
      if (slot.remainingCapacity <= 0) {
        return {
          processed: 0,
          detail: 'El slot no tiene cupo libre para promover',
        };
      }

      const candidates = await this.bookingsRepo.findWaitlistCandidates(
        tx,
        slot.resourceId,
        CONCEPTS.WAITLIST_ACTIVE,
        Math.min(limit, slot.remainingCapacity),
      );

      for (const candidate of candidates) {
        candidate.statusConceptId = CONCEPTS.WAITLIST_FULFILLED;
        touch(candidate, undefined);
      }

      if (candidates.length > 0) {
        this.logger.info(
          {
            operation: 'scheduling.waitlist.promote',
            slotId,
            promoted: candidates.length,
          },
          'Promoted waitlist candidates',
        );
      }

      return {
        processed: candidates.length,
        detail: 'Candidatos notificados; la reserva la confirma el paciente',
      };
    });
  }

  /**
   * UC-41-12 (descubrimiento del worker): slots con cupo libre cuyo recurso
   * tiene candidatos activos en la lista de espera. `promoteWaitlist` exige un
   * `slotId` puntual y no devuelve ids, así que el worker necesita esta
   * consulta para saber qué slot promover en cada tick.
   */
  async findSlotsWithCandidates(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WaitlistCandidateSlotsResponseDto> {
    const slotIds = await this.bookingsRepo.findSlotsWithWaitlistCandidates(
      this.em,
      CONCEPTS.WAITLIST_ACTIVE,
      limit,
      new Date(),
    );
    return { slotIds };
  }

  /** UC-41-13: programa recordatorios adicionales para una cita. */
  async scheduleReminders(
    bookingId: string,
    dto: ScheduleRemindersDto,
    actor: AuthenticatedUser,
  ): Promise<ScheduleRemindersResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.reminder.schedule',
        bookingId,
        count: dto.offsetsMinutes.length,
      },
      'Scheduling appointment reminders',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }

      const slot = await this.bookingsRepo.findSlotById(
        tx,
        booking.bookableSlotId,
      );
      if (!slot) {
        throw new ResourceNotFoundException('Slot de la cita no encontrado', {
          slotId: booking.bookableSlotId,
        });
      }

      const channelConceptId =
        dto.channel === 'EMAIL'
          ? CONCEPTS.REMINDER_CH_EMAIL
          : CONCEPTS.REMINDER_CH_SMS;

      for (const offset of dto.offsetsMinutes) {
        this.bookingsRepo.createReminder(tx, {
          bookingId,
          channelConceptId,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      return { bookingId, scheduled: dto.offsetsMinutes.length };
    });
  }

  /**
   * UC-41-14 (worker): marca como enviados los recordatorios cuya hora llegó.
   *
   * El envío real es responsabilidad del módulo de mensajería (35), todavía no
   * implementado: aquí solo se mueve el estado, sin simular un envío que no ocurrió.
   */
  async dispatchReminders(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    return this.em.transactional(async (tx) => {
      const due = await this.bookingsRepo.findDueReminders(
        tx,
        CONCEPTS.REMINDER_SCHEDULED,
        new Date(),
        limit,
      );

      for (const reminder of due) {
        reminder.statusConceptId = CONCEPTS.REMINDER_SENT;
        reminder.sentAt = new Date();
        touch(reminder, undefined);
      }

      if (due.length > 0) {
        this.logger.info(
          { operation: 'scheduling.reminder.dispatch', dispatched: due.length },
          'Marked reminders as dispatched',
        );
      }

      return {
        processed: due.length,
        detail:
          'Recordatorios marcados como enviados; la entrega la ejecuta messaging (35)',
      };
    });
  }
}
