import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PlatformOpsController, OpsToolsController } from './controllers';
import {
  OpsReleasesService,
  OpsIncidentsService,
  OpsReliabilityService,
  OpsPracticesService,
  OpsToolsService,
  PlatformOpsScope,
} from './services';
import {
  OpsReleasesRepository,
  OpsIncidentsRepository,
  OpsReliabilityRepository,
  OpsPracticesRepository,
  OpsImprovementsRepository,
  OpsToolsRepository,
} from './repositories';

/**
 * Módulo de operaciones de plataforma: cambios y aprobaciones del CAB,
 * artefactos y despliegues con reversión, health checks e incidentes,
 * postmortems, SLO y error budget, capacidad, revisiones de preparación,
 * runbooks y ejercicios de resiliencia (UC-46-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PlatformOpsController, OpsToolsController],
  providers: [
    OpsReleasesRepository,
    OpsIncidentsRepository,
    OpsReliabilityRepository,
    OpsPracticesRepository,
    OpsImprovementsRepository,
    OpsToolsRepository,
    OpsReleasesService,
    OpsIncidentsService,
    OpsReliabilityService,
    OpsPracticesService,
    OpsToolsService,
    PlatformOpsScope,
  ],
})
export class PlatformOpsModule {}
