import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  DataCatalogController,
  DataCatalogInternalController,
} from './controllers';
import {
  CatalogAnnotationsService,
  CatalogQueryService,
  CatalogScanService,
} from './services';
import { CatalogQueryRepository, CatalogScanRepository } from './repositories';
import { PostgresIntrospector } from './infrastructure/postgres-introspector';

/**
 * Módulo 67 — Catálogo de datos del portal administrativo: descubrimiento
 * técnico durable, fichas de justificación con revisión y evidencia, y
 * cobertura explicada.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [DataCatalogController, DataCatalogInternalController],
  providers: [
    PostgresIntrospector,
    CatalogScanRepository,
    CatalogQueryRepository,
    CatalogScanService,
    CatalogAnnotationsService,
    CatalogQueryService,
  ],
})
export class DataCatalogModule {}
