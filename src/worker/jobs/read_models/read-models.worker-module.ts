import { Module } from '@nestjs/common';
import { ReadModelReconciliationJob } from './read-model-reconciliation.job';

export { ReadModelReconciliationJob } from './read-model-reconciliation.job';

/**
 * Fase 4 (P4) del plan de corrección de workers: barrido periódico de
 * reconciliación de read models (`GET /read-models/health` → `POST
 * /read-models/:id/reconcile` por cada definición `stale`).
 */
@Module({
  providers: [ReadModelReconciliationJob],
})
export class ReadModelsWorkerModule {}
