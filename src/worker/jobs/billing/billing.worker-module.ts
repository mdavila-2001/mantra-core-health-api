import { Module } from '@nestjs/common';
import { RunDueDunningJob } from './run-due-dunning.job';
import { BedDayChargesJob } from './bed-day-charges.job';
import { OrTimeChargesJob } from './or-time-charges.job';

/**
 * Fase 4 del plan de corrección de workers, acotada a `billing` (módulo 17):
 * solo morosidad automática. `reconciliation:clear` y `kpi-snapshots:compute`
 * quedan fuera a propósito — ver `run-due-dunning.job.ts` y
 * `PLAN-CORRECCION-WORKERS-2026-07-28.md`.
 *
 * F5e de infraestructura: devengo programado del día-cama (regla de medianoche) y del
 * quirófano por tiempo, ambos idempotentes.
 */
@Module({
  providers: [RunDueDunningJob, BedDayChargesJob, OrTimeChargesJob],
})
export class BillingWorkerModule {}
