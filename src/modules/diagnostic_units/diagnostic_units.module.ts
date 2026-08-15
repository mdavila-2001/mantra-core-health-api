import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import * as entities from './entities';
import {
  DiagnosticUnitsController,
  DiagnosticUnitSitesController,
  DiagnosticPricingController,
  DiagnosticEquipmentController,
  DiagnosticUnitAccreditationsController,
} from './controllers';
import {
  DiagnosticUnitsService,
  DiagnosticStudiesService,
  DiagnosticPricingService,
  DiagnosticEquipmentService,
  DiagnosticUnitsReadService,
  DiagnosticUnitsAdminReadService,
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
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommunityModule,
  ],
  controllers: [
    DiagnosticUnitsController,
    DiagnosticUnitSitesController,
    DiagnosticPricingController,
    DiagnosticEquipmentController,
    DiagnosticUnitAccreditationsController,
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
    DiagnosticUnitsService,
    DiagnosticStudiesService,
    DiagnosticPricingService,
    DiagnosticEquipmentService,
    DiagnosticUnitsReadService,
    DiagnosticUnitsAdminReadService,
  ],
})
export class DiagnosticUnitsModule {}
