import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RouteIndexService } from './route-index.service';

/** Índice de rutas HTTP de la API; lo importan los módulos que nombran rutas. */
@Module({
  imports: [DiscoveryModule],
  providers: [RouteIndexService],
  exports: [RouteIndexService],
})
export class RouteIndexModule {}
