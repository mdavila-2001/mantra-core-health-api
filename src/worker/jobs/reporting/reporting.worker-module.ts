import { Module } from '@nestjs/common';
import { SchedulerTickJob } from './scheduler-tick.job';

/**
 * Fase 2 (P0) del plan de corrección de workers: cierra el tick del
 * planificador de `reporting/README.md` (UC-39-07), que ningún proceso
 * disparaba hasta ahora.
 */
@Module({
  providers: [SchedulerTickJob],
})
export class ReportingWorkerModule {}
