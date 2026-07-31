import { bootstrapWorker } from './worker/bootstrap';
import { HealthContextWorkerModule } from './worker/jobs/health_context/health-context.worker-module';

void bootstrapWorker(HealthContextWorkerModule, 'health_context');
