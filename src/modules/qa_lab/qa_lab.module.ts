import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  QaLabController,
  QaLabInternalController,
  QaLabReadController,
} from './controllers';
import { QaCatalogService, QaLabReadService, QaRunsService } from './services';
import { QaCatalogRepository, QaRunsRepository } from './repositories';

/**
 * Módulo de laboratorio de pruebas: entornos gobernados, suites con casos y
 * aserciones, corridas con evidencia inmutable, defectos deduplicados y enlace
 * de evidencia a release (UC-36-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [QaLabController, QaLabInternalController, QaLabReadController],
  providers: [
    QaCatalogRepository,
    QaRunsRepository,
    QaCatalogService,
    QaRunsService,
    QaLabReadService,
  ],
  // El runner del servidor (módulo 68) escribe la evidencia por estos casos de uso.
  exports: [QaRunsService],
})
export class QaLabModule {}
