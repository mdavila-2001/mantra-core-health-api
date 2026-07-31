import { bootstrapWorker } from './worker/bootstrap';
import { CrossStoreConsistencyWorkerModule } from './worker/jobs/cross_store_consistency/cross_store_consistency.worker-module';

void bootstrapWorker(
  CrossStoreConsistencyWorkerModule,
  'cross_store_consistency',
);
