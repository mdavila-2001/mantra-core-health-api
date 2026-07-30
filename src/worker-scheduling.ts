import { bootstrapWorker } from './worker/bootstrap';
import { SchedulingWorkerModule } from './worker/jobs/scheduling/scheduling.worker-module';

void bootstrapWorker(SchedulingWorkerModule, 'scheduling');
