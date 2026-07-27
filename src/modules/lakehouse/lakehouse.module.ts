import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  HealthDeidentificationProfiles,
  HealthDeidentificationRuns,
} from '../health_data/entities';
import { DataReleaseRepository } from '../health_data/repositories';
import { MessagingModule } from '../messaging/messaging.module';
import { LakehouseController, ResearchController } from './controllers';
import {
  LakehouseCatalogService,
  TransformationService,
  ResearchReleaseService,
} from './services';
import {
  LakehouseCatalogRepository,
  LakehouseRuntimeRepository,
  ResearchRepository,
} from './repositories';

/**
 * Módulo 63 del modelo: lakehouse, productos de datos analíticos y releases de
 * investigación (UC-63-01 … 12).
 *
 * Registra `HealthDeidentificationProfiles` y `HealthDeidentificationRuns` de
 * `health_data` a propósito: UC-63-07 y UC-63-11 escriben la corrida de
 * de-identificación **en la misma transacción** que el dato curado o el manifiesto
 * del release. Sin la entidad registrada aquí, el `EntityManager` de este módulo
 * no sabría persistirla, y separarlo en dos transacciones dejaría dato curado sin
 * prueba de qué perfil lo produjo.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ...Object.values(entities),
      HealthDeidentificationProfiles,
      HealthDeidentificationRuns,
    ]),
    MessagingModule,
  ],
  controllers: [LakehouseController, ResearchController],
  providers: [
    LakehouseCatalogRepository,
    LakehouseRuntimeRepository,
    ResearchRepository,
    DataReleaseRepository,
    LakehouseCatalogService,
    TransformationService,
    ResearchReleaseService,
  ],
})
export class LakehouseModule {}
