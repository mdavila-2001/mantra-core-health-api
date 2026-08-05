import { bootstrapWorker } from './worker/bootstrap';
import { PromotionsWorkerModule } from './worker/jobs/promotions/promotions.worker-module';

void bootstrapWorker(PromotionsWorkerModule, 'promotions');
