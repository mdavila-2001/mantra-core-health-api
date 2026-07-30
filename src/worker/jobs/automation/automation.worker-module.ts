import { Module } from '@nestjs/common';
import { CalendarTriggerJob } from './calendar-trigger.job';

/**
 * Fase 2 (P0) del plan de corrección de workers: cierra la evaluación
 * periódica de disparadores de calendario que `automation/README.md` deja
 * pendiente en su sección "Pendiente".
 */
@Module({
  providers: [CalendarTriggerJob],
})
export class AutomationWorkerModule {}
