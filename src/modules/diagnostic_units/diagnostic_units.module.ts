import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import { CommonModule } from '../common/common.module';
import { PracticeModule } from '../practice/practice.module';
import { MessagingModule } from '../messaging/messaging.module';
// Tenant memberships: `LabStaffGuard` on the lab portal recognises lab staff by membership.
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { LabPortalServicesController } from './controllers/lab-portal-services.controller';
import { LabPortalCatalogService } from './services/lab-portal-catalog.service';
import { LabPortalCategoriesService } from './services/lab-portal-categories.service';
import { LabPortalContextService } from './services/lab-portal-context.service';
import { LabPortalImportService } from './services/lab-portal-import.service';
import { LabPortalPricingService } from './services/lab-portal-pricing.service';
import { LabPortalWriterService } from './services/lab-portal-writer.service';
import {
  CENTER_SCHEDULE_CONTROLLERS,
  CENTER_SCHEDULE_PROVIDERS,
} from './center-schedule/center-schedule.providers';
import { EquipmentF5aService } from './services/equipment-f5a.service';
import { InfraF5aPolicyRegistrar } from './policies/infra-f5a.policy';
import * as entities from './entities';
import {
  DiagnosticUnitsController,
  DiagnosticUnitSitesController,
  DiagnosticPricingController,
  DiagnosticEquipmentController,
  DiagnosticUnitAccreditationsController,
} from './controllers';
import {
  DiagnosticUnitScopeService,
  DiagnosticUnitsService,
  DiagnosticStudiesService,
  DiagnosticPricingService,
  DiagnosticEquipmentService,
  DiagnosticUnitsReadService,
  DiagnosticUnitsAdminReadService,
  DiagnosticUnitsSearchService,
  DiagnosticUnitProvisioningService,
} from './services';
import {
  DiagnosticUnitsRepository,
  DiagnosticUnitSitesRepository,
  DiagnosticUnitSpecialtiesRepository,
  DiagnosticUnitAccreditationsRepository,
  DiagnosticUnitPractitionerAssignmentsRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyComponentsRepository,
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyPricesRepository,
  DiagnosticEquipmentRepository,
  DiagnosticUnitsReadRepository,
  DiagnosticUnitsAdminReadRepository,
} from './repositories';

/**
 * Módulo 23 — Diagnostic Units, Studies, Specialists and Prices. Registra los
 * controladores (unidades, sitios, precios, equipos, acreditaciones), los
 * servicios de dominio y los repositorios stateless. `MikroOrmModule.forFeature`
 * expone las entidades del esquema `diagnostic_units`.
 */
@Module({
  // `PracticeModule`: `DiagnosticUnitProvisioningService` (subtarea 1.5) da
  // de alta la práctica y la sede propias de la unidad diagnóstica al
  // registrar un centro de imagenología — `PracticesRepository`/
  // `PracticeSitesRepository` son de ahí. `CommonModule`: la dirección
  // opcional de esa sede es `common.addresses`. Ninguno de los dos importa
  // `diagnostic_units`, así que no cierra ciclo.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommunityModule,
    CommonModule,
    PracticeModule,
    MessagingModule,
    DirectoryAuthorizationModule,
  ],
  controllers: [
    // First: their `me/*` routes must be matched before any `:id` route.
    ...CENTER_SCHEDULE_CONTROLLERS,
    DiagnosticUnitsController,
    DiagnosticUnitSitesController,
    DiagnosticPricingController,
    DiagnosticEquipmentController,
    DiagnosticUnitAccreditationsController,
    LabPortalServicesController,
  ],
  providers: [
    // Repositorios
    DiagnosticUnitsRepository,
    DiagnosticUnitSitesRepository,
    DiagnosticUnitSpecialtiesRepository,
    DiagnosticUnitAccreditationsRepository,
    DiagnosticUnitPractitionerAssignmentsRepository,
    DiagnosticStudyOfferingsRepository,
    DiagnosticStudyComponentsRepository,
    DiagnosticPriceSchedulesRepository,
    DiagnosticStudyPricesRepository,
    DiagnosticEquipmentRepository,
    DiagnosticUnitsReadRepository,
    DiagnosticUnitsAdminReadRepository,
    // Servicios
    DiagnosticUnitScopeService,
    DiagnosticUnitsService,
    DiagnosticStudiesService,
    DiagnosticPricingService,
    DiagnosticEquipmentService,
    EquipmentF5aService,
    InfraF5aPolicyRegistrar,
    DiagnosticUnitsReadService,
    DiagnosticUnitsAdminReadService,
    DiagnosticUnitsSearchService,
    DiagnosticUnitProvisioningService,
    ...CENTER_SCHEDULE_PROVIDERS,
    LabPortalContextService,
    LabPortalPricingService,
    LabPortalWriterService,
    LabPortalCatalogService,
    LabPortalCategoriesService,
    LabPortalImportService,
  ],
  // Se exporta para `directory`: `TenantTypeProfileService` lo usa DENTRO de
  // su propia transacción para materializar la unidad diagnóstica de un
  // tenant `DIAGNOSTIC_CENTER` recién creado (subtarea 1.5). `diagnostic_units`
  // no importa `directory`, así que la dependencia va en un solo sentido y no
  // cierra ciclo.
  exports: [DiagnosticUnitProvisioningService],
})
export class DiagnosticUnitsModule {}
