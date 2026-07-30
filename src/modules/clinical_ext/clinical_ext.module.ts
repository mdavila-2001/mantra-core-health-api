import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  CareTeamsController,
  CdsController,
  ClinicalAlertsController,
  OrderSetsController,
  ReferralsController,
  CareGapsController,
  VirtualEncountersController,
} from './controllers';
import {
  CareTeamsService,
  CdsService,
  ClinicalAlertsService,
  OrderSetsService,
  ReferralsService,
  CareGapsService,
  VirtualEncountersService,
} from './services';
import {
  CareTeamsRepository,
  CareTeamMembersRepository,
  CdsRulesRepository,
  ClinicalAlertsRepository,
  DrugInteractionsRepository,
  OrderSetsRepository,
  ReferralsRepository,
  CareGapsRepository,
  ImmunizationSchedulesRepository,
  VirtualEncountersRepository,
} from './repositories';
import { ServiceRequestsRepository } from '../clinical/repositories';

/**
 * Módulo Clinical-Ext (18): coordinación de cuidado (equipos), decisión clínica
 * (reglas CDS, alertas, interacciones medicamentosas), plantillas de órdenes,
 * referencias, brechas de cuidado / inmunizaciones y telesalud.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    CareTeamsController,
    CdsController,
    ClinicalAlertsController,
    OrderSetsController,
    ReferralsController,
    CareGapsController,
    VirtualEncountersController,
  ],
  providers: [
    // Repositorios
    CareTeamsRepository,
    CareTeamMembersRepository,
    CdsRulesRepository,
    ClinicalAlertsRepository,
    DrugInteractionsRepository,
    OrderSetsRepository,
    ReferralsRepository,
    CareGapsRepository,
    ImmunizationSchedulesRepository,
    VirtualEncountersRepository,
    // Repositorio de otro módulo (clinical) reutilizado por el fan-out de order sets
    ServiceRequestsRepository,
    // Servicios
    CareTeamsService,
    CdsService,
    ClinicalAlertsService,
    OrderSetsService,
    ReferralsService,
    CareGapsService,
    VirtualEncountersService,
  ],
})
export class ClinicalExtModule {}
