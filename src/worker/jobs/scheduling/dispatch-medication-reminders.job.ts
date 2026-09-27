import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DISPATCH_MEDICATION_REMINDERS_INTERVAL_MS = 60_000;

/** Ventana de la pasada: las tomas de los próximos 15 minutos. */
export const MEDICATION_REMINDER_WINDOW_MINUTES = 15;

const BATCH_LIMIT = 200;

/** Refleja `DispatchMedicationRemindersResultDto`. */
interface DispatchMedicationRemindersResult {
  processed: number;
  detail: string;
}

/**
 * Patch v4.2.35 · recordatorios de toma de medicamento.
 *
 * Vive en el proceso worker de `scheduling` —el de los recordatorios por hora—
 * y no en un proceso nuevo: evita un contenedor más en el despliegue para un
 * tick por minuto (decisión D5 del PLAN). La lógica es de `clinical`
 * (`MedicationRemindersService`); este job sólo la dispara.
 *
 * Cada minuto con ventana de 15: la misma toma cae en varias pasadas, y la
 * API la avisa una sola vez (marca con UNIQUE en
 * `clinical.medication_reminder_dispatches`).
 */
@Injectable()
export class DispatchMedicationRemindersJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DispatchMedicationRemindersJob.name);
  }

  @Interval(DISPATCH_MEDICATION_REMINDERS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.clinical.dispatch-medication-reminders',
      async () => {
        const result = await this.api.post<DispatchMedicationRemindersResult>(
          '/clinical/internal/medication-reminders/dispatch',
          {
            windowMinutes: MEDICATION_REMINDER_WINDOW_MINUTES,
            limit: BATCH_LIMIT,
          },
        );
        if (result.processed === 0) return;

        this.logger.info(
          {
            operation: 'worker.clinical.dispatch-medication-reminders',
            processed: result.processed,
          },
          'Dispatched medication dose reminders',
        );
      },
    );
  }
}
