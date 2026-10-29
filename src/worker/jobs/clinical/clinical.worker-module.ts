import { Module } from '@nestjs/common';
import { CensusCloseJob } from './census-close.job';

/** F3 de infraestructura: cierre programado del censo diario de internación. */
@Module({
  providers: [CensusCloseJob],
})
export class ClinicalWorkerModule {}
