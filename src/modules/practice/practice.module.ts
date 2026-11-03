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
  CareSpacesController,
  ClinicalUnitsController,
  SiteInfrastructureController,
  InfrastructureCatalogController,
  SiteLicensesController,
  OrganizationPracticesController,
  PracticeInvitationsController,
  PractitionerInvitationsController,
  CareSpaceOpsController,
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
  StructureAccessService,
  CareSpacesAdminService,
  ClinicalUnitsAdminService,
  SiteEstablishmentService,
  InfrastructureReadService,
  OrganizationPracticeProvisioningService,
  PracticeAdministrationService,
  HealthcareServiceOffersService,
  PracticeAffiliationInvitationsService,
  InfrastructureAccessService,
  InfraPolicyRegistry,
  INFRA_POLICIES,
  CARE_SPACE_OPS_PORT,
  CareSpaceOpsService,
  CleaningOrdersService,
  BedBoardReadService,
  CleaningOrderObservers,
} from './services';
import { CareSpaceOpsCore } from './services/ops/care-space-ops-core';
import { OpsCellBuilder } from './services/ops/ops-cell-builder';
import { PracticeCareSpaceOpsAdapter } from './services/ops/care-space-ops.adapter';
import { ChangeAvailabilityUseCase } from './services/ops/use-cases/change-availability.use-case';
import {
  CancelBlockUseCase,
  EndBlockUseCase,
} from './services/ops/use-cases/close-block.use-cases';
import { ChangeHygieneUseCase } from './services/ops/use-cases/change-hygiene.use-case';
import { ChangeIsolationUseCase } from './services/ops/use-cases/change-isolation.use-case';
import {
  AssignCleaningOrderUseCase,
  CancelCleaningOrderUseCase,
  CreateCleaningOrderUseCase,
  FinishCleaningOrderUseCase,
  InspectCleaningOrderUseCase,
  StartCleaningOrderUseCase,
} from './services/ops/use-cases/cleaning-order.use-cases';
import { RunBlocksTickUseCase } from './services/ops/use-cases/run-blocks-tick.use-case';
import { INFRA_F2_POLICY } from './policies/infra-f2.policy';
import { INFRA_F5_ASSETS_POLICY } from './policies/infra-f5-assets.policy';
import { SpaceAssetsController } from './controllers/space-assets.controller';
import { InfrastructureAccessController } from './controllers/infrastructure-access.controller';
import { InfrastructureAccessMeService } from './services/infrastructure-access-me.service';
import { SpaceAssetsReadService } from './services/space-assets-read.service';
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
  StructureRulesRepository,
  SpaceUnitAssignmentsRepository,
  SiteDeclaredCapacitiesRepository,
  RetireBlockersRepository,
  CareSpaceOpsRepository,
} from './repositories';
// F1 infraestructura: las habilitaciones de la sede son
// `organization_extensions.facility_licenses` (orden del orquestador, no una
// tabla nueva). Mismo criterio que `ServiceCatalogRepository`: se registra el
// repositorio sin estado, no el módulo (que no exporta nada).
import { FacilityLicensesRepository } from '../organization_extensions/repositories/facility-licenses.repository';
// Eventos `practice.*` por outbox, en la transacción de cada mutación.
// `messaging` no importa `practice`: no cierra ciclo.
import { MessagingModule } from '../messaging/messaging.module';
import { ServiceCatalogRepository } from '../billing/repositories';
// F0 infraestructura hospitalaria: la estructura (sede, unidad, espacio) se
// autoriza con la regla de organización —OWNER/ADMIN del tenant o plataforma—
// que vive en `DirectoryAuthorizationModule`, y versiona en `audit.*_history`
// con el `HistoryRepository` que exporta `AuditModule`. Ninguno de los dos
// importa `practice`, así que no cierran ciclo. `BranchesRepository` es una
// clase sin estado (recibe el `em`): se registra suelta, como el catálogo.
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { AuditModule } from '../audit/audit.module';
import { BranchesRepository } from '../directory/repositories/branches.repository';
import { ProcedureReferenceReader } from '../billing/services/procedure-reference.reader';
import { TenantsRepository } from '../directory/repositories';
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
    AuditModule,
    MessagingModule,
    CommonModule,
  ],
  controllers: [
    PracticesController,
    SitesController,
    AccreditationsController,
    PractitionerSitesController,
    RoleAssignmentsController,
    InventoryItemsController,
    CareSpacesController,
    ClinicalUnitsController,
    SiteInfrastructureController,
    InfrastructureCatalogController,
    SiteLicensesController,
    OrganizationPracticesController,
    PracticeInvitationsController,
    PractitionerInvitationsController,
    CareSpaceOpsController,
    SpaceAssetsController,
    InfrastructureAccessController,
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
    StructureRulesRepository,
    SpaceUnitAssignmentsRepository,
    SiteDeclaredCapacitiesRepository,
    RetireBlockersRepository,
    FacilityLicensesRepository,
    // El catálogo de servicios es de `billing`, pero acá se registra la clase y
    // no se importa `BillingModule`: la dependencia entre los dos módulos ya va
    // en el otro sentido (billing → practice, por `PracticeTenantLookupService`)
    // e importarlo cerraría el ciclo. El repositorio no guarda estado —recibe el
    // `em` en cada llamada—, así que una segunda instancia es la misma cosa.
    ServiceCatalogRepository,
    BranchesRepository,
    // Lector sin estado del nomenclador: se registra la clase, no `BillingModule`.
    ProcedureReferenceReader,
    AddressesRepository,
    // Stateless: sólo lee la verificación de la organización (CM-11).
    TenantsRepository,
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
    StructureAccessService,
    CareSpacesAdminService,
    ClinicalUnitsAdminService,
    SiteEstablishmentService,
    InfrastructureReadService,
    OrganizationPracticeProvisioningService,
    PracticeAdministrationService,
    HealthcareServiceOffersService,
    PracticeAffiliationInvitationsService,
    // F2 operación (CONTRATO-F2-F5 §F2.3) y evaluador único de §0.3. Cada
    // franja registra su política en `INFRA_POLICIES` al arrancar su módulo.
    CareSpaceOpsRepository,
    {
      provide: INFRA_POLICIES,
      useFactory: () => {
        const registry = new InfraPolicyRegistry();
        registry.register(INFRA_F2_POLICY);
        registry.register(INFRA_F5_ASSETS_POLICY);
        return registry;
      },
    },
    InfrastructureAccessService,
    SpaceAssetsReadService,
    InfrastructureAccessMeService,
    CareSpaceOpsCore,
    OpsCellBuilder,
    CleaningOrderObservers,
    PracticeCareSpaceOpsAdapter,
    { provide: CARE_SPACE_OPS_PORT, useExisting: PracticeCareSpaceOpsAdapter },
    ChangeAvailabilityUseCase,
    EndBlockUseCase,
    CancelBlockUseCase,
    ChangeHygieneUseCase,
    ChangeIsolationUseCase,
    CreateCleaningOrderUseCase,
    AssignCleaningOrderUseCase,
    StartCleaningOrderUseCase,
    FinishCleaningOrderUseCase,
    InspectCleaningOrderUseCase,
    CancelCleaningOrderUseCase,
    RunBlocksTickUseCase,
    CareSpaceOpsService,
    CleaningOrdersService,
    BedBoardReadService,
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
    // F2–F5: el puerto de operación (F3/F4/F5 lo llaman dentro de su
    // transacción), el evaluador de §0.3 y su registro de políticas, y los
    // observadores de órdenes de limpieza (periop, recambio de quirófano).
    CARE_SPACE_OPS_PORT,
    InfrastructureAccessService,
    INFRA_POLICIES,
    CleaningOrderObservers,
  ],
})
export class PracticeModule {}
