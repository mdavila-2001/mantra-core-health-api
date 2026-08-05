import { bootstrapWorker } from './worker/bootstrap';
import { LakehouseWorkerModule } from './worker/jobs/lakehouse/lakehouse.worker-module';

void bootstrapWorker(LakehouseWorkerModule, 'lakehouse');
