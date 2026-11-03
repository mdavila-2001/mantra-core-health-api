import { Module } from '@nestjs/common';
import { CatalogFitTickJob } from './fit-tick.job';
import { CatalogScanTickJob } from './scan-tick.job';

export { CatalogFitTickJob } from './fit-tick.job';
export { CatalogScanTickJob } from './scan-tick.job';

/**
 * Worker del catálogo de datos (módulo 67): ejecuta los escaneos técnicos
 * aceptados por `POST /admin/catalog/scans` y corre la sonda de ajuste de la
 * catalogación (`fit-tick`).
 */
@Module({
  providers: [CatalogScanTickJob, CatalogFitTickJob],
})
export class DataCatalogWorkerModule {}
