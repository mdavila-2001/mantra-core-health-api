import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
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
} from './controllers';
import {
  InsuranceBackboneService,
  CoverageService,
  PriorAuthService,
  ClaimsService,
  ClaimsReadService,
  AppealsService,
  ReconciliationService,
  BrokerCommissionService,
  InsuranceReadService,
  InsuranceCatalogService,
} from './services';
import {
  CatalogRepository,
  CoverageRepository,
  PriorAuthRepository,
  ClaimRepository,
  ClaimReadRepository,
  DisputeRepository,
  SettlementRepository,
  InsuranceReadRepository,
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
    ClaimsReadController,
    AppealsController,
    ReconciliationController,
    BrokerCommissionController,
    InsuranceReadController,
    InsuranceCatalogController,
  ],
  providers: [
    // Repositorios
    CatalogRepository,
    InsuranceReadRepository,
    CoverageRepository,
    PriorAuthRepository,
    ClaimRepository,
    ClaimReadRepository,
    DisputeRepository,
    SettlementRepository,
    // Servicios
    InsuranceBackboneService,
    CoverageService,
    PriorAuthService,
    ClaimsService,
    ClaimsReadService,
    AppealsService,
    ReconciliationService,
    BrokerCommissionService,
    InsuranceReadService,
    InsuranceCatalogService,
  ],
  // Lo consume `directory` para materializar la aseguradora o el corredor en la
  // misma transacción en la que se da de alta el tenant de ese tipo.
  // `CoverageRepository` lo necesita iam: el alta de paciente anota en la misma
  // transacción el seguro que la persona declara tener.
  exports: [CatalogRepository, CoverageRepository],
})
export class InsuranceModule {}
