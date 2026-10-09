import { AuditBookingHistoryAdapter } from '../../infrastructure/adapters/audit-booking-history.adapter';
import { ClinicalAppointmentsAdapter } from '../../infrastructure/adapters/clinical-appointments.adapter';
import { FormsOriginAdapter } from '../../infrastructure/adapters/forms-origin.adapter';
import { InsuranceReadAdapter } from '../../infrastructure/adapters/insurance-read.adapter';
import { ProfilesPatientRepresentationAdapter } from '../../infrastructure/adapters/profiles-patient-representation.adapter';
import { SchedulingBookingsService } from './scheduling-bookings.service';
import {
  BookingAccess,
  BookingChangeNotifier,
  BookingItemAssembler,
  BookingMaterializer,
  BookingTransitionRecorder,
  ClinicalAppointmentSync,
  DisplacedRequestsCanceller,
  ServiceSlotLifecycle,
  SlotPolicyResolver,
} from './support';
import { AcceptBookingUseCase } from './use-cases/accept-booking.use-case';
import { CancelBookingUseCase } from './use-cases/cancel-booking.use-case';
import { CheckInBookingUseCase } from './use-cases/check-in-booking.use-case';
import { CompleteAppointmentUseCase } from './use-cases/complete-appointment.use-case';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { CreateDirectAppointmentUseCase } from './use-cases/create-direct-appointment.use-case';
import { ExpireHoldsUseCase } from './use-cases/expire-holds.use-case';
import { GetBookingUseCase } from './use-cases/get-booking.use-case';
import { GetPaymentStateUseCase } from './use-cases/get-payment-state.use-case';
import { PlaceHoldUseCase } from './use-cases/place-hold.use-case';
import { ProposeScheduleUseCase } from './use-cases/propose-schedule.use-case';
import { RejectBookingUseCase } from './use-cases/reject-booking.use-case';
import { RequestBookingInfoUseCase } from './use-cases/request-booking-info.use-case';
import { RequestBookingUseCase } from './use-cases/request-booking.use-case';
import { RescheduleBookingUseCase } from './use-cases/reschedule-booking.use-case';
import { SearchBookingsUseCase } from './use-cases/search-bookings.use-case';
import { SetPaymentStateUseCase } from './use-cases/set-payment-state.use-case';
import { StartAppointmentUseCase } from './use-cases/start-appointment.use-case';

/**
 * Las dependencias *crudas* del módulo de reservas, tal como las simulan las
 * pruebas: repositorios y servicios de los otros contextos, sin sus puertos.
 */
export interface BookingsServiceDoubles {
  em: any;
  bookingsRepo: any;
  catalogRepo: any;
  historyRepo: any;
  appointmentsRepo: any;
  noticeRepo: any;
  notices: any;
  logger: any;
  affiliations: any;
  professionalTime: any;
  coverageRepo: any;
  waitlist: any;
  encountersRepo: any;
  claimReadRepo: any;
  representation: any;
  formOrigin: any;
  serviceAgenda: any;
}

/**
 * Arma la fachada de reservas con todos sus casos de uso a partir de dobles.
 *
 * Los puertos se resuelven con los **adaptadores reales** sobre los dobles de
 * los repositorios ajenos: así las pruebas siguen mirando las mismas llamadas
 * que ve cada contexto, y el cableado de los adaptadores queda cubierto.
 * Vive en un `.testing.ts` para que el build de producción lo excluya.
 */
export function createBookingsService(d: BookingsServiceDoubles) {
  const history = new AuditBookingHistoryAdapter(d.historyRepo);
  const clinical = new ClinicalAppointmentsAdapter(
    d.appointmentsRepo,
    d.encountersRepo,
  );
  const insurance = new InsuranceReadAdapter(d.coverageRepo, d.claimReadRepo);
  const formOrigin = new FormsOriginAdapter(d.formOrigin);
  const representation = new ProfilesPatientRepresentationAdapter(
    d.representation,
  );

  const access = new BookingAccess(
    d.bookingsRepo,
    d.catalogRepo,
    representation,
    d.affiliations,
  );
  const transitions = new BookingTransitionRecorder(history);
  const notifier = new BookingChangeNotifier(
    d.em,
    d.noticeRepo,
    d.notices,
    d.logger,
  );
  const serviceSlots = new ServiceSlotLifecycle(
    d.bookingsRepo,
    d.serviceAgenda,
  );
  const clinicalSync = new ClinicalAppointmentSync(clinical);
  const slotPolicy = new SlotPolicyResolver(d.catalogRepo);
  const materializer = new BookingMaterializer(
    d.em,
    d.bookingsRepo,
    d.catalogRepo,
    d.professionalTime,
    d.serviceAgenda,
    access,
    clinicalSync,
    slotPolicy,
  );
  const displaced = new DisplacedRequestsCanceller(
    d.bookingsRepo,
    transitions,
    serviceSlots,
  );
  const assembler = new BookingItemAssembler(
    d.bookingsRepo,
    clinical,
    insurance,
  );
  const cancelBooking = new CancelBookingUseCase(
    d.em,
    d.bookingsRepo,
    d.catalogRepo,
    access,
    representation,
    transitions,
    serviceSlots,
    notifier,
    d.waitlist,
    d.logger,
  );

  return new SchedulingBookingsService(
    new PlaceHoldUseCase(d.em, d.bookingsRepo, slotPolicy, access, d.logger),
    new ConfirmBookingUseCase(materializer, d.logger),
    new RequestBookingUseCase(materializer, notifier, d.logger),
    new CreateDirectAppointmentUseCase(
      d.em,
      d.bookingsRepo,
      d.catalogRepo,
      d.professionalTime,
      access,
      clinicalSync,
      transitions,
      notifier,
      clinical,
      formOrigin,
      d.logger,
    ),
    new ExpireHoldsUseCase(d.em, d.bookingsRepo, serviceSlots, d.logger),
    new RescheduleBookingUseCase(
      d.em,
      d.bookingsRepo,
      d.catalogRepo,
      d.professionalTime,
      access,
      serviceSlots,
      history,
      notifier,
      d.logger,
    ),
    cancelBooking,
    new RejectBookingUseCase(cancelBooking, d.logger),
    new SetPaymentStateUseCase(d.em, d.bookingsRepo, access, history, d.logger),
    new GetPaymentStateUseCase(d.em, d.bookingsRepo, access),
    new AcceptBookingUseCase(
      d.em,
      d.bookingsRepo,
      d.catalogRepo,
      d.professionalTime,
      access,
      transitions,
      clinicalSync,
      displaced,
      notifier,
      d.logger,
    ),
    new RequestBookingInfoUseCase(d.em, access, transitions, d.logger),
    new ProposeScheduleUseCase(
      d.em,
      d.bookingsRepo,
      access,
      serviceSlots,
      transitions,
      d.logger,
    ),
    new StartAppointmentUseCase(
      d.em,
      access,
      transitions,
      clinicalSync,
      d.logger,
    ),
    new CompleteAppointmentUseCase(
      d.em,
      access,
      transitions,
      serviceSlots,
      clinicalSync,
      d.logger,
    ),
    new CheckInBookingUseCase(d.em, d.bookingsRepo, transitions, d.logger),
    new SearchBookingsUseCase(
      d.em,
      d.bookingsRepo,
      d.catalogRepo,
      access,
      history,
      clinical,
      insurance,
      representation,
      assembler,
    ),
    new GetBookingUseCase(
      d.em,
      d.bookingsRepo,
      d.catalogRepo,
      access,
      history,
      clinical,
      representation,
      assembler,
    ),
  );
}
