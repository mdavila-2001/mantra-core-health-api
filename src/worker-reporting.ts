import { bootstrapWorker } from './worker/bootstrap';
import { ReportingWorkerModule } from './worker/jobs/reporting/reporting.worker-module';

void bootstrapWorker(ReportingWorkerModule, 'reporting');
