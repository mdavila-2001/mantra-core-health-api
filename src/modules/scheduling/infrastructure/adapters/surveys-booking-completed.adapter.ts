import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { getCurrentTenantId, type AuthenticatedUser } from '../../../../common';
import { SurveysAssignmentsService } from '../../../surveys/services';
import type { BookingCompletedPort } from '../../application/ports/booking-completed.port';

/**
 * Puerto del cierre de la atención contra `surveys`: le pide emitir al paciente
 * la invitación de la reserva completada (las preguntas base del sistema y,
 * detrás, las de la encuesta del profesional).
 *
 * No lanza nunca: la atención ya está cerrada y confirmada, y una encuesta que
 * no sale no la deshace ni es un error para quien la cerró. El fallo queda en
 * el log con el identificador de la reserva (nunca datos del paciente) y la
 * emisión se puede repetir con `POST /surveys/invitations`, que es idempotente.
 */
@Injectable()
export class SurveysBookingCompletedAdapter implements BookingCompletedPort {
  constructor(
    private readonly surveys: SurveysAssignmentsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysBookingCompletedAdapter.name);
  }

  async onBookingCompleted(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.surveys.issueForCompletedBooking(bookingId, actor);
    } catch (error) {
      // `error` y no `warn`: es una emisión perdida que nadie reintenta sola.
      // El runbook del README de surveys explica cómo listar y reemitir las
      // reservas completadas sin invitación. Sólo ids y la razón: nada del
      // paciente.
      this.logger.error(
        {
          operation: 'scheduling.booking.survey',
          bookingId,
          tenantId: getCurrentTenantId(),
          reason: error instanceof Error ? error.message : String(error),
          err: error,
        },
        'No se pudo emitir la encuesta de la atención completada',
      );
    }
  }
}
