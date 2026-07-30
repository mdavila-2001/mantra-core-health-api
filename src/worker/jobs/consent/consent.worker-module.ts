import { Module } from '@nestjs/common';
import { ExpirationSweepJob } from './expiration-sweep.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `consent` (UC-07-11).
 */
@Module({
  providers: [ExpirationSweepJob],
})
export class ConsentWorkerModule {}
