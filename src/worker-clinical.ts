import { bootstrapWorker } from './worker/bootstrap';
import { ClinicalWorkerModule } from './worker/jobs/clinical/clinical.worker-module';

void bootstrapWorker(ClinicalWorkerModule, 'clinical');
