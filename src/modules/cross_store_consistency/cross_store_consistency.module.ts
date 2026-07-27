import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { MessagingModule } from '../messaging/messaging.module';
import {
  CrossStoreAdminController,
  CrossStoreWorkerController,
} from './controllers';
import {
  ProjectionDeliveryService,
  ReconciliationService,
  DeletionService,
  StorageMaintenanceService,
} from './services';
import {
  ProjectionRepository,
  ReconciliationRepository,
  DeletionRepository,
} from './repositories';

/**
 * Módulo 62 del modelo: consistencia cross-store — proyección desde el outbox,
 * reconciliación y propagación del borrado (UC-62-01 … 14).
 *
 * **PostgreSQL es la única fuente de verdad.** Todo lo que hay aquí existe para
 * que los stores secundarios —búsqueda, read models, series temporales, vectores,
 * grafo, objetos— acaben reflejando lo que dice el canónico: proyectando lo que
 * cambia, detectando lo que se desvió, reparándolo hacia el destino y
 * comprobando que un borrado llegó a todas partes.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [CrossStoreAdminController, CrossStoreWorkerController],
  providers: [
    ProjectionRepository,
    ReconciliationRepository,
    DeletionRepository,
    ProjectionDeliveryService,
    ReconciliationService,
    DeletionService,
    StorageMaintenanceService,
  ],
})
export class CrossStoreConsistencyModule {}
