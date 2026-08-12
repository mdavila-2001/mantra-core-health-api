import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { AUDIO_RECONCILE_INTERVAL_MS } from './audio-tts.intervals';

/** Refleja `AudioReconcileResponseDto`. */
interface ReconcileResponse {
  exhausted: number;
  releasedUnits: number;
  purgedActorDays: number;
  stalled: number;
}

/**
 * Dispara el barrido del dominio de audio.
 *
 * El trabajo lo hace la API (`AudioReconcileService`); este job solo aporta el
 * reloj, igual que los barridos de `consent` o `delegated_access`. Lo que el
 * barrido resuelve y nadie más puede:
 *
 *   - **cerrar los assets agotados y devolver su reserva al presupuesto.** Un
 *     asset cuyo worker murió a mitad de la generación no lo reporta nadie: sin
 *     este paso sus unidades quedan apartadas para siempre, y un mes con
 *     incidentes bastaría para dejar el presupuesto en cero sin haber generado un
 *     solo audio;
 *   - **aplicar retención** al contador diario por actor, que contiene
 *     identificadores de personas;
 *   - **publicar cuántos assets llevan demasiado tiempo pendientes**, que es la
 *     única señal que distingue "la cola está vacía" de "el worker no drena".
 *
 * Es idempotente: cada pasada opera sobre lo que encuentra, así que ejecutarlo dos
 * veces seguidas no cambia nada respecto a ejecutarlo una.
 */
@Injectable()
export class AudioReconcileJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioReconcileJob.name);
  }

  @Interval(AUDIO_RECONCILE_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.audio_tts.reconcile', async () => {
      // `idempotent: true`: el barrido no acumula efectos, así que reintentar tras
      // un timeout de red es seguro y preferible a esperar cinco minutos.
      const report = await this.api.post<ReconcileResponse>(
        '/internal/audio-tts/reconcile',
        {},
        { idempotent: true },
      );

      if (
        report.exhausted === 0 &&
        report.purgedActorDays === 0 &&
        report.stalled === 0
      ) {
        return;
      }

      this.logger.warn(
        { operation: 'worker.audio_tts.reconcile', ...report },
        'Barrido de audio: assets cerrados, encallados o retención aplicada',
      );
    });
  }
}
