export { SchedulingCatalogService } from './catalog/scheduling-catalog.service';
export { SchedulingBookingsService } from './bookings/scheduling-bookings.service';
export { SchedulingWaitlistService } from './waitlist/scheduling-waitlist.service';
export {
  SchedulingConfirmationService,
  type ScopeValues,
} from './confirmation/scheduling-confirmation.service';

export { SchedulingAgendaService } from './agenda/scheduling-agenda.service';

/* P8 · avisos de agenda */
export { SchedulingDelayService } from './delay/scheduling-delay.service';
export { SchedulingAgendaNoticesService } from './notices/scheduling-agenda-notices.service';
export * from './agenda/scheduling-tenant-agenda.service';
export * from './affiliation/practitioner-affiliation-gate.service';
export * from './professional-time/scheduling-professional-time.service';
export { SchedulingWalkInService } from './walk-in/scheduling-walk-in.service';

/* v4.2.40 · servicios con duración dinámica */
export { SchedulingServiceOfferingsService } from './service-offerings/scheduling-service-offerings.service';
export { SchedulingServiceAgendaService } from './service-offerings/scheduling-service-agenda.service';
export { SchedulingServiceBookingService } from './service-offerings/scheduling-service-booking.service';
