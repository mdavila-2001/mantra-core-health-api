import { Module } from '@nestjs/common';
import { AdmissionsExpireSweepJob } from './admissions-expire-sweep.job';

/**
 * Worker de `profiles`: barrido de vencimientos y abandonos de las admisiones
 * de profesionales (alta de doctor).
 */
@Module({
  providers: [AdmissionsExpireSweepJob],
})
export class ProfilesWorkerModule {}
