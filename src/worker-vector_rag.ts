import { bootstrapWorker } from './worker/bootstrap';
import { VectorRagWorkerModule } from './worker/jobs/vector_rag/vector_rag.worker-module';

void bootstrapWorker(VectorRagWorkerModule, 'vector_rag');
