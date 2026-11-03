import type { AuthenticatedUser } from '../../../../common';
import {
  AcceptBookingDto,
  BookingDecisionResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  RejectBookingDto,
} from '../../presentation/dto';
import { Injectable } from '@nestjs/common';
import { AcceptBookingUseCase } from './use-cases/accept-booking.use-case';
import { CancelBookingUseCase } from './use-cases/cancel-booking.use-case';
import { CheckInBookingUseCase } from './use-cases/check-in-booking.use-case';
import { CompleteAppointmentUseCase } from './use-cases/complete-appointment.use-case';
import { RejectBookingUseCase } from './use-cases/reject-booking.use-case';
import { StartAppointmentUseCase } from './use-cases/start-appointment.use-case';

/** Fachada de las acciones que cambian el estado de una reserva. */
@Injectable()
export class BookingStateTransitionHandler {
  constructor(
    private readonly acceptBooking: AcceptBookingUseCase,
    private readonly cancelBooking: CancelBookingUseCase,
    private readonly rejectBooking: RejectBookingUseCase,
    private readonly startAppointment: StartAppointmentUseCase,
    private readonly completeAppointment: CompleteAppointmentUseCase,
    private readonly checkInBooking: CheckInBookingUseCase,
  ) {}

  accept(
    bookingId: string,
    dto: AcceptBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.acceptBooking.execute(bookingId, dto, actor);
  }

  cancel(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.cancelBooking.execute(bookingId, dto, actor, 'CANCELLED');
  }

  reject(
    bookingId: string,
    dto: RejectBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.rejectBooking.execute(bookingId, dto, actor);
  }

  start(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.startAppointment.execute(bookingId, actor);
  }

  complete(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.completeAppointment.execute(bookingId, actor);
  }

  checkIn(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    return this.checkInBooking.execute(bookingId, actor);
  }
}
