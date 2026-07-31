import { bootstrapWorker } from './worker/bootstrap';
import { TrackingWorkerModule } from './worker/jobs/tracking/tracking.worker-module';

void bootstrapWorker(TrackingWorkerModule, 'tracking');
