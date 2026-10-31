import { Module } from '@nestjs/common';
import { CareSpaceBlocksTickJob } from './care-space-blocks-tick.job';

/**
 * Procesos periódicos de la infraestructura hospitalaria (CONTRATO-F2-F5
 * §0.2): cada uno llama un endpoint interno `SYSTEM` idempotente.
 */
@Module({
  providers: [CareSpaceBlocksTickJob],
})
export class PracticeWorkerModule {}
