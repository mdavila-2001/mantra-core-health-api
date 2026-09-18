import { Module } from '@nestjs/common';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
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
import { OBJECT_CONTENT_READER, S3ObjectContentReader } from './ports';
// MCH-010: la emisión de acceso a un objeto de un paciente se decide con la
// política del expediente (`ClinicalReadService`), que `ClinicalModule` ya
// exporta para el guard del expediente. Import unidireccional: `clinical` no
// conoce `object_storage`, así que no cierra ciclo.
import { ClinicalModule } from '../clinical/clinical.module';

/**
 * Módulo de almacenamiento de objetos: cargas multiparte, versiones inmutables,
 * catálogo DICOM con registro de accesos, payloads grandes, retención WORM y
 * legal, verificación de integridad, archivado en frío y borrado gobernado
 * (UC-60-01 … 12).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    StorageLifecycleModule,
    ClinicalModule,
  ],
  controllers: [ObjectStorageController, DicomWebController],
  providers: [
    ObjectStorageRepository,
    ObjectGovernanceRepository,
    DicomRepository,
    ObjectStorageService,
    DicomCatalogService,
    ObjectGovernanceService,
    // MCH-021/MCH-009: lectura física de los objetos para verificarlos al
    // cerrarlos y para entregarlos detrás de un acceso firmado.
    { provide: OBJECT_CONTENT_READER, useClass: S3ObjectContentReader },
  ],
})
export class ObjectStorageModule {}
