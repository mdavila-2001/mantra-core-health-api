import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const TICK_INTERVAL_MS = 30_000;

/** Refleja `FiredTriggerDto` (`modules/automation/dto`). */
interface FiredTrigger {
  triggerId: string;
  workflowRunId: string;
  firedAt: string;
}

/** Refleja `EvaluateCalendarTriggersResponseDto`. */
interface EvaluateCalendarTriggersResponse {
  scanned: number;
  fired: number;
  skipped: number;
  firedTriggers: FiredTrigger[];
}

/**
 * Fase 2 (P0) · UC-48-07: cierra el "bucle del worker" que
 * `automation/README.md` documenta como pendiente ("Suscripción real del
 * disparador al bus ... y registro del cron en el planificador ... la
 * suscripción es el worker"). Antes de este job, ningún proceso evaluaba
 * `schedule_cron` de `automation_triggers`: un disparador de calendario
 * quedaba registrado pero nunca se disparaba.
 *
 * Cada tick llama `POST /automation/triggers/calendar/tick`
 * (`AutomationExecutionService.evaluateCalendarTriggers`), que toma con
 * `SKIP LOCKED` los disparadores de calendario activos, calcula su próxima
 * marca con la librería `cron` y arranca un `workflow_run` por cada uno
 * vencido, encadenando todo en el propio endpoint (no hace falta una segunda
 * llamada aparte, igual que `OutboxRelayJob` con `runRelay`).
 */
@Injectable()
export class CalendarTriggerJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CalendarTriggerJob.name);
  }

  @Interval(TICK_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.automation.calendar-tick', async () => {
      const result = await this.api.post<EvaluateCalendarTriggersResponse>(
        '/automation/triggers/calendar/tick',
        {},
      );

      if (result.scanned === 0) return;

      this.logger.info(
        {
          operation: 'worker.automation.calendar-tick',
          scanned: result.scanned,
          fired: result.fired,
          skipped: result.skipped,
        },
        'Calendar triggers evaluated',
      );
    });
  }
}
