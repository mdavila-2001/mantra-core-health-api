import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import { CommonModule } from '../common/common.module';
import { PracticeModule } from '../practice/practice.module';
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
    DiagnosticUnitsSearchService,
    DiagnosticUnitProvisioningService,
  ],
  // Se exporta para `directory`: `TenantTypeProfileService` lo usa DENTRO de
  // su propia transacción para materializar la unidad diagnóstica de un
  // tenant `DIAGNOSTIC_CENTER` recién creado (subtarea 1.5). `diagnostic_units`
  // no importa `directory`, así que la dependencia va en un solo sentido y no
  // cierra ciclo.
  exports: [DiagnosticUnitProvisioningService],
})
export class DiagnosticUnitsModule {}
