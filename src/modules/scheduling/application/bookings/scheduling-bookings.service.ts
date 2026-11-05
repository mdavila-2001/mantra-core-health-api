import {
  AcceptBookingDto,
  BookingDecisionResponseDto,
  BookingItemDto,
  BookingResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  ConfirmBookingDto,
  CreateDirectAppointmentDto,
  CreateHoldDto,
  DirectAppointmentResponseDto,
  HoldResponseDto,
  PaymentStateDto,
  ProposeScheduleDto,
  ProposeScheduleResponseDto,
  RejectBookingDto,
  RequestBookingDto,
  RequestBookingInfoDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  SearchBookingsResponseDto,
  SetPaymentStateDto,
  SetPaymentStateResponseDto,
  WorkerBatchResultDto,
} from '../../presentation/dto';
import { BookingStateTransitionHandler } from './booking-state-transition.handler';
import type { AppointmentBookings } from '../../entities';
import type { AuthenticatedUser } from '../../../../common';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { CreateDirectAppointmentUseCase } from './use-cases/create-direct-appointment.use-case';
import { DEFAULT_WORKER_BATCH } from '../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import { ExpireHoldsUseCase } from './use-cases/expire-holds.use-case';
import { GetBookingUseCase } from './use-cases/get-booking.use-case';
import { GetPaymentStateUseCase } from './use-cases/get-payment-state.use-case';
import { Injectable } from '@nestjs/common';
import { PlaceHoldUseCase } from './use-cases/place-hold.use-case';
import { ProposeScheduleUseCase } from './use-cases/propose-schedule.use-case';
import { RequestBookingInfoUseCase } from './use-cases/request-booking-info.use-case';
import { RequestBookingUseCase } from './use-cases/request-booking.use-case';
import { RescheduleBookingUseCase } from './use-cases/reschedule-booking.use-case';
import { SearchBookingsUseCase } from './use-cases/search-bookings.use-case';
import { SetPaymentStateUseCase } from './use-cases/set-payment-state.use-case';
import { StartAppointmentUseCase } from './use-cases/start-appointment.use-case';

/** Filtros del listado de citas: al menos paciente o recurso. */
export interface SearchBookingsFilters {
  /** Paciente titular. */
  patientProfileId?: string;
  /** Recurso (agenda). */
  resourceId?: string;
  /** Inicio de la ventana. */
  from?: Date;
  /** Fin de la ventana. */
  to?: Date;
  /** Incluir también las canceladas; por defecto no. */
  includeCancelled: boolean;
}

/**
 * Fachada de las reservas: conserva la API pública que usan controllers y otros
 * servicios y delega cada operación en su caso de uso (`use-cases/`). No tiene
 * reglas propias: una operación = una clase = una transacción.
 */
@Injectable()
export class SchedulingBookingsService {
  constructor(
    private readonly placeHoldUseCase: PlaceHoldUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly requestBookingUseCase: RequestBookingUseCase,
    private readonly createDirectAppointmentUseCase: CreateDirectAppointmentUseCase,
    private readonly expireHoldsUseCase: ExpireHoldsUseCase,
    private readonly rescheduleBookingUseCase: RescheduleBookingUseCase,
    private readonly bookingStateTransitionHandler: BookingStateTransitionHandler,
    private readonly setPaymentStateUseCase: SetPaymentStateUseCase,
    private readonly getPaymentStateUseCase: GetPaymentStateUseCase,
    private readonly requestBookingInfoUseCase: RequestBookingInfoUseCase,
    private readonly proposeScheduleUseCase: ProposeScheduleUseCase,
    private readonly startAppointmentUseCase: StartAppointmentUseCase,
    private readonly searchBookingsUseCase: SearchBookingsUseCase,
    private readonly getBookingUseCase: GetBookingUseCase,
  ) {}

  placeHold(
    slotId: string,
    dto: CreateHoldDto,
    actor: AuthenticatedUser,
  ): Promise<HoldResponseDto> {
    return this.placeHoldUseCase.execute(slotId, dto, actor);
  }

  confirmBooking(
    holdToken: string,
    dto: ConfirmBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.confirmBookingUseCase.execute(holdToken, dto, actor);
  }

  requestBooking(
    holdToken: string,
    dto: RequestBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.requestBookingUseCase.execute(holdToken, dto, actor);
  }

  createDirectAppointment(
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
  ): Promise<DirectAppointmentResponseDto> {
    return this.createDirectAppointmentUseCase.execute(dto, actor);
  }

  expireHolds(limit = DEFAULT_WORKER_BATCH): Promise<WorkerBatchResultDto> {
    return this.expireHoldsUseCase.execute(limit);
  }

  reschedule(
    bookingId: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    return this.rescheduleBookingUseCase.execute(bookingId, dto, actor);
  }

  reject(
    bookingId: string,
    dto: RejectBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.bookingStateTransitionHandler.reject(bookingId, dto, actor);
  }

  setPaymentState(
    bookingId: string,
    dto: SetPaymentStateDto,
    actor: AuthenticatedUser,
  ): Promise<SetPaymentStateResponseDto> {
    return this.setPaymentStateUseCase.execute(bookingId, dto, actor);
  }

  getPaymentState(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentStateDto | null> {
    return this.getPaymentStateUseCase.execute(bookingId, actor);
  }

  accept(
    bookingId: string,
    dto: AcceptBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingStateTransitionHandler.accept(bookingId, dto, actor);
  }

  requestInfo(
    bookingId: string,
    dto: RequestBookingInfoDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.requestBookingInfoUseCase.execute(bookingId, dto, actor);
  }

  proposeSchedule(
    bookingId: string,
    dto: ProposeScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<ProposeScheduleResponseDto> {
    return this.proposeScheduleUseCase.execute(bookingId, dto, actor);
  }

  start(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingStateTransitionHandler.start(bookingId, actor);
  }

  complete(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingStateTransitionHandler.complete(bookingId, actor);
  }

  checkIn(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    return this.bookingStateTransitionHandler.checkIn(bookingId, actor);
  }

  getBookingById(
    bookingId: string,
    actor?: AuthenticatedUser,
  ): Promise<BookingItemDto> {
    return this.getBookingUseCase.execute(bookingId, actor);
  }

  cancel(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.bookingStateTransitionHandler.cancel(bookingId, dto, actor);
  }

  searchBookings(
    filters: SearchBookingsFilters,
    limit: number,
    actor?: AuthenticatedUser,
  ): Promise<SearchBookingsResponseDto> {
    return this.searchBookingsUseCase.execute(filters, limit, actor);
  }

  createDirectAppointmentInTransaction(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
    options?: { bookingChannel?: 'DESK' | 'WALK_IN' },
  ): ReturnType<CreateDirectAppointmentUseCase['executeInTransaction']> {
    return this.createDirectAppointmentUseCase.executeInTransaction(
      tx,
      dto,
      actor,
      options,
    );
  }

  startInTransaction(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.startAppointmentUseCase.executeInTransaction(
      tx,
      booking,
      actor,
    );
  }
}
