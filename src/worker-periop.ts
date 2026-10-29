import { bootstrapWorker } from './worker/bootstrap';
import { PeriopWorkerModule } from './worker/jobs/periop/periop.worker-module';

void bootstrapWorker(PeriopWorkerModule, 'periop');
