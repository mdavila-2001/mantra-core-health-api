import { bootstrapWorker } from './worker/bootstrap';
import { DelegatedAccessWorkerModule } from './worker/jobs/delegated_access/delegated-access.worker-module';

void bootstrapWorker(DelegatedAccessWorkerModule, 'delegated_access');
