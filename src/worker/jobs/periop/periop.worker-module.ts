import { Module } from '@nestjs/common';
import { OrBlocksReleaseJob } from './or-blocks-release.job';

/** Barridos de `procedures_perioperative`: liberación automática de bloques de quirófano (F4). */
@Module({
  providers: [OrBlocksReleaseJob],
})
export class PeriopWorkerModule {}
