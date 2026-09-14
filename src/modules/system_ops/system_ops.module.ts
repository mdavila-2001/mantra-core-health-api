import { Module } from '@nestjs/common';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
import { IdentityEvidenceLifecycleModule } from '../identity_assurance/identity-evidence-lifecycle.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  GovernanceCatalogController,
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
  RetentionExecutionService,
  ResidencyService,
  LegalHoldService,
  BackupService,
  AssessmentService,
  DraftService,
} from './services';
import {
  GovernanceRepository,
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
    RetentionExecutionRepository,
    ResidencyRepository,
    LegalHoldRepository,
    BackupRepository,
    AssessmentRepository,
    DraftRepository,
    SystemOpsSecurityRepository,
    // Servicios
    GovernanceCatalogService,
    RetentionExecutionService,
    ResidencyService,
    LegalHoldService,
    BackupService,
    AssessmentService,
    DraftService,
  ],
})
export class SystemOpsModule {}
