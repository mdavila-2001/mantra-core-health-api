import { jest } from '@jest/globals';
import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceLifecycleModule } from './identity-evidence-lifecycle.module';
import { IdentityEvidenceLifecycleService } from './services/identity-evidence-lifecycle.service';
import { IdentityEvidenceStoragePurgeService } from './services/identity-evidence-storage-purge.service';
import { StoragePublicationService } from '../../common/storage/storage-publication.service';
import { FILE_STORAGE_ADAPTER } from '../../common/storage/file-storage.adapter';
import { LocalDiskFileStorageAdapter } from '../../common/storage/local-disk-file-storage.adapter';
import { S3FileStorageAdapter } from '../../common/storage/s3-file-storage.adapter';
import { InternalStorageLifecycleController } from '../common/controllers/internal-storage-lifecycle.controller';
import { IdentityWorkerController } from './controllers/identity-worker.controller';
import { ROLES_KEY } from '../../common/auth/roles.decorator';

@Global()
@Module({
  providers: [
    {
      provide: EntityManager,
      useValue: {
        fork: jest.fn(() => {
          throw new Error('DB forbidden in wiring test');
        }),
      },
    },
  ],
  exports: [EntityManager],
})
class ControlledPersistenceModule {}

describe('production lifecycle module wiring, no application/runtime bootstrap', () => {
  it('resolves the common coordinator graph and both lifecycle services without DB or native adapters', async () => {
    const unit = await Test.createTestingModule({
      imports: [ControlledPersistenceModule, IdentityEvidenceLifecycleModule],
    })
      .overrideProvider(FILE_STORAGE_ADAPTER)
      .useValue({})
      .overrideProvider(LocalDiskFileStorageAdapter)
      .useValue({})
      .overrideProvider(S3FileStorageAdapter)
      .useValue({})
      .compile();
    expect(unit.get(IdentityEvidenceLifecycleService)).toBeDefined();
    expect(unit.get(IdentityEvidenceStoragePurgeService)).toBeDefined();
    expect(unit.get(StoragePublicationService)).toBeDefined();
    await expect(
      unit.get(IdentityEvidenceLifecycleService).scan(),
    ).resolves.toMatchObject({ scanned: 0 });
    await unit.close();
  });
  it('exposes lifecycle commands only as SYSTEM operations, not download permissions', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, InternalStorageLifecycleController),
    ).toEqual(['SYSTEM']);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(
          IdentityWorkerController.prototype,
          'lifecycleScan',
        )!.value,
      ),
    ).toEqual(['SYSTEM']);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(
          IdentityWorkerController.prototype,
          'storagePurgeReview',
        )!.value,
      ),
    ).toEqual(['SYSTEM']);
  });
});
