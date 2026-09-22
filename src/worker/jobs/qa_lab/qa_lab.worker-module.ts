import { Module } from '@nestjs/common';
import { QaScheduleTickJob } from './schedule-tick.job';
import { QaPlanRunTickJob } from './plan-run-tick.job';

export { QaScheduleTickJob } from './schedule-tick.job';
export { QaPlanRunTickJob } from './plan-run-tick.job';

/**
 * Fase 2 del plan de corrección de workers: cierra el "Disparo programado"
 * de `qa_lab/README.md` (evaluar `test_schedules` vencidas y encolar sus
 * corridas).
 */
@Module({
  providers: [QaScheduleTickJob, QaPlanRunTickJob],
})
export class QaLabWorkerModule {}
