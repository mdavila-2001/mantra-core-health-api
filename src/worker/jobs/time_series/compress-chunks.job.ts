import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SEED } from '../../../common';
import { COMPRESSION_SEGMENTS } from '../../../modules/time_series/constants';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { WORKER_ENV, type WorkerEnv } from '../../worker.tokens';

const COMPRESSION_TICK_MS = 600_000;
const MAX_PASSES_PER_TABLE = 10;

/** Tablas con segmentación de compresión declarada (UC-58-05). */
const COMPRESSIBLE_TABLES = Object.keys(COMPRESSION_SEGMENTS);

/** Refleja `CompressionResponseDto`. */
interface CompressionResponse {
  table: string;
  chunksCompressed: number;
  remainingChunks: string[];
}

/**
 * UC-58-05: comprime los chunks antiguos de cada serie declarada. Comprimir
 * es reversible en el sentido que importa aquí — no borra filas, sólo
 * reescribe el chunk a formato columnar de sólo lectura — así que corre
 * automático con un umbral uniforme (`TS_COMPRESSION_OLDER_THAN`), a
 * diferencia de la retención (ver `apply-retention.job.ts`).
 */
@Injectable()
export class CompressChunksJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(CompressChunksJob.name);
  }

  @Interval(COMPRESSION_TICK_MS)
  async tick(): Promise<void> {
    for (const table of COMPRESSIBLE_TABLES) {
      await runTick(this.logger, 'worker.time_series.compress-chunks', () =>
        this.compressTable(table),
      );
    }
  }

  private async compressTable(table: string): Promise<void> {
    let totalCompressed = 0;
    let hasMore = true;
    for (let pass = 0; hasMore && pass < MAX_PASSES_PER_TABLE; pass++) {
      const response = await this.api.post<CompressionResponse>(
        '/ts/admin/compression/run',
        {
          table,
          olderThan: this.env.tsCompressionOlderThan,
          batchId: randomUUID(),
          tenantId: SEED.tenantId,
        },
      );
      totalCompressed += response.chunksCompressed;
      hasMore = response.remainingChunks.length > 0;
    }

    if (totalCompressed > 0) {
      this.logger.info(
        {
          operation: 'worker.time_series.compress-chunks',
          table,
          chunksCompressed: totalCompressed,
        },
        'Chunks compressed',
      );
    }
  }
}
