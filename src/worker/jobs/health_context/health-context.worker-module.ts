import { Module } from '@nestjs/common';
import { HealthContextScheduleTickJob } from './schedule-tick.job';

/**
 * Fase 2 del plan de corrección de workers, acotada a `health_context`
 * (módulo 44): dispara las corridas de recolección cuya programación venció.
 */
@Module({
  providers: [HealthContextScheduleTickJob],
})
export class HealthContextWorkerModule {}
