import { Module } from '@nestjs/common';
import { SweepTimeoutsJob } from './sweep-timeouts.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `workflow` (UC-32-10).
 */
@Module({
  providers: [SweepTimeoutsJob],
})
export class WorkflowWorkerModule {}
