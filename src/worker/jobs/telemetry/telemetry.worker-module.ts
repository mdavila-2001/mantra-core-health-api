import { Module } from '@nestjs/common';
import { RetentionPurgeJob } from './retention-purge.job';

export { RetentionPurgeJob } from './retention-purge.job';

/** Worker de telemetría: hoy sólo la purga por retención (revisión F0, hallazgo 1). */
@Module({
  providers: [RetentionPurgeJob],
})
export class TelemetryWorkerModule {}
