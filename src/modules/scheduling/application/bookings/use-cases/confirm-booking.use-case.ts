import { CONCEPTS, type AuthenticatedUser } from '../../../../../common';
import { BookingMaterializer } from '../support/booking-materializer';
import {
  BookingResponseDto,
  ConfirmBookingDto,
} from '../../../presentation/dto';
import { CLIN } from '../../../../clinical/clinical.concepts';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/** UC-41-06: convierte el hold en cita confirmada. */
@Injectable()
export class ConfirmBookingUseCase {
  constructor(
    private readonly materializer: BookingMaterializer,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConfirmBookingUseCase.name);
  }

  /**
   * UC-41-06: convierte el hold en cita confirmada.
   *
   * Un hold vencido no se puede confirmar aunque el worker todavía no lo haya
   * reciclado: la comprobación por `expires_at` es lo que evita que una petición
   * tardía se cuele sobre un cupo que ya se considera libre.
   *
   * Es la entrada del mostrador y de quien ya tiene potestad para comprometer la
   * agenda. El paciente que pide un turno entra por {@link requestBooking}: el
   * cupo se toma igual, pero la cita nace pendiente de que el profesional la
   * acepte.
   */
  async execute(
    holdToken: string,
    dto: ConfirmBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.confirm',
        patientProfileId: dto.patientProfileId,
      },
      'Confirming booking from hold',
    );

    return this.materializer.materializeBooking(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
        confirmedAt: new Date(),
        reminderOffsetsMinutes: dto.reminderOffsetsMinutes ?? [],
      },
      actor,
    );
  }
}
