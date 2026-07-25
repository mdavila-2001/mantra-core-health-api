import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BackupPolicies, RestoreTestRuns } from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos de políticas de backup (UC-11-09) y pruebas de restauración
 * append-only (UC-11-10).
 */
@Injectable()
export class BackupRepository {
  findPolicyById(em: EntityManager, id: string): Promise<BackupPolicies | null> {
    return em.findOne(BackupPolicies, { id });
  }

  findActivePolicyByScope(
    em: EntityManager,
    tenantId: string,
    resourceScopeConceptId: string,
    statusConceptId: string,
  ): Promise<BackupPolicies | null> {
    return em.findOne(BackupPolicies, { tenantId, resourceScopeConceptId, statusConceptId });
  }

  createPolicy(
    em: EntityManager,
    data: {
      tenantId: string;
      resourceScopeConceptId: string;
      backupTypeConceptId: string;
      rpoSeconds: number;
      rtoSeconds: number;
      retentionDays?: number;
      immutableCopyRequired?: boolean;
      encryptionRequired?: boolean;
      restoreTestFrequencyDays?: number;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): BackupPolicies {
    const { actorUserId, ...rest } = data;
    return em.create(BackupPolicies, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }

  createTestRun(
    em: EntityManager,
    data: {
      backupPolicyId: string;
      backupReference?: string;
      outcomeConceptId: string;
      measuredRpoSeconds?: number;
      measuredRtoSeconds?: number;
      integrityCheckPassed?: boolean;
      evidenceFileId?: string;
      startedAt: Date;
      finishedAt?: Date;
      recordedByUserId?: string;
    },
  ): RestoreTestRuns {
    return em.create(RestoreTestRuns, { ...data }, { partial: true });
  }
}
