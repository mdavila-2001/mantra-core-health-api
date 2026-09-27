import { Module } from '@nestjs/common';
import { ExpireHoldsJob } from './expire-holds.job';
import { DispatchRemindersJob } from './dispatch-reminders.job';
import { PromoteWaitlistJob } from './promote-waitlist.job';
import { DispatchMedicationRemindersJob } from './dispatch-medication-reminders.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `scheduling` (UC-41-07, 12, 14) — libera holds vencidos, promueve la lista
 * de espera a slots con cupo y marca los recordatorios ya dispararon.
 *
 * Patch v4.2.35: también dispara los recordatorios de toma de medicamento
 * (`DispatchMedicationRemindersJob`); ver el job para el porqué de este proceso.
 */
@Module({
  providers: [
    ExpireHoldsJob,
    DispatchRemindersJob,
    PromoteWaitlistJob,
    DispatchMedicationRemindersJob,
  ],
})
export class SchedulingWorkerModule {}
