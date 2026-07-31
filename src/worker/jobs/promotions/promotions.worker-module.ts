import { Module } from '@nestjs/common';
import { ExpirePointsJob } from './expire-points.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `promotions` (UC-51-06).
 */
@Module({
  providers: [ExpirePointsJob],
})
export class PromotionsWorkerModule {}
