import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  ProposeScheduleDto,
  ProposeScheduleResponseDto,
} from '../../../presentation/dto';
import { SCHED } from '../../../domain/scheduling.concepts';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { ServiceSlotLifecycle } from '../support/service-slot-lifecycle';
import { requireReason } from '../support/require-reason';

/** CARRIL 11: el centro propone otro horario para la solicitud. */
@Injectable()
export class ProposeScheduleUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly access: BookingAccess,
    private readonly serviceSlots: ServiceSlotLifecycle,
    private readonly transitions: BookingTransitionRecorder,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProposeScheduleUseCase.name);
  }

  /**
   * El centro **propone otro horario** para la solicitud — CARRIL 11.
   *
   * Mueve el cupo tomado al propuesto y deja la solicitud pendiente: proponer
   * no es acordar, y la persona todavía tiene que poder mirar el horario nuevo.
   * Por eso no confirma nada y el cupo queda tomado, no reservado.
   *
   * Se distingue de `reschedule` en quién y desde dónde: aquélla mueve una cita
   * **vigente** a pedido de quien la tiene, ésta contrapropone sobre una
   * solicitud que todavía no se aceptó.
   *
   * @param bookingId - Solicitud sobre la que se propone.
   * @param dto - El cupo propuesto y por qué.
   * @param actor - Quien propone, del lado del prestador.
   * @returns El cupo en el que quedó la solicitud.
   */
  async execute(
    bookingId: string,
    dto: ProposeScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<ProposeScheduleResponseDto> {
    const reason = requireReason(dto.reasonText, 'proponer otro horario');

    this.logger.info(
      {
        operation: 'scheduling.booking.propose-schedule',
        bookingId,
        toSlotId: dto.proposedSlotId,
      },
      'Proposing another slot for the request',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.transitions.assertPending(fromState, bookingId);

      const originId = booking.bookableSlotId;
      await this.serviceSlots.assertNotAService(
        tx,
        originId,
        'proponer otro horario para',
      );
      if (dto.proposedSlotId === originId) {
        throw new PreconditionFailedException(
          'El horario propuesto es el que ya tiene la solicitud',
          { bookingId },
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.proposedSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException('Cupo propuesto no encontrado', {
          slotId: dto.proposedSlotId,
        });
      }
      if (target.remainingCapacity <= 0) {
        throw new ConflictException('El cupo propuesto no tiene lugar', {
          slotId: dto.proposedSlotId,
        });
      }

      const originBooking = await this.bookingsRepo.findSlotForUpdate(
        tx,
        originId,
      );
      if (originBooking) {
        originBooking.remainingCapacity += 1;
        if (originBooking.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          originBooking.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(originBooking, actor.id);
      }
      target.remainingCapacity -= 1;
      if (target.remainingCapacity === 0) {
        target.statusConceptId = CONCEPTS.SLOT_HELD;
      }
      touch(target, actor.id);

      booking.bookableSlotId = dto.proposedSlotId;
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.transitions.assertTransition(
          fromState,
          SCHED.BOOKING_PENDING_CONFIRMATION,
        );
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
      }
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId: originId,
        toSlotId: dto.proposedSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: originId,
        toSlotId: dto.proposedSlotId,
        reasonText: reason,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: originId,
        toSlotId: dto.proposedSlotId,
      };
    });
  }
}
