import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE_ADAPTER } from './file-storage.adapter';
import { LocalDiskFileStorageAdapter } from './local-disk-file-storage.adapter';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';
import { loadStorageEnv } from './storage.env';

/**
 * Resuelve el adaptador de almacenamiento activo a partir de
 * `FILE_STORAGE_ADAPTER` y lo publica bajo un único token, de modo que los
 * servicios de dominio dependan de la interfaz y no del backend concreto.
 *
 * `@Global()` por el mismo motivo que `MockProviderClientModule` en los
 * workers: es infraestructura transversal, y obligar a cada módulo que guarde
 * un archivo a importarla sólo añadiría ruido.
 *
 * El `switch` es exhaustivo sobre los valores que Joi ya validó al arrancar; el
 * `default` existe para que añadir un adaptador a `FILE_STORAGE_ADAPTERS` sin
 * cablearlo aquí falle en el arranque y no en la primera subida.
 */
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
        const { adapter } = loadStorageEnv();
        switch (adapter) {
          case 'local':
            return local;
          case 's3':
            return s3;
          default:
            throw new Error(
              `FILE_STORAGE_ADAPTER="${String(adapter)}" no tiene implementación cableada`,
            );
        }
      },
      inject: [LocalDiskFileStorageAdapter, S3FileStorageAdapter],
    },
  ],
  exports: [FILE_STORAGE_ADAPTER],
})
export class FileStorageModule {}
