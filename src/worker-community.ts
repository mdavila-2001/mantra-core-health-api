import { bootstrapWorker } from './worker/bootstrap';
import { CommunityWorkerModule } from './worker/jobs/community/community.worker-module';

void bootstrapWorker(CommunityWorkerModule, 'community');
