import { bootstrapWorker } from './worker/bootstrap';
import { ReadModelsWorkerModule } from './worker/jobs/read_models/read-models.worker-module';

void bootstrapWorker(ReadModelsWorkerModule, 'read_models');
