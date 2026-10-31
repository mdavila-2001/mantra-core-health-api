import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SchedulingController,
  SchedulingBookingsController,
  SchedulingInternalController,
  SchedulingConfirmationController,
  SchedulingAgendaController,
  TenantAgendaController,
  SchedulingServiceOfferingsController,
  SchedulingFlexibleController,
} from './presentation/controllers';
import {
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingWaitlistService,
  SchedulingConfirmationService,
  SchedulingAgendaService,
  SchedulingDelayService,
  SchedulingAgendaNoticesService,
  SchedulingTenantAgendaService,
  PractitionerAffiliationGateService,
  SchedulingProfessionalTimeService,
  SchedulingWalkInService,
  SchedulingServiceOfferingsService,
  SchedulingServiceAgendaService,
  SchedulingServiceBookingService,
  SchedulingFlexibleBookingService,
  SchedulingPaymentReceiptsService,
} from './application';
import {
  SchedulingCatalogRepository,
  SchedulingBookingsRepository,
  SchedulingConfirmationRepository,
  SchedulingAbsencesRepository,
  SchedulingAgendaRepository,
  SchedulingNoticeRepository,
  SchedulingOfferingsRepository,
  SchedulingPaymentReceiptsRepository,
} from './infrastructure/repositories';
import { AuditModule } from '../audit/audit.module';
import { DirectoryModule } from '../directory/directory.module';
import { InsuranceModule } from '../insurance/insurance.module';
// El repositorio de citas clínicas es una clase sin estado que recibe el
// `EntityManager` por parámetro, así que proveerlo acá no duplica nada ni crea
// dos fuentes de verdad: evita importar el módulo clínico entero sólo para
// escribir la cita que respalda una reserva confirmada.
import {
  AppointmentsRepository,
  EncountersRepository,
} from '../clinical/repositories';
// Dónde se atiende es un dato de `practice`. Se importa el módulo entero —y no
// se copia el repositorio, como con `AppointmentsRepository`— porque la
// resolución tiene reglas propias (asignación vigente, sede del espacio,
// pertenencia al tenant) que no son de esta agenda. `practice` no importa
// `scheduling`, así que la dependencia no cierra ciclo.
import { PracticeModule } from '../practice/practice.module';
// AC-3.3: el mostrador atómico da de alta al paciente sin cuenta de portal
// dentro de la misma transacción de la reserva, así que necesita los
// repositorios de `profiles` (persona, perfiles) y `common` (documento,
// teléfono). Ninguno de los dos importa `scheduling`, así que no cierra
// ciclo.
import { ProfilesModule } from '../profiles/profiles.module';
import { CommonModule } from '../common/common.module';
// P8: los avisos de agenda se entregan por el canal in-app de mensajería, que
// ya evalúa consentimiento, preferencia por categoría y horas de silencio.
// `messaging` no importa `scheduling`, así que la dependencia no cierra ciclo.
import { MessagingModule } from '../messaging/messaging.module';
import { CARE_SPACE_DIRECTORY_PORT } from './application/ports/care-space-directory.port';
import { PracticeCareSpaceDirectoryAdapter } from './infrastructure/adapters/practice-care-space-directory.adapter';
// TAREA-15 · el aviso de agenda también llega al chat de `SupportAdmin`
// (`community.conversations`, reusado tal cual). `community` no importa
// `scheduling`, así que la dependencia no cierra ciclo.
import { CommunityModule } from '../community/community.module';
// La encuesta de satisfacción se emite al completarse la reserva (F3), detrás de
// `BOOKING_COMPLETED_PORT`. `surveys` no importa `scheduling` (sólo lee sus
// entidades), así que la dependencia es de un solo sentido y no cierra ciclo.
import { SurveysModule } from '../surveys/surveys.module';
// Las entidades de `profiles` que el aviso necesita leer para saber a qué
// cuenta va y cómo se llama el profesional. Se registran acá —y no se importa
// el módulo entero— por el mismo criterio que `AppointmentsRepository`.
import * as profileEntities from '../profiles/entities';
import {
  BookingAccess,
  BookingBillingBridge,
  BookingChangeNotifier,
  BookingItemAssembler,
  BookingMaterializer,
  BookingTransitionRecorder,
  ClinicalAppointmentSync,
  DisplacedRequestsCanceller,
  PaymentReceiptAccess,
  ServiceSlotLifecycle,
  SlotPolicyResolver,
} from './application/bookings/support';
import { bookingUseCases } from './application/bookings/use-cases';
import {
  AgendaOverlapGuard,
  CatalogAccess,
  BlockedBookingsCanceller,
  SlotMoveNotifier,
} from './application/catalog/support';
import { catalogUseCases } from './application/catalog/use-cases';
import { BOOKING_HISTORY_PORT } from './application/ports/booking-history.port';
import { CLINICAL_APPOINTMENTS_PORT } from './application/ports/clinical-appointments.port';
import { FORM_ORIGIN_PORT } from './application/ports/form-origin.port';
import { INSURANCE_READ_PORT } from './application/ports/insurance-read.port';
import { PRACTITIONER_AFFILIATIONS_PORT } from './application/ports/practitioner-affiliations.port';
import { PRACTITIONER_DIRECTORY_PORT } from './application/ports/practitioner-directory.port';
import { TENANT_DIRECTORY_PORT } from './application/ports/tenant-directory.port';
import { DirectoryTenantDirectoryAdapter } from './infrastructure/adapters/directory-tenant-directory.adapter';
import { PracticeProfilesDirectoryAdapter } from './infrastructure/adapters/practice-profiles-directory.adapter';
import { ProfilesAffiliationsAdapter } from './infrastructure/adapters/profiles-affiliations.adapter';
import { CLINICAL_ENCOUNTERS_PORT } from './application/ports/clinical-encounters.port';
import { WALK_IN_PATIENT_REGISTRY_PORT } from './application/ports/walk-in-patient-registry.port';
import { ClinicalEncountersAdapter } from './infrastructure/adapters/clinical-encounters.adapter';
import { ProfilesWalkInPatientAdapter } from './infrastructure/adapters/profiles-walk-in-patient.adapter';
import { PATIENT_REPRESENTATION_PORT } from './application/ports/patient-representation.port';
import { AuditBookingHistoryAdapter } from './infrastructure/adapters/audit-booking-history.adapter';
import { ClinicalAppointmentsAdapter } from './infrastructure/adapters/clinical-appointments.adapter';
import { FormsOriginAdapter } from './infrastructure/adapters/forms-origin.adapter';
import { InsuranceReadAdapter } from './infrastructure/adapters/insurance-read.adapter';
import { ProfilesPatientRepresentationAdapter } from './infrastructure/adapters/profiles-patient-representation.adapter';
import { schedulingPersistenceProviders } from './infrastructure/persistence/scheduling.persistence';
import { AGENDA_NOTICE_PORT } from './application/ports/agenda-notice.port';
import { BOOKING_CHAT_PORT } from './application/ports/booking-chat.port';
import { BOOKING_COMPLETED_PORT } from './application/ports/booking-completed.port';
import { CommunityBookingChatAdapter } from './infrastructure/adapters/community-booking-chat.adapter';
import { SurveysBookingCompletedAdapter } from './infrastructure/adapters/surveys-booking-completed.adapter';
import { MessagingAgendaNoticeAdapter } from './infrastructure/adapters/messaging-agenda-notice.adapter';
import { PAYMENT_RECEIPT_FILES_PORT } from './application/ports/payment-receipt-files.port';
import { CommonPaymentReceiptFilesAdapter } from './infrastructure/adapters/common-payment-receipt-files.adapter';
import { SupportAdminNoticeAdapter } from './infrastructure/adapters/support-admin-notice.adapter';
// P43 — la reconsulta puede declarar de qué formulario médico cerrado sale.
// Clase sin estado de `forms` (`EntityManager` por parámetro): se provee suelta,
// sin importar `FormsModule` entero, mismo criterio que `AppointmentsRepository`.
import { FormInstanceOriginValidator } from '../forms/services/form-instance-origin.validator';
// FAC-01 — el pago de la agenda se asienta en facturación. Repositorios sin
// estado de `billing` (`EntityManager` por parámetro), provistos sueltos: el
// módulo de facturación no los exporta y no depende de la agenda.
import { InvoicesRepository } from '../billing/repositories/invoices.repository';
import { PaymentsReceivedRepository } from '../billing/repositories/payments-received.repository';
import { BOOKING_BILLING_PORT } from './application/ports/booking-billing.port';
import { BillingBookingAdapter } from './infrastructure/adapters/billing-booking.adapter';

/**
 * Módulo de agenda: recursos, políticas, plantillas, slots, reservas con
 * anti-double-booking, lista de espera y recordatorios (UC-41-01 … 14).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ...Object.values(entities),
      ...Object.values(profileEntities),
    ]),
    AuditModule,
    // TP-5: quién pertenece a cada organización lo decide `directory`, y de
    // ahí sale el permiso para leer su agenda. No hay ciclo: `directory` no
    // depende de `scheduling`.
    DirectoryModule,
    PracticeModule,
    MessagingModule,
    CommunityModule,
    // ALV-021: la lista de consultas dice «Particular» o el nombre de la
    // aseguradora. `CoverageRepository` es de sólo lectura y ya lo consumen
    // `iam` y `profiles` desde afuera con el mismo patrón.
    InsuranceModule,
    ProfilesModule,
    CommonModule,
    SurveysModule,
  ],
  controllers: [
    SchedulingController,
    SchedulingBookingsController,
    SchedulingInternalController,
    SchedulingConfirmationController,
    SchedulingAgendaController,
    TenantAgendaController,
    SchedulingServiceOfferingsController,
    SchedulingFlexibleController,
  ],
  providers: [
    FormInstanceOriginValidator,
    // La regla de pertenencia del médico a una organización, que consultan
    // el catálogo (al publicar) y las reservas (al aceptar).
    PractitionerAffiliationGateService,
    // La regla madre (AG-1): el tiempo del profesional, cruzando sus sedes.
    SchedulingProfessionalTimeService,
    // Piloto de la migración a puertos (§47, Fase 5): sesión del módulo,
    // adaptador PostgreSQL y los dos puertos de la lista de espera. Ver
    // scheduling.persistence.ts y docs/data/read-write-routing.md.
    ...schedulingPersistenceProviders,
    SchedulingCatalogRepository,
    SchedulingBookingsRepository,
    SchedulingConfirmationRepository,
    SchedulingAbsencesRepository,
    SchedulingAgendaRepository,
    SchedulingNoticeRepository,
    SchedulingOfferingsRepository,
    SchedulingPaymentReceiptsRepository,
    AppointmentsRepository,
    // AC-3.3: mismo patrón que `AppointmentsRepository` — clase sin estado,
    // provista acá para no importar `ClinicalModule` entero sólo para abrir
    // el encuentro dentro de la transacción del mostrador.
    EncountersRepository,
    SchedulingCatalogService,
    SchedulingBookingsService,
    SchedulingWaitlistService,
    SchedulingConfirmationService,
    SchedulingAgendaService,
    SchedulingTenantAgendaService,
    SchedulingWalkInService,
    // v4.2.40 · servicios con duración dinámica: la oferta del profesional, el
    // tiempo libre calculado y la retención del turno.
    SchedulingServiceOfferingsService,
    SchedulingServiceAgendaService,
    SchedulingServiceBookingService,
    // P36 · horario flexible: las horas libres y la retención de la elegida.
    SchedulingFlexibleBookingService,
    // P8 · avisos de agenda. El puerto se resuelve hoy con el adaptador de
    // mensajería; cuando P1 publique su servicio de emisión, se sustituye
    // **sólo** esta línea y ningún caso de uso cambia.
    SchedulingDelayService,
    SchedulingAgendaNoticesService,
    SupportAdminNoticeAdapter,
    MessagingAgendaNoticeAdapter,
    { provide: AGENDA_NOTICE_PORT, useExisting: MessagingAgendaNoticeAdapter },
    CommunityBookingChatAdapter,
    { provide: BOOKING_CHAT_PORT, useExisting: CommunityBookingChatAdapter },
    // F3 · al completarse la atención se emite la encuesta (base + la del
    // profesional) al paciente. El puerto no lanza.
    SurveysBookingCompletedAdapter,
    {
      provide: BOOKING_COMPLETED_PORT,
      useExisting: SurveysBookingCompletedAdapter,
    },
    // Puertos hacia otros contextos (audit, profiles, clinical, insurance,
    // forms): los casos de uso dependen del token; el adaptador es el único que
    // conoce al otro módulo.
    AuditBookingHistoryAdapter,
    ProfilesPatientRepresentationAdapter,
    ClinicalAppointmentsAdapter,
    InsuranceReadAdapter,
    FormsOriginAdapter,
    { provide: BOOKING_HISTORY_PORT, useExisting: AuditBookingHistoryAdapter },
    {
      provide: PATIENT_REPRESENTATION_PORT,
      useExisting: ProfilesPatientRepresentationAdapter,
    },
    {
      provide: CLINICAL_APPOINTMENTS_PORT,
      useExisting: ClinicalAppointmentsAdapter,
    },
    { provide: INSURANCE_READ_PORT, useExisting: InsuranceReadAdapter },
    { provide: FORM_ORIGIN_PORT, useExisting: FormsOriginAdapter },
    ClinicalEncountersAdapter,
    ProfilesWalkInPatientAdapter,
    {
      provide: CLINICAL_ENCOUNTERS_PORT,
      useExisting: ClinicalEncountersAdapter,
    },
    {
      provide: WALK_IN_PATIENT_REGISTRY_PORT,
      useExisting: ProfilesWalkInPatientAdapter,
    },
    ProfilesAffiliationsAdapter,
    PracticeProfilesDirectoryAdapter,
    DirectoryTenantDirectoryAdapter,
    {
      provide: PRACTITIONER_AFFILIATIONS_PORT,
      useExisting: ProfilesAffiliationsAdapter,
    },
    {
      provide: PRACTITIONER_DIRECTORY_PORT,
      useExisting: PracticeProfilesDirectoryAdapter,
    },
    {
      provide: TENANT_DIRECTORY_PORT,
      useExisting: DirectoryTenantDirectoryAdapter,
    },
    // Reservas: colaboradores compartidos y un caso de uso por operación.
    BookingAccess,
    BookingTransitionRecorder,
    BookingChangeNotifier,
    ServiceSlotLifecycle,
    ClinicalAppointmentSync,
    SlotPolicyResolver,
    BookingMaterializer,
    DisplacedRequestsCanceller,
    BookingItemAssembler,
    ...bookingUseCases,
    // v4.2.64 · comprobantes de pago: el paciente los sube y el prestador los
    // revisa. Los archivos son de `common`, detrás de su puerto.
    PaymentReceiptAccess,
    SchedulingPaymentReceiptsService,
    CommonPaymentReceiptFilesAdapter,
    {
      provide: PAYMENT_RECEIPT_FILES_PORT,
      useExisting: CommonPaymentReceiptFilesAdapter,
    },
    // FAC-01 · el pago de la cita crea su cuenta por cobrar y se le asigna.
    InvoicesRepository,
    PaymentsReceivedRepository,
    BillingBookingAdapter,
    { provide: BOOKING_BILLING_PORT, useExisting: BillingBookingAdapter },
    BookingBillingBridge,
    // Catálogo de agenda: colaboradores compartidos y un caso de uso por operación.
    CatalogAccess,
    // R0 (CONTRATO-F2-F5 §F4.1): espacios de `practice` vistos desde la agenda.
    PracticeCareSpaceDirectoryAdapter,
    {
      provide: CARE_SPACE_DIRECTORY_PORT,
      useExisting: PracticeCareSpaceDirectoryAdapter,
    },
    AgendaOverlapGuard,
    BlockedBookingsCanceller,
    SlotMoveNotifier,
    ...catalogUseCases,
  ],
})
export class SchedulingModule {}
