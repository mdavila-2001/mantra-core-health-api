import { bootstrapWorker } from './worker/bootstrap';
import { IntegrationsWorkerModule } from './worker/jobs/integrations/integrations.worker-module';

void bootstrapWorker(IntegrationsWorkerModule, 'integrations');
