import { HttpException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { getCurrentTenantId, type AuthenticatedUser } from '../../../../common';
import { SurveysAssignmentsService } from '../../../surveys/services';
import type { BookingCompletedPort } from '../../application/ports/booking-completed.port';

/**
 * Puerto del cierre de la atención contra `surveys`: le pide emitir al paciente
 * la invitación de la reserva completada (la encuesta base del sistema o, en un
 * servicio, la del catálogo que el profesional le importó).
 *
 * Corre en un savepoint de la transacción en curso: con `RLS_ENFORCE=true` la
 * petición entera es una transacción y el cierre todavía no está confirmado;
 * sin RLS, el cierre ya se confirmó y el savepoint abre una transacción propia.
 * En los dos casos un fallo descarta sólo lo de la encuesta.
 *
 * No lanza nunca: una encuesta que no sale no deshace la atención ni es un
 * error para quien la cerró. Lo esperable (reserva no visible, precondición)
 * queda en `warn`; lo inesperado, en `error`, siempre con el identificador de
 * la reserva (nunca datos del paciente). La emisión se puede repetir con
 * `POST /surveys/invitations`, que es idempotente.
 */
@Injectable()
export class SurveysBookingCompletedAdapter implements BookingCompletedPort {
  constructor(
    private readonly surveys: SurveysAssignmentsService,
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysBookingCompletedAdapter.name);
  }

  async onBookingCompleted(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.em
        .fork({ keepTransactionContext: true })
        .transactional(() =>
          this.surveys.issueForCompletedBooking(bookingId, actor),
        );
    } catch (error) {
      // El runbook del README de surveys explica cómo listar y reemitir las
      // reservas completadas sin invitación.
      const expected =
        error instanceof HttpException && error.getStatus() < 500;
      const log = {
        operation: 'scheduling.booking.survey',
        bookingId,
        tenantId: getCurrentTenantId(),
        reason: error instanceof Error ? error.message : String(error),
      };
      if (expected) {
        this.logger.warn(log, 'La atención completada no emitió encuesta');
      } else {
        this.logger.error(
          { ...log, err: error },
          'No se pudo emitir la encuesta de la atención completada',
        );
      }
    }
  }
}
