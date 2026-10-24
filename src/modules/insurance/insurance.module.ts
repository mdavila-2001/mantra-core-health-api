import { MyClaimsController } from './presentation/controllers/my-claims.controller';
import { MyClaimsService } from './application/services/my-claims.service';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import { PracticeModule } from '../practice/practice.module';
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
// Antiduplicación de estudios (subtarea 3.2, T-26): `DuplicateStudyDetector`
// necesita `ConceptDesignationsRepository` para nombrar el estudio en
// castellano; se importa el módulo entero en vez de proveer el repo suelto
// porque ya lo hace `TerminologyModule` y es su dueño.
import { TerminologyModule } from '../terminology/terminology.module';
// Hito 4 §A: un dictamen favorable publica `InsuranceClaimDecided` por el outbox
// transaccional. `MessagingModule` sólo importa MikroORM, así que no cierra
// ningún ciclo con `insurance`.
import { MessagingModule } from '../messaging/messaging.module';
// Carril 16 — la factura al paciente se persiste con el repositorio de `billing`,
// alcanzado sólo desde su adaptador de infraestructura. `BillingModule` importa
// `PracticeModule` y `SurveysModule`, ninguno de los cuales importa `insurance`.
import { BillingModule } from '../billing/billing.module';
import * as entities from './entities';
import { LinkedClaimOrderService } from './application/services/linked-claim-order.service';
import { LinkedClaimAccessService } from './application/services/linked-claim-access.service';
// Mismo criterio que `DeclaredCoveragesReader` (más abajo): clase sin estado
// por `EntityManager`, provista directo sin importar `ClinicalModule` entero
// — evita el ciclo de que `ClinicalModule` ya la provee él mismo.
import { DuplicateStudyDetector } from '../clinical/services/duplicate-study-detector';
import {
  InsuranceBackboneController,
  CoverageController,
  PriorAuthController,
  ClaimsController,
  ClaimsReadController,
  AppealsController,
  ReconciliationController,
  BrokerCommissionController,
  InsuranceReadController,
  InsuranceCatalogController,
  InsuranceAnalyticsController,
  InsurancePortabilityController,
  InsurancePortabilityPublicController,
  PractitionerSettlementBatchesController,
  InsuranceCampaignsController,
  InsurerReceivedClaimsController,
  InsurerPatientsController,
} from './presentation/controllers';
import {
  InsuranceBackboneService,
  CoverageService,
  PriorAuthService,
  PriorAuthReadService,
  ClaimsService,
  ClaimCoveragePolicy,
  ClaimQuoteService,
  ClaimPatientInvoiceService,
  PatientConsentValidator,
  PatientChargeObjectionService,
  ClaimsReadService,
  AppealsService,
  ReconciliationService,
  BrokerCommissionService,
  InsuranceReadService,
  InsuranceCatalogService,
  InsuranceAnalyticsService,
  DeclaredCoveragesReader,
  InsurancePortabilityService,
  InsurancePortabilityPdfService,
  PractitionerSettlementBatchesService,
  InsuranceCampaignsService,
  InsurerContextService,
  InsurerReceivedClaimsService,
  InsurerPatientsService,
} from './application/services';
import {
  CatalogRepository,
  CoverageRepository,
  PriorAuthRepository,
  ClaimRepository,
  ClaimReadRepository,
  DisputeRepository,
  SettlementRepository,
  InsuranceReadRepository,
  InsuranceAnalyticsRepository,
  InsurancePortabilityRepository,
  InsuranceCampaignsRepository,
  InsurancePatientAccountRepository,
  LinkedOrderDataRepository,
} from './infrastructure/repositories';
// Portabilidad de póliza y siniestralidad (subtarea 3.3): el certificado se
// autoriza contra el titular (`ProfileOwnershipService`, mismo criterio que
// `practice.module.ts` §ALV-005/006 — clases sueltas, no `ProfilesModule`
// entero, porque `profiles` ya importa `insurance` por `DeclaredCoveragesReader`
// y cerraría el ciclo), resuelve nombre/documento del paciente
// (`PatientProfilesRepository`, `PersonsRepository`), guarda el JSON sellado
// como archivo (`CommonModule`) y deja constancia en auditoría (`AuditModule`
// + los dos repos de `audit` y `health_data` que ninguno de los dos módulos
// exporta).
import { ProfileOwnershipService } from '../profiles/application/services/profile-ownership.service';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  PersonsRepository,
} from '../profiles/infrastructure/repositories';
import { CommonModule } from '../common/common.module';
import { AuditModule } from '../audit/audit.module';
import { DataReleaseRepository } from '../health_data/repositories/data-release.repository';
import { HealthProvenanceRepository } from '../health_data/repositories/health-provenance.repository';
import { DsarRequestsRepository } from '../audit/repositories/dsar-requests.repository';
import { DataAccessLogRepository } from '../audit/repositories/data-access-log.repository';
import { PractitionerInsuranceNetworksController } from './presentation/controllers/practitioner-insurance-networks.controller';
import { PractitionerInsuranceNetworksService } from './application/services/practitioner-insurance-networks.service';
import { DirectoryTenantAdministrationAdapter } from './infrastructure/adapters/directory-tenant-administration.adapter';
import { DIRECTORY_TENANT_ADMINISTRATION_PORT } from './application/ports/directory-tenant-administration.port';
import { PracticeTenantLookupAdapter } from './infrastructure/adapters/practice-tenant-lookup.adapter';
import { INSURANCE_PRACTICE_TENANT_LOOKUP_PORT } from './application/ports/practice-tenant-lookup.port';
import { DuplicateStudyDescriptionAdapter } from './infrastructure/adapters/duplicate-study-description.adapter';
import { DUPLICATE_STUDY_DESCRIPTION_PORT } from './application/ports/duplicate-study-description.port';
import { ClaimDecisionPublisherAdapter } from './infrastructure/adapters/claim-decision-publisher.adapter';
import { CLAIM_DECISION_PUBLISHER_PORT } from './application/ports/claim-decision-publisher.port';
import { PatientOwnershipAdapter } from './infrastructure/adapters/patient-ownership.adapter';
import { PATIENT_OWNERSHIP_PORT } from './application/ports/patient-ownership.port';
import { BillingPatientInvoiceAdapter } from './infrastructure/adapters/billing-patient-invoice.adapter';
import { PATIENT_BILLING_PORT } from './application/ports/patient-billing.port';
import { NoPatientChargeAcceptanceAdapter } from './infrastructure/adapters/no-patient-charge-acceptance.adapter';
import { PATIENT_CHARGE_ACCEPTANCE_PORT } from './application/ports/patient-charge-acceptance.port';
import { PatientNoticeAdapter } from './infrastructure/adapters/patient-notice.adapter';
import { PATIENT_NOTICE_PORT } from './application/ports/patient-notice.port';
import { AuditTrailAdapter } from './infrastructure/adapters/audit-trail.adapter';
import { INSURANCE_AUDIT_TRAIL_PORT } from './application/ports/audit-trail.port';
import { InsurancePortabilitySupportAdapter } from './infrastructure/adapters/insurance-portability-support.adapter';
import { INSURANCE_PORTABILITY_SUPPORT_PORT } from './application/ports/insurance-portability-support.port';
import { InsurancePdfAssetsAdapter } from './infrastructure/adapters/insurance-pdf-assets.adapter';
import { INSURANCE_PDF_ASSETS_PORT } from './application/ports/insurance-pdf-assets.port';
import { PatientDirectoryAdapter } from './infrastructure/adapters/patient-directory.adapter';
import {
  PATIENT_DIRECTORY_ACCESS_AUDIT_PORT,
  PATIENT_DIRECTORY_CONVERSATION_PORT,
} from './application/ports/patient-directory.port';

/**
 * Módulo Insurance (26): redes, coberturas, elegibilidad, autorización previa,
 * reclamos/adjudicación (837/835), EOB, COB, reversiones, disputas/apelaciones,
 * conciliación y comisiones de broker. Repos stateless + servicios transaccionales.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // TAREA-16 — la lectura de solicitudes es la cara del prestador que las
    // envió, y el reclamo cuelga de `billing_provider_entity_id`, que es una
    // `practice.practices`. `PracticeModule` expone el puerto que traduce la
    // organización activa a sus prácticas; sin él, `insurance` tendría que
    // importar la entidad persistente de otro dominio.
    PracticeModule,
    DirectoryAuthorizationModule,
    TerminologyModule,
    CommonModule,
    AuditModule,
    MessagingModule,
    CommunityModule,
    BillingModule,
  ],
  controllers: [
    PractitionerInsuranceNetworksController,
    MyClaimsController,
    InsuranceBackboneController,
    CoverageController,
    PriorAuthController,
    ClaimsController,
    ClaimsReadController,
    AppealsController,
    ReconciliationController,
    BrokerCommissionController,
    InsuranceReadController,
    InsuranceCatalogController,
    InsuranceAnalyticsController,
    InsurancePortabilityController,
    InsurancePortabilityPublicController,
    PractitionerSettlementBatchesController,
    InsuranceCampaignsController,
    InsurerReceivedClaimsController,
    InsurerPatientsController,
  ],
  providers: [
    PracticeTenantLookupAdapter,
    {
      provide: INSURANCE_PRACTICE_TENANT_LOOKUP_PORT,
      useExisting: PracticeTenantLookupAdapter,
    },
    DuplicateStudyDescriptionAdapter,
    {
      provide: DUPLICATE_STUDY_DESCRIPTION_PORT,
      useExisting: DuplicateStudyDescriptionAdapter,
    },
    ClaimDecisionPublisherAdapter,
    {
      provide: CLAIM_DECISION_PUBLISHER_PORT,
      useExisting: ClaimDecisionPublisherAdapter,
    },
    PatientOwnershipAdapter,
    { provide: PATIENT_OWNERSHIP_PORT, useExisting: PatientOwnershipAdapter },
    BillingPatientInvoiceAdapter,
    {
      provide: PATIENT_BILLING_PORT,
      useExisting: BillingPatientInvoiceAdapter,
    },
    // REQ-16-030: sin tabla de aceptaciones en el modelo, el cobro particular
    // falla cerrado hasta que llegue el PR del modelo (ver el puerto).
    NoPatientChargeAcceptanceAdapter,
    {
      provide: PATIENT_CHARGE_ACCEPTANCE_PORT,
      useExisting: NoPatientChargeAcceptanceAdapter,
    },
    PatientNoticeAdapter,
    { provide: PATIENT_NOTICE_PORT, useExisting: PatientNoticeAdapter },
    AuditTrailAdapter,
    { provide: INSURANCE_AUDIT_TRAIL_PORT, useExisting: AuditTrailAdapter },
    InsurancePortabilitySupportAdapter,
    {
      provide: INSURANCE_PORTABILITY_SUPPORT_PORT,
      useExisting: InsurancePortabilitySupportAdapter,
    },
    InsurancePdfAssetsAdapter,
    {
      provide: INSURANCE_PDF_ASSETS_PORT,
      useExisting: InsurancePdfAssetsAdapter,
    },
    PatientDirectoryAdapter,
    {
      provide: PATIENT_DIRECTORY_CONVERSATION_PORT,
      useExisting: PatientDirectoryAdapter,
    },
    {
      provide: PATIENT_DIRECTORY_ACCESS_AUDIT_PORT,
      useExisting: PatientDirectoryAdapter,
    },
    DirectoryTenantAdministrationAdapter,
    {
      provide: DIRECTORY_TENANT_ADMINISTRATION_PORT,
      useExisting: DirectoryTenantAdministrationAdapter,
    },
    PractitionerInsuranceNetworksService,
    MyClaimsService,
    // Repositorios
    CatalogRepository,
    InsuranceReadRepository,
    CoverageRepository,
    PriorAuthRepository,
    ClaimRepository,
    ClaimReadRepository,
    DisputeRepository,
    SettlementRepository,
    InsuranceAnalyticsRepository,
    InsurancePortabilityRepository,
    InsuranceCampaignsRepository,
    InsurancePatientAccountRepository,
    LinkedOrderDataRepository,
    LinkedClaimOrderService,
    LinkedClaimAccessService,
    DuplicateStudyDetector,
    // Sueltos de otros dominios, sin importar sus módulos enteros (ver el
    // comentario junto a los imports de más arriba).
    ProfileOwnershipService,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    PersonsRepository,
    DataReleaseRepository,
    HealthProvenanceRepository,
    DsarRequestsRepository,
    DataAccessLogRepository,
    // Servicios
    InsuranceBackboneService,
    CoverageService,
    PriorAuthService,
    PriorAuthReadService,
    ClaimsService,
    ClaimCoveragePolicy,
    ClaimQuoteService,
    ClaimPatientInvoiceService,
    PatientConsentValidator,
    PatientChargeObjectionService,
    ClaimsReadService,
    AppealsService,
    ReconciliationService,
    BrokerCommissionService,
    InsuranceReadService,
    InsuranceCatalogService,
    InsuranceAnalyticsService,
    DeclaredCoveragesReader,
    InsurancePortabilityService,
    InsurancePortabilityPdfService,
    PractitionerSettlementBatchesService,
    InsuranceCampaignsService,
    InsurerContextService,
    InsurerReceivedClaimsService,
    InsurerPatientsService,
  ],
  // Lo consume `directory` para materializar la aseguradora o el corredor en la
  // misma transacción en la que se da de alta el tenant de ese tipo.
  // `CoverageRepository` lo necesita iam: el alta de paciente anota en la misma
  // transacción el seguro que la persona declara tener.
  // `ClaimReadRepository` lo lee `scheduling`: la agenda muestra la solicitud
  // de seguro de cada cita, en lote, sin reimplementar la consulta.
  // `DeclaredCoveragesReader` lo leen `profiles` (GET /profiles/patients/me)
  // y `clinical` (el PDF oficial de receta, subtarea B.3): es la misma
  // consulta de coberturas declaradas y no puede tener dos dueños.
  exports: [
    InsuranceBackboneService,
    CatalogRepository,
    CoverageRepository,
    ClaimReadRepository,
    DeclaredCoveragesReader,
  ],
})
export class InsuranceModule {}
