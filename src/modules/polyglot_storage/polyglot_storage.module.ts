import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  StorageGovernanceController,
  StorageOperationsController,
  StorageFinOpsController,
} from './controllers';
import {
  StorageGovernanceService,
  DatasetGovernanceService,
  StorageOperationsService,
} from './services';
import {
  StorageBackendsRepository,
  DatasetsRepository,
  PlacementsRepository,
  StoragePoliciesRepository,
} from './repositories';

/**
 * Módulo de almacenamiento políglota: gobierno de backends, datasets
 * versionados, colocaciones que respetan residencia y clasificación, políticas
 * de consistencia, acceso, cifrado, replicación y retención, salud con
 * failover, costes e integridad de proyecciones (UC-54-01 … 13).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    StorageGovernanceController,
    StorageOperationsController,
    StorageFinOpsController,
  ],
  providers: [
    StorageBackendsRepository,
    DatasetsRepository,
    PlacementsRepository,
    StoragePoliciesRepository,
    StorageGovernanceService,
    DatasetGovernanceService,
    StorageOperationsService,
  ],
})
export class PolyglotStorageModule {}
