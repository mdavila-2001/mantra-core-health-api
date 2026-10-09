import { AcceptBookingUseCase } from './accept-booking.use-case';
import { CancelBookingUseCase } from './cancel-booking.use-case';
import { CheckInBookingUseCase } from './check-in-booking.use-case';
import { CompleteAppointmentUseCase } from './complete-appointment.use-case';
import { ConfirmBookingUseCase } from './confirm-booking.use-case';
import { CreateDirectAppointmentUseCase } from './create-direct-appointment.use-case';
import { ExpireHoldsUseCase } from './expire-holds.use-case';
import { GetBookingUseCase } from './get-booking.use-case';
import { GetPaymentStateUseCase } from './get-payment-state.use-case';
import { PlaceHoldUseCase } from './place-hold.use-case';
import { ProposeScheduleUseCase } from './propose-schedule.use-case';
import { RejectBookingUseCase } from './reject-booking.use-case';
import { RequestBookingInfoUseCase } from './request-booking-info.use-case';
import { RequestBookingUseCase } from './request-booking.use-case';
import { RescheduleBookingUseCase } from './reschedule-booking.use-case';
import { SearchBookingsUseCase } from './search-bookings.use-case';
import { SetPaymentStateUseCase } from './set-payment-state.use-case';
import { StartAppointmentUseCase } from './start-appointment.use-case';

/** Un caso de uso por operación de reserva; el módulo los registra como providers. */
export const bookingUseCases = [
  AcceptBookingUseCase,
  CancelBookingUseCase,
  CheckInBookingUseCase,
  CompleteAppointmentUseCase,
  ConfirmBookingUseCase,
  CreateDirectAppointmentUseCase,
  ExpireHoldsUseCase,
  GetBookingUseCase,
  GetPaymentStateUseCase,
  PlaceHoldUseCase,
  ProposeScheduleUseCase,
  RejectBookingUseCase,
  RequestBookingInfoUseCase,
  RequestBookingUseCase,
  RescheduleBookingUseCase,
  SearchBookingsUseCase,
  SetPaymentStateUseCase,
  StartAppointmentUseCase,
];
