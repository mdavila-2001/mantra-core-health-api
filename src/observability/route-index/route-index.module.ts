import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RouteIndexService } from './route-index.service';
import { RouteMetadataService } from './route-metadata.service';

/**
 * Índice de rutas HTTP de la API; lo importan los módulos que nombran rutas
 * ({@link RouteIndexService}) o necesitan sus roles y su sello de bitácora
 * ({@link RouteMetadataService}).
 */
@Module({
  imports: [DiscoveryModule],
  providers: [RouteIndexService, RouteMetadataService],
  exports: [RouteIndexService, RouteMetadataService],
})
export class RouteIndexModule {}
