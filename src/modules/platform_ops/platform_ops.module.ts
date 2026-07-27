import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PlatformOpsController } from './controllers';
import {
  OpsReleasesService,
  OpsIncidentsService,
  OpsReliabilityService,
  OpsPracticesService,
} from './services';
import {
  OpsReleasesRepository,
  OpsIncidentsRepository,
  OpsReliabilityRepository,
  OpsPracticesRepository,
  OpsImprovementsRepository,
} from './repositories';

/**
 * Módulo de operaciones de plataforma: cambios y aprobaciones del CAB,
 * artefactos y despliegues con reversión, health checks e incidentes,
 * postmortems, SLO y error budget, capacidad, revisiones de preparación,
 * runbooks y ejercicios de resiliencia (UC-46-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PlatformOpsController],
  providers: [
    OpsReleasesRepository,
    OpsIncidentsRepository,
    OpsReliabilityRepository,
    OpsPracticesRepository,
    OpsImprovementsRepository,
    OpsReleasesService,
    OpsIncidentsService,
    OpsReliabilityService,
    OpsPracticesService,
  ],
})
export class PlatformOpsModule {}
