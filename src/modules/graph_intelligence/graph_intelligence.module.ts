import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { MessagingModule } from '../messaging/messaging.module';
import { GraphProjectionController, GraphQueryController } from './controllers';
import {
  GraphProjectionService,
  GraphTraversalService,
  GraphAnalyticsService,
} from './services';
import {
  GraphProjectionRepository,
  GraphAnalyticsRepository,
} from './repositories';

/**
 * Módulo 61 del modelo: inteligencia de grafo — proyecciones de relaciones,
 * referidos y riesgo (UC-61-01 … 12).
 *
 * **El grafo es una proyección derivada, no la fuente de verdad.** Postgres lo es.
 * Todo lo que hay aquí se construye consumiendo eventos canónicos, se reconcilia
 * contra la versión de origen y se borra cuando la fuente borra — nunca al revés.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [GraphProjectionController, GraphQueryController],
  providers: [
    GraphProjectionRepository,
    GraphAnalyticsRepository,
    GraphProjectionService,
    GraphTraversalService,
    GraphAnalyticsService,
  ],
})
export class GraphIntelligenceModule {}
