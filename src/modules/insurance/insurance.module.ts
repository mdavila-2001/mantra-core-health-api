import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  InsuranceBackboneController,
  CoverageController,
  PriorAuthController,
  ClaimsController,
  AppealsController,
  ReconciliationController,
  BrokerCommissionController,
} from './controllers';
import {
  InsuranceBackboneService,
  CoverageService,
  PriorAuthService,
  ClaimsService,
  AppealsService,
  ReconciliationService,
  BrokerCommissionService,
} from './services';
import {
  CatalogRepository,
  CoverageRepository,
  PriorAuthRepository,
  ClaimRepository,
  DisputeRepository,
  SettlementRepository,
} from './repositories';

/**
 * Módulo Insurance (26): redes, coberturas, elegibilidad, autorización previa,
 * reclamos/adjudicación (837/835), EOB, COB, reversiones, disputas/apelaciones,
 * conciliación y comisiones de broker. Repos stateless + servicios transaccionales.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    InsuranceBackboneController,
    CoverageController,
    PriorAuthController,
    ClaimsController,
    AppealsController,
    ReconciliationController,
    BrokerCommissionController,
  ],
  providers: [
    // Repositorios
    CatalogRepository,
    CoverageRepository,
    PriorAuthRepository,
    ClaimRepository,
    DisputeRepository,
    SettlementRepository,
    // Servicios
    InsuranceBackboneService,
    CoverageService,
    PriorAuthService,
    ClaimsService,
    AppealsService,
    ReconciliationService,
    BrokerCommissionService,
  ],
  // Lo consume `directory` para materializar la aseguradora o el corredor en la
  // misma transacción en la que se da de alta el tenant de ese tipo.
  exports: [CatalogRepository],
})
export class InsuranceModule {}
