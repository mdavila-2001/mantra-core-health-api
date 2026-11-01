import { bootstrapWorker } from './worker/bootstrap';
import { TelemetryWorkerModule } from './worker/jobs/telemetry/telemetry.worker-module';

void bootstrapWorker(TelemetryWorkerModule, 'telemetry');
