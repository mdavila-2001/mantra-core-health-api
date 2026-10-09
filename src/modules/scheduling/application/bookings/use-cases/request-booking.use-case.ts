import type { AuthenticatedUser } from '../../../../../common';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { BookingMaterializer } from '../support/booking-materializer';
import {
  BookingResponseDto,
  RequestBookingDto,
} from '../../../presentation/dto';
import { CLIN } from '../../../../clinical/clinical.concepts';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';

/** El paciente solicita un turno: la cita nace pendiente de aceptación. */
@Injectable()
export class RequestBookingUseCase {
  constructor(
    private readonly materializer: BookingMaterializer,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RequestBookingUseCase.name);
  }

  /**
   * El paciente **solicita** un turno: la cita nace pendiente de aceptación
   * (corrección #11, primer eslabón del P0).
   *
   * ## Qué cambia respecto de confirmar
   *
   * El cupo se toma igual —el hold ya lo descontó, y soltarlo mientras el
   * profesional decide dejaría que otra persona lo tomara y que la solicitud no
   * se pudiera aceptar nunca— pero la cita queda en `PENDING_CONFIRMATION`, sin
   * `confirmed_at` y con su cita clínica en `pending`. La confirmación es del
   * profesional (carril 07), no de quien pide.
   *
   * ## Por qué no se programan recordatorios
   *
   * Recordar un turno que todavía puede rechazarse es prometer algo que nadie
   * comprometió. Se programan al aceptar.
   */
  async execute(
    holdToken: string,
    dto: RequestBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.request',
        patientProfileId: dto.patientProfileId,
      },
      'Requesting booking from hold',
    );

    const result = await this.materializer.materializeBooking(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        appointmentStatusConceptId: CLIN.APPOINTMENT_PENDING,
        reminderOffsetsMinutes: [],
      },
      actor,
    );

    // Fuera de la transacción, como todos los avisos: que no salga la campana
    // no puede deshacer una solicitud que ya existe.
    await this.notifier.notifyRequest(result.id);
    return result;
  }
}
