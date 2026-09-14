import { Module } from '@nestjs/common';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
import { GovernanceRepository } from '../system_ops/repositories/governance.repository';
import { LegalHoldRepository } from '../system_ops/repositories/legal-hold.repository';
import { RetentionExecutionRepository } from '../system_ops/repositories/retention-execution.repository';
import { IdentityEvidenceHoldResolver } from '../system_ops/services/identity-evidence-hold-resolver.service';
import {
  IDENTITY_LIFECYCLE_CONFIG,
  IdentityLifecycleConfigResolver,
  loadIdentityLifecycleConfig,
} from './identity-evidence-lifecycle.config';
import { IdentityEvidenceEligibilityService } from './services/identity-evidence-eligibility.service';
import { IdentityEvidenceLifecycleRepository } from './repositories/identity-evidence-lifecycle.repository';
import { IdentityEvidenceDispositionExecutor } from './services/identity-evidence-disposition.executor';
import { IdentityEvidenceLifecycleService } from './services/identity-evidence-lifecycle.service';
import { IdentityEvidenceDispositionRepository } from './repositories/identity-evidence-disposition.repository';
import { IdentityEvidenceStoragePurgeService } from './services/identity-evidence-storage-purge.service';

/** Shared strategy module avoids a circular dependency on the system_ops controller module. */
@Module({
  imports: [StorageLifecycleModule],
  providers: [
    {
      provide: IDENTITY_LIFECYCLE_CONFIG,
      useFactory: loadIdentityLifecycleConfig,
    },
    GovernanceRepository,
    LegalHoldRepository,
    RetentionExecutionRepository,
    IdentityEvidenceHoldResolver,
    IdentityLifecycleConfigResolver,
    IdentityEvidenceEligibilityService,
    IdentityEvidenceLifecycleRepository,
    IdentityEvidenceDispositionExecutor,
    IdentityEvidenceLifecycleService,
    IdentityEvidenceDispositionRepository,
    IdentityEvidenceStoragePurgeService,
  ],
  exports: [
    IdentityEvidenceLifecycleService,
    IdentityEvidenceStoragePurgeService,
  ],
})
export class IdentityEvidenceLifecycleModule {}
