import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRY_SWEEP_INTERVAL_MS = 300_000;

/** Refleja `ExpirySweepResultDto`. */
interface ExpirySweepResult {
  expiredGrants: number;
  expiredDelegations: number;
  expiredOrgAssignments: number;
}

/**
 * Fase 3 · UC-29-08: expira grants, delegaciones de practitioner y
 * asignaciones de organización vencidas. Operación de lote autocontenida —
 * no hace falta descubrimiento aparte.
 */
@Injectable()
export class ExpirySweepJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpirySweepJob.name);
  }

  @Interval(EXPIRY_SWEEP_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.delegated_access.expiry-sweep',
      async () => {
        const result = await this.api.post<ExpirySweepResult>(
          '/delegated-access/expiry-sweep',
        );
        const total =
          result.expiredGrants +
          result.expiredDelegations +
          result.expiredOrgAssignments;
        if (total === 0) return;

        this.logger.info(
          {
            operation: 'worker.delegated_access.expiry-sweep',
            expiredGrants: result.expiredGrants,
            expiredDelegations: result.expiredDelegations,
            expiredOrgAssignments: result.expiredOrgAssignments,
          },
          'Expired delegated-access grants, delegations and org assignments',
        );
      },
    );
  }
}
