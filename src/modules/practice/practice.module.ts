import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  PracticesController,
  SitesController,
  AccreditationsController,
  PractitionerSitesController,
  RoleAssignmentsController,
  InventoryItemsController,
  OrganizationPracticesController,
  PracticeInvitationsController,
  PractitionerInvitationsController,
  CareSpacesController,
  ClinicalUnitsController,
  SiteInfrastructureController,
  SiteLicensesController,
  InfrastructureCatalogController,
  CareSpaceOpsController,
  PracticeInternalController,
} from './controllers';
import {
  PracticeSitesService,
  PracticeAccreditationsService,
  ClinicalStructureService,
  PracticeSettingsService,
  PracticeWorkforceService,
  PracticeInventoryService,
  PracticeTenantLookupService,
  PractitionerSitesService,
  OwnSiteProvisioningService,
  PracticeOrganizationReadService,
  PracticeAccessService,
  OrganizationPracticeProvisioningService,
  PracticeAdministrationService,
  HealthcareServiceOffersService,
  PracticeAffiliationInvitationsService,
  InfrastructureCatalogService,
  StructureAccessService,
  StructureContextService,
  StructureEventsService,
  CareSpaceReadService,
  CareSpaceCreationService,
  CareSpaceUpdateService,
  CareSpaceLifecycleService,
  SpaceUnitAssignmentsService,
  ClinicalUnitsService,
  SiteRegulatoryService,
  SiteLicensesService,
  SiteCapacityService,
  RetireBlockerRegistry,
  PracticeRetireBlockersInitializer,
  RETIRE_BLOCKER_PROVIDERS,
  CARE_SPACE_OPS_PORT,
  InfrastructureAccessService,
  OpsEventsService,
  OpsStateService,
  OpsRecorder,
  CleaningOrdersService,
  CareSpaceBlocksService,
  CareSpaceOpsService,
  BedBoardReadService,
  CareSpaceOpsPortService,
  CareSpaceBlocksTickService,
  PracticeOpsRetireBlockersInitializer,
} from './services';
import { OpsSettingsReader } from './services/ops-settings';
import { INFRA_POLICIES, InfraPolicyRegistry } from './policies/infra-policy';
import { InfraF2PolicyInitializer } from './policies/infra-f2.policy';
import {
  PracticesRepository,
  PracticeSitesRepository,
  PracticeAccreditationsRepository,
  ClinicalUnitsRepository,
  CareSpacesRepository,
  HealthcareServicesRepository,
  PracticeSettingsRepository,
  PractitionerRoleAssignmentsRepository,
  PractitionerSupportAssignmentsRepository,
  InventoryItemsRepository,
  InventoryMovementsRepository,
  PracticeOrganizationReadRepository,
  InfrastructureRulesRepository,
  SpaceUnitAssignmentsRepository,
  SiteDeclaredCapacitiesRepository,
} from './repositories';
import { ServiceCatalogRepository } from '../billing/repositories';
import { ProcedureReferenceReader } from '../billing/services/procedure-reference.reader';
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { TenantsRepository } from '../directory/repositories';
import { BranchesRepository } from '../directory/repositories/branches.repository';
import { BranchMembershipsRepository } from '../directory/repositories/branch-memberships.repository';
// F1 de infraestructura: las habilitaciones viven en
// `organization_extensions.facility_licenses` (Desvíos del modelo v4.2.67b) y se
// leen/escriben con sus repositorios sin estado, sin importar su módulo; el
// outbox sí viene del módulo de mensajería (no importa `practice`).
import {
  FacilityLicensesRepository,
  OrgextReferencesRepository,
} from '../organization_extensions/repositories';
import { MessagingModule } from '../messaging/messaging.module';
// La estructura versiona en `audit.*_history` con el `HistoryRepository` que
// exporta `AuditModule`; `audit` no importa `practice`, no cierra ciclo.
import { AuditModule } from '../audit/audit.module';
import { AddressesRepository } from '../common/repositories';
// El logo del consultorio pasa por `AttachableFileService` (archivo vivo, de
// imagen y subido por quien lo fija). `common` no importa `practice`, así que
// no cierra ciclo.
import { CommonModule } from '../common/common.module';
// ALV-005/006: `PractitionerSitesService.createOwnSite` necesita saber de
// quién es la sesión (`ProfileOwnershipService`); `OwnSiteProvisioningService`
// necesita crear la dirección de la sede (`AddressesRepository`). Mismo
// criterio que `ServiceCatalogRepository` arriba: se registran las clases
// puntuales, no `ProfilesModule`/`CommonModule` enteros — evita el ciclo
// (`profiles` ya lee lo que `practice` expone) y no duplica fuente de verdad.
import { ProfileOwnershipService } from '../profiles/application/services/profile-ownership.service';
import {
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
} from '../profiles/infrastructure/repositories';

/**
 * Módulo Practice (14): organizaciones de atención, sitios, unidades clínicas,
 * espacios, servicios de salud, personal (roles y apoyo), acreditaciones,
 * ajustes e inventario. Implementa UC-14-01..12 (más un bootstrap de práctica).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    // Regla de administración por organización (A-6), sin importar
    // `DirectoryModule` entero.
    DirectoryAuthorizationModule,
    CommonModule,
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    PracticesController,
    SitesController,
    AccreditationsController,
    PractitionerSitesController,
    RoleAssignmentsController,
    InventoryItemsController,
    OrganizationPracticesController,
    PracticeInvitationsController,
    PractitionerInvitationsController,
    CareSpacesController,
    ClinicalUnitsController,
    SiteInfrastructureController,
    SiteLicensesController,
    InfrastructureCatalogController,
    CareSpaceOpsController,
    PracticeInternalController,
  ],
  providers: [
    // Repositorios
    PracticesRepository,
    PracticeSitesRepository,
    PracticeAccreditationsRepository,
    ClinicalUnitsRepository,
    CareSpacesRepository,
    HealthcareServicesRepository,
    PracticeSettingsRepository,
    PractitionerRoleAssignmentsRepository,
    PractitionerSupportAssignmentsRepository,
    InventoryItemsRepository,
    InventoryMovementsRepository,
    PracticeOrganizationReadRepository,
    InfrastructureRulesRepository,
    SpaceUnitAssignmentsRepository,
    SiteDeclaredCapacitiesRepository,
    // Stateless (reciben el `em`): sucursales del actor y habilitaciones.
    BranchMembershipsRepository,
    FacilityLicensesRepository,
    OrgextReferencesRepository,
    // El catálogo de servicios es de `billing`, pero acá se registra la clase y
    // no se importa `BillingModule`: la dependencia entre los dos módulos ya va
    // en el otro sentido (billing → practice, por `PracticeTenantLookupService`)
    // e importarlo cerraría el ciclo. El repositorio no guarda estado —recibe el
    // `em` en cada llamada—, así que una segunda instancia es la misma cosa.
    ServiceCatalogRepository,
    // Lector sin estado del nomenclador: se registra la clase, no `BillingModule`.
    ProcedureReferenceReader,
    AddressesRepository,
    // Stateless: sólo lee la verificación de la organización (CM-11).
    TenantsRepository,
    // Clase sin estado (recibe el `em`): valida `branchId` al dar de alta sedes.
    BranchesRepository,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    PatientProfilesRepository,
    ProfileOwnershipService,
    // Servicios
    PracticeSitesService,
    PracticeAccreditationsService,
    ClinicalStructureService,
    PracticeSettingsService,
    PracticeWorkforceService,
    PracticeInventoryService,
    PracticeTenantLookupService,
    PractitionerSitesService,
    OwnSiteProvisioningService,
    PracticeOrganizationReadService,
    PracticeAccessService,
    OrganizationPracticeProvisioningService,
    PracticeAdministrationService,
    HealthcareServiceOffersService,
    PracticeAffiliationInvitationsService,
    // Infraestructura hospitalaria F1
    InfrastructureCatalogService,
    StructureAccessService,
    StructureContextService,
    StructureEventsService,
    CareSpaceReadService,
    CareSpaceCreationService,
    CareSpaceUpdateService,
    CareSpaceLifecycleService,
    SpaceUnitAssignmentsService,
    ClinicalUnitsService,
    SiteRegulatoryService,
    SiteLicensesService,
    SiteCapacityService,
    // Registro de bloqueos de clausura: los demás módulos suman el suyo
    // inyectando `RETIRE_BLOCKER_PROVIDERS`, sin editar el servicio.
    RetireBlockerRegistry,
    { provide: RETIRE_BLOCKER_PROVIDERS, useExisting: RetireBlockerRegistry },
    PracticeRetireBlockersInitializer,
    // Infraestructura hospitalaria F2: operación de espacios.
    InfraPolicyRegistry,
    { provide: INFRA_POLICIES, useExisting: InfraPolicyRegistry },
    InfraF2PolicyInitializer,
    InfrastructureAccessService,
    OpsSettingsReader,
    OpsEventsService,
    OpsStateService,
    OpsRecorder,
    CleaningOrdersService,
    CareSpaceBlocksService,
    CareSpaceOpsService,
    BedBoardReadService,
    CareSpaceOpsPortService,
    { provide: CARE_SPACE_OPS_PORT, useExisting: CareSpaceOpsPortService },
    CareSpaceBlocksTickService,
    PracticeOpsRetireBlockersInitializer,
  ],
  // `scheduling` resuelve con esto la sede de cada recurso agendable: el dato
  // vive acá y no se duplica allá. `practice` no importa `scheduling`, así que
  // la dependencia va en un solo sentido y no cierra ciclo.
  //
  // `OwnSiteProvisioningService` se exporta además para `iam`: el
  // auto-registro de profesional (`POST /iam/auth/register-practitioner`, P20)
  // lo usa DENTRO de su propia transacción para dar de alta el consultorio
  // propio declarado en el alta. `practice` no importa `iam`, así que la
  // dependencia va en un solo sentido y no cierra ciclo.
  //
  // `PracticesRepository`/`PracticeSitesRepository` se exportan además para
  // `diagnostic_units`: `DiagnosticUnitProvisioningService` (subtarea 1.5)
  // los necesita para dar de alta la práctica y la sede propias de una
  // unidad diagnóstica al registrar un centro de imagenología. `practice` no
  // importa `diagnostic_units`, así que tampoco acá cierra ciclo.
  exports: [
    PracticeTenantLookupService,
    PractitionerSitesService,
    OwnSiteProvisioningService,
    PracticesRepository,
    PracticeSitesRepository,
    // F1 de infraestructura: un módulo con algo que impide clausurar un espacio
    // (stock, equipos, reservas…) se registra acá sin editar `practice`.
    RETIRE_BLOCKER_PROVIDERS,
    RetireBlockerRegistry,
    // F2: F3 (ADT) y F4 (quirófano) programan contra el puerto; cada franja
    // registra su política de roles en `INFRA_POLICIES` y autoriza con el evaluador.
    CARE_SPACE_OPS_PORT,
    INFRA_POLICIES,
    InfraPolicyRegistry,
    InfrastructureAccessService,
  ],
})
export class PracticeModule {}
