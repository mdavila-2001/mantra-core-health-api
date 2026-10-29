import { Module } from '@nestjs/common';
import { CareSpaceBlocksTickJob } from './care-space-blocks-tick.job';

/**
 * F2 de infraestructura hospitalaria: proceso periódico de los bloqueos de espacios
 * (aplica los programados y avisa de los vencidos).
 */
@Module({
  providers: [CareSpaceBlocksTickJob],
})
export class PracticeWorkerModule {}
