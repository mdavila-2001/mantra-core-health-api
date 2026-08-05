import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SEED } from '../../../common';
import { TIMESERIES_TABLES } from '../../../modules/time_series/constants';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { WORKER_ENV, type WorkerEnv } from '../../worker.tokens';

const RETENTION_TICK_MS = 3_600_000;

/** Refleja `RetentionResponseDto`. */
interface RetentionResponse {
  table: string;
  chunksDropped: number;
  droppedChunks: string[];
}

/**
 * UC-58-06: aplica la retención descartando chunks fuera de ventana.
 *
 * A diferencia de comprimir, `drop_chunks` borra datos sin vuelta atrás — y
 * cada serie de este módulo tiene una política de retención distinta por
 * motivos de cumplimiento (clínica vs. analítica vs. gobernada por
 * consentimiento). Por eso este job **no corre sobre ninguna tabla salvo
 * que `TS_RETENTION_POLICIES` la declare explícitamente**: sin
 * configuración, el tick no hace nada — no hereda una ventana de borrado que
 * nadie decidió.
 */
@Injectable()
export class ApplyRetentionJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(ApplyRetentionJob.name);
  }

  @Interval(RETENTION_TICK_MS)
  async tick(): Promise<void> {
    const policies = Object.entries(this.env.tsRetentionPolicies);
    if (policies.length === 0) return;

    for (const [table, olderThan] of policies) {
      if (!(TIMESERIES_TABLES as readonly string[]).includes(table)) {
        this.logger.warn(
          {
            operation: 'worker.time_series.apply-retention',
            table,
          },
          'TS_RETENTION_POLICIES nombra una tabla que no existe en TIMESERIES_TABLES; se ignora',
        );
        continue;
      }
      await runTick(this.logger, 'worker.time_series.apply-retention', () =>
        this.applyToTable(table, olderThan),
      );
    }
  }

  private async applyToTable(table: string, olderThan: string): Promise<void> {
    const response = await this.api.post<RetentionResponse>(
      '/ts/admin/retention/policies',
      {
        table,
        olderThan,
        batchId: randomUUID(),
        tenantId: SEED.tenantId,
        reason: 'worker.time_series.apply-retention: TS_RETENTION_POLICIES',
      },
    );

    if (response.chunksDropped > 0) {
      this.logger.warn(
        {
          operation: 'worker.time_series.apply-retention',
          table,
          olderThan,
          chunksDropped: response.chunksDropped,
        },
        'Chunks dropped by retention policy',
      );
    }
  }
}
