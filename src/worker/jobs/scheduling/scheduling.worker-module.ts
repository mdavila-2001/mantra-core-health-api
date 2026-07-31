import { Module } from '@nestjs/common';
import { ExpireHoldsJob } from './expire-holds.job';
import { DispatchRemindersJob } from './dispatch-reminders.job';
import { PromoteWaitlistJob } from './promote-waitlist.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `scheduling` (UC-41-07, 12, 14) — libera holds vencidos, promueve la lista
 * de espera a slots con cupo y marca los recordatorios ya dispararon.
 */
@Module({
  providers: [ExpireHoldsJob, DispatchRemindersJob, PromoteWaitlistJob],
})
export class SchedulingWorkerModule {}
