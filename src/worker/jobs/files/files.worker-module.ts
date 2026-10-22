import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../../common';
import { MalwareScanJob } from './malware-scan.job';
import { StorageLifecycleJob } from './storage-lifecycle.job';

export { MalwareScanJob } from './malware-scan.job';

/**
 * Worker del subsistema de archivos (módulo Common, 02): hoy, el escaneo
 * antimalware de las versiones que se suben.
 *
 * Importa `FileStorageModule` por la misma razón que el worker de audio: lee
 * los bytes por el adaptador de almacenamiento real —disco o S3 según el
 * despliegue— en vez de moverlos por HTTP.
 */
@Module({
  imports: [FileStorageModule],
  providers: [MalwareScanJob, StorageLifecycleJob],
})
export class FilesWorkerModule {}
