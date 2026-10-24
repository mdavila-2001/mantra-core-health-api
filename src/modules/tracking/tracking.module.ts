import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TrackingController,
  TrackingCollectionsController,
} from './controllers';
import { TrackingService, TrackingCollectionsService } from './services';
import { TrackingRepository } from './repositories';

/**
 * Módulo de seguimiento: sujetos rastreables y envíos, catálogo de hitos,
 * eventos de timeline, webhooks de transportista, traspasos, estimaciones de
 * llegada, prueba de entrega, excepciones y barrido de SLA (UC-37-01 … 11).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [TrackingController, TrackingCollectionsController],
  providers: [TrackingCollectionsService, TrackingRepository, TrackingService],
})
export class TrackingModule {}
