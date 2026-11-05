import { bootstrapWorker } from './worker/bootstrap';
import { PracticeWorkerModule } from './worker/jobs/practice/practice.worker-module';

void bootstrapWorker(PracticeWorkerModule, 'practice');
