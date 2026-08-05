import { bootstrapWorker } from './worker/bootstrap';
import { AutomationWorkerModule } from './worker/jobs/automation/automation.worker-module';

void bootstrapWorker(AutomationWorkerModule, 'automation');
