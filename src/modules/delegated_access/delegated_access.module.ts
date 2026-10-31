import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
// Campañas de certificación, informes, anomalías y barridos (B4b).
import {
  AccessReviewCampaignsController,
  MyAccessReviewsController,
  GovernanceReportsController,
  PractitionerGovernanceController,
  GovernanceSweepController,
} from './controllers';
import { GovernanceQueriesRepository } from './repositories';
import {
  AccessReviewAutomationService,
  AccessReviewCampaignsService,
  AccessReviewClosureService,
  AccessReviewItemFactory,
  AccessReviewItemsService,
  GovernanceAccessService,
  GovernanceAnomaliesService,
  GovernanceAudit,
  GovernanceCampaignSettings,
  GovernanceEvents,
  GovernanceExportService,
  GovernanceMatrixService,
  GovernancePanelService,
  GovernanceReportsService,
  GovernanceSweepService,
  GovernanceWorldLoader,
  RecertificationReviewLink,
  ReviewerResolverService,
} from './services';

import {
  OrgUserAssignmentsController,
  DelegatedPermissionSetsController,
  PractitionerDelegatesController,
  AccessRequestsController,
  DelegatedAccessAuthzController,
  SupportEngagementRequestsController,
  SupportEngagementsController,
  AffiliationInvitationsController,
  PractitionerSupportController,
  SupportMaintenanceController,
  SupportPatientsController,
} from './controllers';
import {
  OrgUserAssignmentsService,
  PermissionSetsService,
  PractitionerDelegatesService,
  AccessRequestsService,
  DelegatedAccessEvaluationService,
  DelegationScopeService,
  SupportAccessPolicy,
  SupportTargetsService,
  EffectiveSupportAccessService,
  EngagementRequestsService,
  SupportEngagementsService,
  RoleTemplatesService,
  AffiliationInvitationsService,
  PractitionerSupportService,
  SupportActivityService,
  SupportPatientSearchService,
  SupportMaintenanceService,
  SupportCatalogService,
  SupportPatientRegistrationService,
} from './services';
import { SupportPatientProbeCounter } from './services/support-patient-probe-counter';
// Gobierno de accesos (v4.2.72): política con reglas, condiciones, contadores,
// aprobaciones y bitácora de decisiones, y los adaptadores del PIP.
import { SupportDecisionPipeline } from './services/support-decision-pipeline';
import { SupportAccessContextLoader } from './services/support-access-context.loader';
import { SupportGovernanceRules } from './services/support-governance-rules.reader';
import { SupportUsageCounter } from './services/support-usage-counter';
import { SupportApprovalGate } from './services/support-approval-gate';
import { AccessDecisionRecorder } from './services/access-decision-recorder.service';
import { AccessUsageRecorder } from './services/access-usage-recorder';
import {
  SUPPORT_DEVICE_PORT,
  SUPPORT_NETWORK_POLICY_PORT,
  SUPPORT_PATIENT_FACTS_PORT,
  SUPPORT_PRESENCE_PORT,
  SUPPORT_SESSION_INFO_PORT,
  SUPPORT_STEP_UP_PORT,
  SUPPORT_TENANT_ZONE_PORT,
} from './services/support-access-context.ports';
import { PatientFactsAdapter } from './infrastructure/adapters/patient-facts.adapter';
import { SessionInfoAdapter } from './infrastructure/adapters/session-info.adapter';
import { NetworkPolicyAdapter } from './infrastructure/adapters/network-policy.adapter';
import { DeviceAdapter } from './infrastructure/adapters/device.adapter';
import { RedisPresenceAdapter } from './infrastructure/adapters/presence.adapter';
import { IamStepUpAdapter } from './infrastructure/adapters/step-up.adapter';
import { TenantZoneAdapter } from './infrastructure/adapters/tenant-zone.adapter';
// El sello del paso extra vive en Redis y lo escribe `iam`; aquí solo se LEE. Se
// provee el almacén (sin estado) en vez de importar `IamModule`: `iam` importa
// `profiles → directory → community → delegated_access` (un ciclo de módulos).
import { StepUpStore } from '../iam/infrastructure/adapters/redis-step-up.store';
// Ciclo de vida, traspaso y administración delegada (B4c, §6.1 y §6.4).
import { SupportLifecycleController } from './controllers/support-lifecycle.controller';
import { TeamAdminController } from './controllers/team-admin.controller';
import { HandoverWorkRepository } from './repositories/handover-work.repository';
import { LifecycleSettingsReader } from './services/support-lifecycle-settings';
import { SupportAdminDirectory } from './services/support-admin-directory';
import { JoinerFactsReader } from './services/lifecycle-joiner-facts';
import { LifecycleService } from './services/lifecycle.service';
import { LifecycleFourEyes } from './services/lifecycle-four-eyes';
import { GrantChangeExecutor } from './services/grant-change.executor';
import { LifecycleApprovalExecutors } from './services/lifecycle-approval-executors';
import { LifecycleReviewOpener } from './services/lifecycle-review-opener';
import { GrantProposalValidator } from './services/grant-proposal.validator';
import { EngagementMoveService } from './services/engagement-move.service';
import { EngagementSuspensionService } from './services/engagement-suspension.service';
import { EngagementHandoverService } from './services/engagement-handover.service';
import { TeamAdminPolicy } from './services/team-admin.policy';
import { TeamAdminService } from './services/team-admin.service';
import { TeamAdminRequestsService } from './services/team-admin-requests.service';
import { TeamAdminCasesService } from './services/team-admin-cases.service';
import { SupportOnboardingGate } from './services/support-onboarding-gate';
import { GovernanceStepUpGate } from './services/governance-step-up.gate';
import {
  FourEyesExecutors,
  FourEyesService,
} from './services/four-eyes.service';
import { ApproverDirectoryBuilder } from './services/four-eyes-directory';
import { GovernanceSettingsService } from './services/governance-settings.service';
// Reglas, SoD, cuatro ojos, explicar y simular, normalización y banderas (B4a).
import { AccessCatalogController } from './controllers/access-catalog.controller';
import { AccessExplainController } from './controllers/access-explain.controller';
import { FourEyesController } from './controllers/four-eyes.controller';
import { GovernanceRulesController } from './controllers/governance-rules.controller';
import { GovernanceSodController } from './controllers/governance-sod.controller';
import { PatientRestrictionFlagsController } from './controllers/patient-restriction-flags.controller';
import { AccessExplainService } from './services/access-explain.service';
import { AccessSummaryService } from './services/access-summary.service';
import { GovernanceAccessGate } from './services/governance-access.gate';
import { GovernanceRulesService } from './services/governance-rules.service';
import { LegacyNormalizationService } from './services/legacy-normalization.service';
import { PatientRestrictionFlagsService } from './services/patient-restriction-flags.service';
import { SodService } from './services/sod.service';
import { SupportGrantWriteGuard } from './services/support-grant-write.guard';
import { SupportPersonGrantsLoader } from './services/support-person-grants.loader';
import {
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetsRepository,
  DelegatedPermissionSetItemsRepository,
  PractitionerDelegateAssignmentsRepository,
  DelegatedAccessApprovalRequestsRepository,
  DelegatedAccessGrantsRepository,
  DelegationEventsRepository,
  DelegationScopeRepository,
  SupportAccessRepository,
  RoleTemplatesRepository,
  SupportGrantsRepository,
  EngagementRequestsRepository,
  EffectiveSupportAccessRepository,
  SupportEngagementsRepository,
  AffiliationInvitationsRepository,
  PractitionerAffiliationRepository,
  SupportDirectoryRepository,
  SupportCatalogRepository,
  SupportActivityRepository,
  SupportPatientsRepository,
  GovernanceRulesRepository,
  SodRepository,
  FourEyesRepository,
  AccessReviewRepository,
  LifecycleRepository,
  PatientRestrictionFlagsRepository,
  AccessDecisionLogRepository,
  GrantUsageStatsRepository,
  AccessAnomaliesRepository,
} from './repositories';
import { AuditModule } from '../audit/audit.module';
// El alta de pacientes del personal de apoyo escribe con los repositorios de
// `profiles`/`common`/`authz` (clases sin estado: reciben el `EntityManager`) y
// publica la invitación al portal por el outbox. No se importa `ProfilesModule`:
// `profiles` → `directory` → `community` → este módulo cerraría un ciclo.
import { MessagingModule } from '../messaging/messaging.module';
import {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../profiles/infrastructure/repositories';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../common/repositories';
// El contador atómico de consultas de pacientes comparte la conexión Redis del
// runtime (la misma del rate limit).
import { RedisRuntimeModule } from '../redis_runtime/redis_runtime.module';

/**
 * Módulo 29 — Delegated Access and Scoped Infrastructure Users. Delegación scoped
 * de acceso: usuarios de organización, sets de permisos versionados, delegaciones
 * de practitioner, solicitudes con aprobación previa, grants temporales por
 * propósito, revocación en cascada, barrido de expiración y evaluación del actor
 * efectivo. Auth vía guard global; `TokenService` llega por `AuthModule` (global).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // El sello de cada búsqueda de pacientes del personal de apoyo.
    AuditModule,
    // La invitación al portal del paciente que registra el personal de apoyo.
    MessagingModule,
    // El contador atómico del tope de consultas de pacientes.
    RedisRuntimeModule,
  ],
  controllers: [
    OrgUserAssignmentsController,
    DelegatedPermissionSetsController,
    PractitionerDelegatesController,
    AccessRequestsController,
    DelegatedAccessAuthzController,
    SupportEngagementRequestsController,
    SupportEngagementsController,
    AffiliationInvitationsController,
    PractitionerSupportController,
    SupportMaintenanceController,
    SupportPatientsController,
    AccessReviewCampaignsController,
    MyAccessReviewsController,
    GovernanceReportsController,
    PractitionerGovernanceController,
    GovernanceSweepController,
    SupportLifecycleController,
    TeamAdminController,
    GovernanceRulesController,
    GovernanceSodController,
    FourEyesController,
    AccessExplainController,
    AccessCatalogController,
    PatientRestrictionFlagsController,
  ],
  providers: [
    // Repositorios
    OrganizationUserAssignmentsRepository,
    DelegatedPermissionSetsRepository,
    DelegatedPermissionSetItemsRepository,
    PractitionerDelegateAssignmentsRepository,
    DelegatedAccessApprovalRequestsRepository,
    DelegatedAccessGrantsRepository,
    DelegationEventsRepository,
    DelegationScopeRepository,
    SupportAccessRepository,
    RoleTemplatesRepository,
    SupportGrantsRepository,
    EngagementRequestsRepository,
    EffectiveSupportAccessRepository,
    SupportEngagementsRepository,
    AffiliationInvitationsRepository,
    PractitionerAffiliationRepository,
    SupportDirectoryRepository,
    SupportCatalogRepository,
    SupportActivityRepository,
    SupportPatientsRepository,
    // Gobierno de accesos (v4.2.72): persistencia de reglas, SoD, cuatro ojos,
    // campañas, ciclo de vida, banderas de pacientes, bitácora y estadística.
    GovernanceRulesRepository,
    SodRepository,
    FourEyesRepository,
    AccessReviewRepository,
    LifecycleRepository,
    PatientRestrictionFlagsRepository,
    AccessDecisionLogRepository,
    GrantUsageStatsRepository,
    AccessAnomaliesRepository,
    GovernanceQueriesRepository,
    // Campañas de certificación, informes, anomalías y barridos (B4b).
    GovernanceWorldLoader,
    ReviewerResolverService,
    GovernanceEvents,
    GovernanceAudit,
    GovernanceAccessService,
    GovernanceCampaignSettings,
    AccessReviewItemFactory,
    AccessReviewClosureService,
    AccessReviewCampaignsService,
    AccessReviewItemsService,
    AccessReviewAutomationService,
    RecertificationReviewLink,
    GovernanceMatrixService,
    GovernanceReportsService,
    GovernanceAnomaliesService,
    GovernanceExportService,
    GovernancePanelService,
    GovernanceSweepService,
    // Repositorios ajenos que usa el alta de pacientes (sin estado).
    PersonsRepository,
    PersonProfilesRepository,
    PatientProfilesRepository,
    RelatedPersonsRepository,
    IdentifiersRepository,
    ContactPointsRepository,
    // Servicios
    DelegationScopeService,
    OrgUserAssignmentsService,
    PermissionSetsService,
    PractitionerDelegatesService,
    AccessRequestsService,
    DelegatedAccessEvaluationService,
    SupportAccessPolicy,
    SupportTargetsService,
    EffectiveSupportAccessService,
    EngagementRequestsService,
    SupportEngagementsService,
    RoleTemplatesService,
    AffiliationInvitationsService,
    PractitionerSupportService,
    SupportActivityService,
    SupportPatientSearchService,
    SupportMaintenanceService,
    SupportCatalogService,
    SupportPatientRegistrationService,
    SupportPatientProbeCounter,
    // Política de apoyo con gobierno: pipeline, PIP perezoso, contadores,
    // aprobaciones, registro de decisiones y estadística de uso.
    SupportDecisionPipeline,
    SupportAccessContextLoader,
    SupportGovernanceRules,
    SupportUsageCounter,
    SupportApprovalGate,
    AccessDecisionRecorder,
    AccessUsageRecorder,
    // Ciclo de vida, traspaso y administración delegada (B4c).
    HandoverWorkRepository,
    LifecycleSettingsReader,
    SupportAdminDirectory,
    JoinerFactsReader,
    LifecycleService,
    LifecycleFourEyes,
    LifecycleApprovalExecutors,
    GrantChangeExecutor,
    LifecycleReviewOpener,
    GrantProposalValidator,
    EngagementMoveService,
    EngagementSuspensionService,
    EngagementHandoverService,
    TeamAdminPolicy,
    TeamAdminService,
    TeamAdminRequestsService,
    TeamAdminCasesService,
    SupportOnboardingGate,
    GovernanceStepUpGate,
    // Cuatro ojos: el ciclo de vida pide con `FourEyesService` y registra sus ejecutores.
    FourEyesService,
    FourEyesExecutors,
    ApproverDirectoryBuilder,
    GovernanceSettingsService,
    // Reglas de la organización, SoD, explicar y simular, normalización de permisos
    // heredados, banderas de pacientes y el guardián de escritura de permisos (B4a).
    GovernanceAccessGate,
    GovernanceRulesService,
    SupportPersonGrantsLoader,
    SodService,
    SupportGrantWriteGuard,
    AccessExplainService,
    AccessSummaryService,
    LegacyNormalizationService,
    PatientRestrictionFlagsService,
    // Adaptadores de los puertos del PIP (el módulo no importa a los demás).
    StepUpStore,
    PatientFactsAdapter,
    SessionInfoAdapter,
    NetworkPolicyAdapter,
    DeviceAdapter,
    RedisPresenceAdapter,
    IamStepUpAdapter,
    TenantZoneAdapter,
    { provide: SUPPORT_PATIENT_FACTS_PORT, useExisting: PatientFactsAdapter },
    { provide: SUPPORT_SESSION_INFO_PORT, useExisting: SessionInfoAdapter },
    { provide: SUPPORT_NETWORK_POLICY_PORT, useExisting: NetworkPolicyAdapter },
    { provide: SUPPORT_DEVICE_PORT, useExisting: DeviceAdapter },
    { provide: SUPPORT_PRESENCE_PORT, useExisting: RedisPresenceAdapter },
    { provide: SUPPORT_STEP_UP_PORT, useExisting: IamStepUpAdapter },
    { provide: SUPPORT_TENANT_ZONE_PORT, useExisting: TenantZoneAdapter },
  ],
  // La política de acceso del personal de apoyo es el servicio que consumen
  // agenda y mensajería para decidir qué puede hacer cada persona de apoyo.
  // `SupportDecisionPipeline` (decidir/explicar sin efectos) y las reglas con su
  // caché (quien escribe una regla la invalida) los usan los servicios de gobierno.
  exports: [
    SupportAccessPolicy,
    EffectiveSupportAccessService,
    SupportDecisionPipeline,
    SupportGovernanceRules,
    SupportApprovalGate,
    SupportUsageCounter,
    // Explicar, cuatro ojos y SoD los usan otros módulos y servicios de gobierno.
    AccessExplainService,
    FourEyesService,
    SodService,
    // El cuatro ojos ejecuta el cambio de rol y la reactivación; el barrido
    // suspende por inactividad y consulta las cuentas sin dueño.
    LifecycleApprovalExecutors,
    LifecycleFourEyes,
    LifecycleService,
    EngagementSuspensionService,
    SupportAdminDirectory,
    SupportOnboardingGate,
  ],
})
export class DelegatedAccessModule {}
