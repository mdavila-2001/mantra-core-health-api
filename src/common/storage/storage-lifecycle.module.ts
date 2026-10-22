import { Module } from '@nestjs/common';
import { FileStorageModule } from './file-storage.module';
import { QueuesRepository } from '../../modules/messaging/repositories/queues.repository';
import { StorageLifecycleCoordinator } from './storage-lifecycle-coordinator.service';
import { StoragePublicationService } from './storage-publication.service';
import { StorageReferenceRepository } from './storage-reference.repository';
import { StorageReferenceResolver } from './storage-reference-resolver.service';
import { StorageWorkerPublicationService } from './storage-worker-publication.service';

/** API-only DB coordination. Worker FileStorageModule remains DB-free. */
@Module({
  imports: [FileStorageModule],
  providers: [
    QueuesRepository,
    StorageLifecycleCoordinator,
    StoragePublicationService,
    StorageWorkerPublicationService,
    StorageReferenceRepository,
    StorageReferenceResolver,
  ],
  exports: [
    StorageLifecycleCoordinator,
    StoragePublicationService,
    StorageWorkerPublicationService,
    StorageReferenceRepository,
    StorageReferenceResolver,
  ],
})
export class StorageLifecycleModule {}
