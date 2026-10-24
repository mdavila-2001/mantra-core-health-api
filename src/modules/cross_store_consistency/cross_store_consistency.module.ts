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
  ObjectStoreReconciliationService,
} from './services';
import {
  OBJECT_CONTENT_READER,
  S3ObjectContentReader,
} from '../object_storage/ports';
import { OBJECT_STORE_INVENTORY, S3ObjectStoreInventory } from './ports';
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
    // F09: el escaneo de objetos huérfanos necesita mirar el almacén, no sólo
    // registrar lo que alguien diga de él. El lector es el mismo del módulo 60
    // —no se duplica—; el inventario es propio porque el 60 no expone recorrido
    // de bucket y este módulo no lo toca.
    { provide: OBJECT_CONTENT_READER, useClass: S3ObjectContentReader },
    { provide: OBJECT_STORE_INVENTORY, useClass: S3ObjectStoreInventory },
    ObjectStoreReconciliationService,
  ],
})
export class CrossStoreConsistencyModule {}
