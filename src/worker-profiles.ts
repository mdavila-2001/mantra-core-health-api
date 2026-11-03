import { bootstrapWorker } from './worker/bootstrap';
import { ProfilesWorkerModule } from './worker/jobs/profiles/profiles.worker-module';

void bootstrapWorker(ProfilesWorkerModule, 'profiles');
