import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { BackupRepository } from '../repositories';
import { CreateBackupPolicyDto, CreateRestoreTestRunDto, IdResultDto, RestoreTestRunResponseDto } from '../dto';

/**
 * UC-11-09 (política de backup con RPO/RTO/inmutabilidad) y UC-11-10 (prueba de
 * restauración con evidencia). La prueba compara RPO/RTO medidos contra el
 * objetivo de la política y señala un breach (RULE: un backup completo no basta).
 */
@Injectable()
export class BackupService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: BackupRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BackupService.name);
  }

  /** UC-11-09: define una política de backup (RPO <= RTO, valores positivos). */
  async createPolicy(dto: CreateBackupPolicyDto, actor: AuthenticatedUser): Promise<IdResultDto> {
    if (dto.rpoSeconds > dto.rtoSeconds) {
      throw new PreconditionFailedException('El RPO no puede superar al RTO', {
        rpoSeconds: dto.rpoSeconds,
        rtoSeconds: dto.rtoSeconds,
      });
    }
    return this.em.transactional(async (tx) => {
      const policy = this.repo.createPolicy(tx, {
        tenantId: dto.tenantId,
        resourceScopeConceptId: dto.resourceScopeConceptId,
        backupTypeConceptId: dto.backupTypeConceptId,
        rpoSeconds: dto.rpoSeconds,
        rtoSeconds: dto.rtoSeconds,
        retentionDays: dto.retentionDays,
        immutableCopyRequired: dto.immutableCopyRequired,
        encryptionRequired: dto.encryptionRequired,
        restoreTestFrequencyDays: dto.restoreTestFrequencyDays,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info({ operation: 'sysops.backup.policy', policyId: policy.id }, 'Backup policy defined');
      return { id: policy.id };
    });
  }

  /** UC-11-10: registra una prueba de restauración (append-only, con breach). */
  async recordRestoreTest(
    dto: CreateRestoreTestRunDto,
    actor: AuthenticatedUser,
  ): Promise<RestoreTestRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const policy = await this.repo.findPolicyById(tx, dto.backupPolicyId);
      if (!policy) {
        throw new ResourceNotFoundException('Política de backup no encontrada', {
          backupPolicyId: dto.backupPolicyId,
        });
      }
      if (policy.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La política de backup no está ACTIVE', {
          backupPolicyId: dto.backupPolicyId,
        });
      }

      const objectiveBreached =
        (dto.measuredRpoSeconds !== undefined &&
          policy.rpoSeconds !== undefined &&
          dto.measuredRpoSeconds > policy.rpoSeconds) ||
        (dto.measuredRtoSeconds !== undefined &&
          policy.rtoSeconds !== undefined &&
          dto.measuredRtoSeconds > policy.rtoSeconds);

      const run = this.repo.createTestRun(tx, {
        backupPolicyId: policy.id,
        backupReference: dto.backupReference,
        outcomeConceptId: dto.outcomeConceptId,
        measuredRpoSeconds: dto.measuredRpoSeconds,
        measuredRtoSeconds: dto.measuredRtoSeconds,
        integrityCheckPassed: dto.integrityCheckPassed,
        evidenceFileId: dto.evidenceFileId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        finishedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();
      if (objectiveBreached) {
        this.logger.warn(
          { operation: 'sysops.backup.restore-test', runId: run.id },
          'Restore objective breached',
        );
      }
      return { id: run.id, outcomeConceptId: run.outcomeConceptId, objectiveBreached };
    });
  }
}
