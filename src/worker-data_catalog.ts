import { bootstrapWorker } from './worker/bootstrap';
import { DataCatalogWorkerModule } from './worker/jobs/data_catalog/data_catalog.worker-module';

void bootstrapWorker(DataCatalogWorkerModule, 'data_catalog');
