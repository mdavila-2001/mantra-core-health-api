import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRATION_SWEEP_INTERVAL_MS = 300_000;

/** Refleja `ExpirationSweepResultDto`. */
interface ExpirationSweepResult {
  expiredConsents: number;
  expiredAuthorizations: number;
  expiredRestrictions: number;
}

/**
 * Fase 3 · UC-07-11: expira consentimientos, autorizaciones HIPAA y
 * restricciones de privacidad vencidas. Operación de lote autocontenida — no
 * hace falta descubrimiento aparte.
 */
@Injectable()
export class ExpirationSweepJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpirationSweepJob.name);
  }

  @Interval(EXPIRATION_SWEEP_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.consent.expiration-sweep', async () => {
      const result = await this.api.post<ExpirationSweepResult>(
        '/consent/internal/expiration-sweep',
      );
      const total =
        result.expiredConsents +
        result.expiredAuthorizations +
        result.expiredRestrictions;
      if (total === 0) return;

      this.logger.info(
        {
          operation: 'worker.consent.expiration-sweep',
          expiredConsents: result.expiredConsents,
          expiredAuthorizations: result.expiredAuthorizations,
          expiredRestrictions: result.expiredRestrictions,
        },
        'Expired consent, HIPAA authorization and privacy restriction records',
      );
    });
  }
}
