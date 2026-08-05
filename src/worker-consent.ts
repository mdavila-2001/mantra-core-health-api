import { bootstrapWorker } from './worker/bootstrap';
import { ConsentWorkerModule } from './worker/jobs/consent/consent.worker-module';

void bootstrapWorker(ConsentWorkerModule, 'consent');
