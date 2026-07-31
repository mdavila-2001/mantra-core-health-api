import { bootstrapWorker } from './worker/bootstrap';
import { QaLabWorkerModule } from './worker/jobs/qa_lab/qa_lab.worker-module';

void bootstrapWorker(QaLabWorkerModule, 'qa_lab');
