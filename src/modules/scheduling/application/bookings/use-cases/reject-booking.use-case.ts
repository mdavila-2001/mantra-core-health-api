import type { AuthenticatedUser } from '../../../../../common';
import {
  CancelBookingResponseDto,
  RejectBookingDto,
} from '../../../presentation/dto';
import { CancelBookingUseCase } from './cancel-booking.use-case';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/** El profesional rechaza la solicitud, con motivo. */
@Injectable()
export class RejectBookingUseCase {
  constructor(
    private readonly cancellation: CancelBookingUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RejectBookingUseCase.name);
  }

  /**
   * El profesional **rechaza** la solicitud, con motivo (correcciones #11 y #14).
   *
   * Rechazar es cancelar desde el otro lado del mostrador, así que reusa el
   * mismo camino: libera el cupo, registra la cancelación con
   * `CANCEL_BY_PROVIDER` y deja el motivo en el historial, de donde el paciente
   * lo lee. Existe como acto propio porque en la agenda **es** otro acto —se
   * rechaza lo que todavía no se aceptó— y darle su nombre evita que la pantalla
   * tenga que explicar por qué «cancelar» aparece sobre una solicitud.
   */
  async execute(
    bookingId: string,
    dto: RejectBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.reject', bookingId },
      'Rejecting booking request',
    );

    return this.cancellation.execute(
      bookingId,
      { cancelledBy: 'PROVIDER', reasonText: dto.reasonText },
      actor,
      'REJECTED',
    );
  }
}
