import { bootstrapWorker } from './worker/bootstrap';
import { IdentityAssuranceWorkerModule } from './worker/jobs/identity_assurance/identity-assurance.worker-module';

void bootstrapWorker(IdentityAssuranceWorkerModule, 'identity_assurance');
