import { touch, type AuthenticatedUser } from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import {
  BookingDecisionResponseDto,
  RequestBookingInfoDto,
} from '../../../presentation/dto';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import { requireReason } from '../support/require-reason';

/** CARRIL 11: el centro pide algo antes de aceptar la solicitud. */
@Injectable()
export class RequestBookingInfoUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: BookingAccess,
    private readonly transitions: BookingTransitionRecorder,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RequestBookingInfoUseCase.name);
  }

  /**
   * El centro **pide algo** antes de aceptar la solicitud — CARRIL 11.
   *
   * La especificación de centros de diagnóstico enumera tres cosas que un
   * centro puede pedir antes de confirmar: documentación adicional, una orden
   * médica, o avisar cómo hay que prepararse. Las tres son la misma situación
   * —falta algo— así que son una sola operación con un motivo tipado, y no tres
   * estados que después nadie sabe distinguir.
   *
   * **No cambia de estado si ya estaba pendiente.** La solicitud nace en
   * `PENDING_CONFIRMATION` y pedir un segundo papel no la mueve a ningún lado:
   * lo que cambia es el mensaje. La máquina rechaza `X → X` con razón, así que
   * la transición sólo se valida cuando de verdad la hay.
   *
   * **El cupo se mantiene tomado.** Pedirle un papel a alguien no es motivo
   * para regalarle su horario a otra persona mientras lo consigue.
   *
   * @param bookingId - Solicitud sobre la que se pide.
   * @param dto - Qué falta y el mensaje para la persona.
   * @param actor - Quien pide, del lado del prestador.
   * @returns El estado en el que quedó la solicitud.
   */
  async execute(
    bookingId: string,
    dto: RequestBookingInfoDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    const reason = requireReason(dto.reasonText, 'pedir documentación');

    this.logger.info(
      {
        operation: 'scheduling.booking.request-info',
        bookingId,
        infoRequested: dto.infoRequested,
      },
      'Requesting information before accepting',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.transitions.assertPending(fromState, bookingId);

      const occurredAt = new Date();
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.transitions.assertTransition(
          fromState,
          SCHED.BOOKING_PENDING_CONFIRMATION,
        );
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
        touch(booking, actor.id);
      }

      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        reasonText: reason,
        actorKind: 'PROVIDER',
        infoRequested: dto.infoRequested,
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        occurredAt: occurredAt.toISOString(),
        // Pedir documentación no acepta la solicitud, así que no puede chocar
        // con ninguna otra ni desplazarla: la lista va vacía a propósito, igual
        // que en las demás operaciones que dejan la cita pendiente.
        desplazadas: [],
      };
    });
  }
}
