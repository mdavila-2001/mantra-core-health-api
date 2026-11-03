import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/**
 * Cada cuánto se buscan recetas por vencer. Una hora alcanza: el aviso se pide con días de
 * antelación y el barrido es idempotente, así que repetirlo más seguido sólo gastaría consultas.
 */
const PRESCRIPTION_EXPIRY_INTERVAL_MS = 3_600_000;

/** Refleja `PrescriptionExpirySweepResultDto` (`modules/clinical/dto`). */
interface PrescriptionExpirySweepResult {
  scanned: number;
  notified: number;
  suppressed: number;
  failed: number;
  skipped: boolean;
}

/**
 * PAC-REC-002: avisa por la bandeja in-app a los pacientes con una receta que vence en los
 * próximos días.
 *
 * La decisión —qué recetas, a quién, una sola vez— vive en
 * `PrescriptionExpiryNoticesService`; el job sólo dispara el barrido. Por eso puede declararlo
 * `idempotent: true`: un reintento tras un corte de red no duplica ningún aviso.
 */
@Injectable()
export class PrescriptionExpiryNoticeJob {
  /**
   * @param api - Cliente HTTP autenticado como `SYSTEM` contra la propia API.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrescriptionExpiryNoticeJob.name);
  }

  /** Dispara un barrido de avisos de vencimiento. */
  @Interval(PRESCRIPTION_EXPIRY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.messaging.prescription-expiry-notice',
      async () => {
        const result = await this.api.post<PrescriptionExpirySweepResult>(
          '/clinical/internal/prescription-expiry-notices',
          {},
          { idempotent: true },
        );
        if (result.scanned === 0) return;

        this.logger.info(
          {
            operation: 'worker.messaging.prescription-expiry-notice',
            scanned: result.scanned,
            notified: result.notified,
            suppressed: result.suppressed,
            failed: result.failed,
          },
          'Swept prescriptions about to expire',
        );
      },
    );
  }
}
