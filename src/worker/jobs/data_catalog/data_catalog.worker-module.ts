import { Module } from '@nestjs/common';
import { CatalogScanTickJob } from './scan-tick.job';

export { CatalogScanTickJob } from './scan-tick.job';

/**
 * Worker del catálogo de datos (módulo 67): ejecuta los escaneos técnicos
 * aceptados por `POST /admin/catalog/scans`.
 */
@Module({
  providers: [CatalogScanTickJob],
})
export class DataCatalogWorkerModule {}
