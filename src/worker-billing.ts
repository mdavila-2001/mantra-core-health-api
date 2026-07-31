import { bootstrapWorker } from './worker/bootstrap';
import { BillingWorkerModule } from './worker/jobs/billing/billing.worker-module';

void bootstrapWorker(BillingWorkerModule, 'billing');
