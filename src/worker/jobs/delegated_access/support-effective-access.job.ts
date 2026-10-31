import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const INTERVAL_MS = 600_000;

/** Refleja `EffectiveRefreshResult`. */
interface EffectiveRefreshResult {
  tenants: number;
  rows: number;
  delegationsCreated: number;
}

/**
 * Recalcula `effective_support_access` y abre las delegaciones pendientes de aceptación cuando cambian permisos, estructura (espacios, horarios) o vínculos.
 */
@Injectable()
export class SupportEffectiveAccessJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportEffectiveAccessJob.name);
  }

  @Interval(INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.delegated_access.support-effective-access',
      async () => {
        const result = await this.api.post<EffectiveRefreshResult>(
          '/delegated-access/support/refresh-effective-access',
        );
        if (result.tenants === 0) return;

        this.logger.info(
          {
            operation: 'worker.delegated_access.support-effective-access',
            tenants: result.tenants,
            rows: result.rows,
            delegationsCreated: result.delegationsCreated,
          },
          'Refreshed effective support access',
        );
      },
    );
  }
}
