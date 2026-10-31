import { Module } from '@nestjs/common';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
import { IdentityEvidenceLifecycleModule } from '../identity_assurance/identity-evidence-lifecycle.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  GovernanceCatalogController,
  GovernanceReadController,
  GovernanceOperationsReadController,
  RetentionExecutionController,
  ResidencyController,
  LegalHoldController,
  BackupController,
  RestoreTestController,
  AssessmentController,
  DraftController,
} from './controllers';
import {
  GovernanceCatalogService,
  GovernanceReadService,
  GovernanceOperationsReadService,
  RetentionExecutionService,
  ResidencyService,
  LegalHoldService,
  BackupService,
  AssessmentService,
  DraftService,
  RETENTION_DISPOSITION_EXECUTORS,
} from './services';
import {
  GovernanceRepository,
  GovernanceReadRepository,
  GovernanceOperationsReadRepository,
  RetentionExecutionRepository,
  ResidencyRepository,
  LegalHoldRepository,
  BackupRepository,
  AssessmentRepository,
  DraftRepository,
  SystemOpsSecurityRepository,
} from './repositories';

/**
 * Módulo system_ops (11): gobierno de datos y operaciones de sistema. Cataloga
 * entidades y campos, define políticas (escritura, retención, anonimización,
 * residencia, backup), registra transferencias transfronterizas y legal holds,
 * ejecuta barridos de retención, gestiona frameworks/evaluaciones/remediación y
 * publica drafts genéricos. Guard global de auth; `AuthModule` provee el token.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    StorageLifecycleModule,
    IdentityEvidenceLifecycleModule,
  ],
  controllers: [
    GovernanceCatalogController,
    GovernanceReadController,
    GovernanceOperationsReadController,
    RetentionExecutionController,
    ResidencyController,
    LegalHoldController,
    BackupController,
    RestoreTestController,
    AssessmentController,
    DraftController,
  ],
  providers: [
    // Repositorios
    GovernanceRepository,
    GovernanceReadRepository,
    GovernanceOperationsReadRepository,
    RetentionExecutionRepository,
    ResidencyRepository,
    LegalHoldRepository,
    BackupRepository,
    AssessmentRepository,
    DraftRepository,
    SystemOpsSecurityRepository,
    // Adaptadores de disposición de retención por entidad registrada. Hoy ninguna
    // entidad de negocio tiene uno (la identidad usa su camino especializado):
    // el barrido rechaza lo que no tiene adaptador. Cada adaptador nuevo se
    // añade aquí como `useClass` con `multi` o se concentra en esta lista.
    { provide: RETENTION_DISPOSITION_EXECUTORS, useValue: [] },
    // Servicios
    GovernanceCatalogService,
    GovernanceReadService,
    GovernanceOperationsReadService,
    RetentionExecutionService,
    ResidencyService,
    LegalHoldService,
    BackupService,
    AssessmentService,
    DraftService,
  ],
})
export class SystemOpsModule {}
