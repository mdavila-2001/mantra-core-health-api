import { Module } from '@nestjs/common';
import { CareSpaceBlocksTickJob } from './care-space-blocks-tick.job';
import { CensusCloseTickJob } from '../clinical/census-close-tick.job';
import { OrBlocksReleaseTickJob } from '../procedures_perioperative/or-blocks-release-tick.job';
import { BedDayChargesJob } from '../billing/bed-day-charges.job';

/**
 * Procesos periódicos de la infraestructura hospitalaria (CONTRATO-F2-F5
 * §0.2): cada uno llama un endpoint interno `SYSTEM` idempotente.
 */
@Module({
  providers: [
    CareSpaceBlocksTickJob,
    CensusCloseTickJob,
    OrBlocksReleaseTickJob,
    BedDayChargesJob,
  ],
})
export class PracticeWorkerModule {}
