import { bootstrapWorker } from './worker/bootstrap';
import { MessagingWorkerModule } from './worker/jobs/messaging/messaging.worker-module';

void bootstrapWorker(MessagingWorkerModule, 'messaging');
