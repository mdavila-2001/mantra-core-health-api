import { bootstrapWorker } from './worker/bootstrap';
import { WorkflowWorkerModule } from './worker/jobs/workflow/workflow.worker-module';

void bootstrapWorker(WorkflowWorkerModule, 'workflow');
