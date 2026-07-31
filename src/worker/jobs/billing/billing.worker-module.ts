import { Module } from '@nestjs/common';
import { RunDueDunningJob } from './run-due-dunning.job';

/**
 * Fase 4 del plan de corrección de workers, acotada a `billing` (módulo 17):
 * solo morosidad automática. `reconciliation:clear` y `kpi-snapshots:compute`
 * quedan fuera a propósito — ver `run-due-dunning.job.ts` y
 * `PLAN-CORRECCION-WORKERS-2026-07-28.md`.
 */
@Module({
  providers: [RunDueDunningJob],
})
export class BillingWorkerModule {}
