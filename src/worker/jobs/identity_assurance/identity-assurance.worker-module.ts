import { Module } from '@nestjs/common';
import { ExpireSweepJob } from './expire-sweep.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `identity_assurance` (UC-27-12).
 */
@Module({
  providers: [ExpireSweepJob],
})
export class IdentityAssuranceWorkerModule {}
