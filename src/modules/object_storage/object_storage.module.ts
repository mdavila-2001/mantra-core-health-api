import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ObjectStorageController, DicomWebController } from './controllers';
import {
  ObjectStorageService,
  DicomCatalogService,
  ObjectGovernanceService,
} from './services';
import {
  ObjectStorageRepository,
  ObjectGovernanceRepository,
  DicomRepository,
} from './repositories';

/**
 * Módulo de almacenamiento de objetos: cargas multiparte, versiones inmutables,
 * catálogo DICOM con registro de accesos, payloads grandes, retención WORM y
 * legal, verificación de integridad, archivado en frío y borrado gobernado
 * (UC-60-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ObjectStorageController, DicomWebController],
  providers: [
    ObjectStorageRepository,
    ObjectGovernanceRepository,
    DicomRepository,
    ObjectStorageService,
    DicomCatalogService,
    ObjectGovernanceService,
  ],
})
export class ObjectStorageModule {}
