import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE_ADAPTER } from './file-storage.adapter';
import { LocalDiskFileStorageAdapter } from './local-disk-file-storage.adapter';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';
import { loadStorageEnv } from './storage.env';

/** Publica un único puerto de storage y selecciona el adaptador por entorno. */
@Global()
@Module({
  providers: [
    LocalDiskFileStorageAdapter,
    S3FileStorageAdapter,
    {
      provide: FILE_STORAGE_ADAPTER,
      useFactory: (
        local: LocalDiskFileStorageAdapter,
        s3: S3FileStorageAdapter,
      ) => {
        switch (loadStorageEnv().adapter) {
          case 'local':
            return local;
          case 's3':
            return s3;
          default:
            throw new Error(
              'FILE_STORAGE_ADAPTER no tiene implementación cableada',
            );
        }
      },
      inject: [LocalDiskFileStorageAdapter, S3FileStorageAdapter],
    },
  ],
  exports: [FILE_STORAGE_ADAPTER],
})
export class FileStorageModule {}
