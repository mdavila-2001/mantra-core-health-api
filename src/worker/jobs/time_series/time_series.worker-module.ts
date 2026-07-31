import { Module } from '@nestjs/common';
import { CompressChunksJob } from './compress-chunks.job';
import { ApplyRetentionJob } from './apply-retention.job';
import { RefreshRollupsJob } from './refresh-rollups.job';

export { CompressChunksJob } from './compress-chunks.job';
export { ApplyRetentionJob } from './apply-retention.job';
export { RefreshRollupsJob } from './refresh-rollups.job';

/**
 * UC-58-05 … 08: cierra el mantenimiento físico de las series (compresión,
 * retención opt-in, rollups). Las series en sí (UC-58-01 … 04, 09) son API
 * síncrona de ingesta/consulta, no tienen bucle de worker.
 */
@Module({
  providers: [CompressChunksJob, ApplyRetentionJob, RefreshRollupsJob],
})
export class TimeSeriesWorkerModule {}
