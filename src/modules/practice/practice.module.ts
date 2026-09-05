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
  PracticeOrganizationReadService,
} from './services';
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
} from './repositories';
import { ServiceCatalogRepository } from '../billing/repositories';
import { AddressesRepository } from '../common/repositories';
// ALV-005/006: `PractitionerSitesService.createOwnSite` necesita saber de
// quién es la sesión (`ProfileOwnershipService`) y crear la dirección de la
// sede (`AddressesRepository`). Mismo criterio que `ServiceCatalogRepository`
// arriba: se registran las clases puntuales, no `ProfilesModule`/`CommonModule`
// enteros — evita el ciclo (`profiles` ya lee lo que `practice` expone) y no
// duplica fuente de verdad.
import { ProfileOwnershipService } from '../profiles/services/profile-ownership.service';
import {
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
} from '../profiles/repositories';

/**
 * Módulo Practice (14): organizaciones de atención, sitios, unidades clínicas,
 * espacios, servicios de salud, personal (roles y apoyo), acreditaciones,
 * ajustes e inventario. Implementa UC-14-01..12 (más un bootstrap de práctica).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    PracticesController,
    SitesController,
    AccreditationsController,
    PractitionerSitesController,
    RoleAssignmentsController,
    InventoryItemsController,
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
    // El catálogo de servicios es de `billing`, pero acá se registra la clase y
    // no se importa `BillingModule`: la dependencia entre los dos módulos ya va
    // en el otro sentido (billing → practice, por `PracticeTenantLookupService`)
    // e importarlo cerraría el ciclo. El repositorio no guarda estado —recibe el
    // `em` en cada llamada—, así que una segunda instancia es la misma cosa.
    ServiceCatalogRepository,
    AddressesRepository,
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
    PracticeOrganizationReadService,
  ],
  // `scheduling` resuelve con esto la sede de cada recurso agendable: el dato
  // vive acá y no se duplica allá. `practice` no importa `scheduling`, así que
  // la dependencia va en un solo sentido y no cierra ciclo.
  exports: [PracticeTenantLookupService, PractitionerSitesService],
})
export class PracticeModule {}
