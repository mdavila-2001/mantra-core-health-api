import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { CreateHoldDto, HoldResponseDto } from '../../../presentation/dto';
import { DEFAULT_HOLD_TTL_SECONDS } from '../../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { SlotPolicyResolver } from '../support/slot-policy-resolver';
import { randomUUID } from 'node:crypto';
import {
  slotHoldRefusal,
  slotTimingRefusal,
} from '../../../domain/booking/hold-admission';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/**
 * UC-41-05: reserva temporalmente un cupo del slot (hold anti-double-booking).
 */
@Injectable()
export class PlaceHoldUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly slotPolicy: SlotPolicyResolver,
    private readonly access: BookingAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PlaceHoldUseCase.name);
  }

  /**
   * UC-41-05: reserva temporalmente un cupo del slot.
   *
   * Este es el punto donde se evita el doble booking: el slot se toma con
   * `SELECT ... FOR UPDATE`, de modo que dos peticiones simultáneas se serializan y
   * el decremento de `remaining_capacity` nunca puede bajar de cero. El hold caduca
   * solo (TTL de la política) y el worker UC-41-07 devuelve el cupo.
   */
  async execute(
    slotId: string,
    dto: CreateHoldDto,
    actor: AuthenticatedUser,
  ): Promise<HoldResponseDto> {
    this.logger.info(
      { operation: 'scheduling.hold.place', slotId },
      'Placing hold on bookable slot',
    );

    // Antes de abrir la transacción: la comprobación lee de otra tabla y
    // sostener el `FOR UPDATE` del cupo mientras tanto serializaría a todos los
    // que piden ese mismo horario detrás de una consulta que no es del cupo.
    if (dto.patientProfileId !== undefined) {
      await this.access.assertMayActForPatient(dto.patientProfileId, actor);
    }

    return this.em.transactional(async (tx) => {
      const slot = await this.bookingsRepo.findSlotForUpdate(tx, slotId);
      if (!slot) {
        throw new ResourceNotFoundException(
          'Slot no encontrado',
          { slotId },
          SchedulingErrorReason.SLOT_NOT_FOUND,
        );
      }
      const refusal = slotHoldRefusal(slot);
      if (refusal === 'BLOCKED') {
        throw new PreconditionFailedException(
          'El slot está bloqueado',
          {
            slotId,
          },
          SchedulingErrorReason.SLOT_BLOCKED,
        );
      }
      if (refusal === 'NO_CAPACITY') {
        throw new ConflictException(
          'El slot no tiene cupos disponibles',
          {
            slotId,
          },
          SchedulingErrorReason.SLOT_NO_CAPACITY,
        );
      }

      const policy = slot.scheduleTemplateId
        ? await this.slotPolicy.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;

      // Un turno que ya empezó no se puede pedir, aunque le quede capacidad: la
      // agenda dejó de ofrecerlos (A-03) y acá se cierra la puerta directa
      // (A-02). Es 422 y no 404 a propósito —el cupo existe, lo que no existe
      // es la posibilidad— y el mensaje lo dice en palabras, porque lo lee un
      // paciente.
      const noticeMinutes = policy?.minNoticeMinutes ?? 0;
      const timing = slotTimingRefusal(slot.startAt, noticeMinutes, Date.now());
      if (timing !== null) {
        // Dos motivos distintos merecen dos frases distintas: a quien pide un
        // turno de la semana pasada no se le habla de anticipación mínima, y a
        // quien llega diez minutos tarde para una regla de treinta no se le
        // dice que «ya pasó» cuando todavía no pasó.
        throw new PreconditionFailedException(
          timing === 'ALREADY_PASSED'
            ? 'Ese horario ya pasó.'
            : `Esa cita empieza demasiado pronto: hay que pedirla con al menos ${noticeMinutes} minutos de anticipación.`,
          {
            slotId,
            startAt: slot.startAt.toISOString(),
            minutosDeAviso: noticeMinutes,
          },
          timing === 'ALREADY_PASSED'
            ? SchedulingErrorReason.APPOINTMENT_SLOT_PAST
            : SchedulingErrorReason.APPOINTMENT_MIN_NOTICE_NOT_MET,
        );
      }

      if (policy?.maxActivePerPatient && dto.patientProfileId) {
        const active = await this.bookingsRepo.countActiveBookingsForPatient(
          tx,
          dto.patientProfileId,
          [...ACTIVE_BOOKING_STATES],
        );
        if (active >= policy.maxActivePerPatient) {
          throw new ConflictException(
            'El paciente alcanzó el máximo de citas activas',
            {
              patientProfileId: dto.patientProfileId,
              maxActivePerPatient: policy.maxActivePerPatient,
            },
            SchedulingErrorReason.PATIENT_MAX_ACTIVE_BOOKINGS,
          );
        }
      }

      const ttlSeconds = policy?.holdTtlSeconds ?? DEFAULT_HOLD_TTL_SECONDS;
      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: slotId,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        actorUserId: actor.id,
      });

      slot.remainingCapacity -= 1;
      if (slot.remainingCapacity === 0)
        slot.statusConceptId = CONCEPTS.SLOT_HELD;
      touch(slot, actor.id);

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        remainingCapacity: slot.remainingCapacity,
      };
    });
  }
}
