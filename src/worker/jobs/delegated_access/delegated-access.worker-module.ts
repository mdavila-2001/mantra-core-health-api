import { Module } from '@nestjs/common';
import { ExpirySweepJob } from './expiry-sweep.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `delegated_access` (UC-29-08).
 */
@Module({
  providers: [ExpirySweepJob],
})
export class DelegatedAccessWorkerModule {}
