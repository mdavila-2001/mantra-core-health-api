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
import {
  CreateBackupPolicyDto,
  CreateRestoreTestRunDto,
  IdResultDto,
  RestoreTestRunResponseDto,
} from '../dto';
import {
  RestoreObjectiveStatus,
  evaluarRestauracion,
  validarObjetivosDeContinuidad,
} from '../policies';
import { SYSOPS } from '../system_ops.concepts';

/**
 * UC-11-09 (política de backup con RPO/RTO/inmutabilidad) y UC-11-10 (prueba de
 * restauración con evidencia). La prueba compara RPO/RTO medidos contra el
 * objetivo de la política y señala un breach (RULE: un backup completo no basta).
 */
@Injectable()
export class BackupService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: BackupRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BackupService.name);
  }

  /**
   * UC-11-09: define una política de backup.
   *
   * MCH-022: cada objetivo se valida contra **su propio** rango. RPO y RTO
   * miden dimensiones distintas y no se comparan entre sí: `RPO=3600` con
   * `RTO=900` es una política legítima («tolero perder una hora de datos, pero
   * exijo estar arriba en quince minutos»). Los rangos y sus motivos viven en
   * `policies/continuity-objectives.policy.ts`.
   */
  async createPolicy(
    dto: CreateBackupPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    const fueraDeRango = validarObjetivosDeContinuidad(dto);
    if (fueraDeRango.length > 0) {
      throw new PreconditionFailedException(
        fueraDeRango.map((v) => v.mensaje).join('; '),
        Object.fromEntries(fueraDeRango.map((v) => [v.campo, v.valor])),
      );
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
      this.logger.info(
        { operation: 'sysops.backup.policy', policyId: policy.id },
        'Backup policy defined',
      );
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
        throw new ResourceNotFoundException(
          'Política de backup no encontrada',
          {
            backupPolicyId: dto.backupPolicyId,
          },
        );
      }
      if (policy.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La política de backup no está ACTIVE',
          {
            backupPolicyId: dto.backupPolicyId,
          },
        );
      }

      // MCH-023: la evaluación es trivalente. Sin las mediciones que la
      // política exige el resultado es NOT_MEASURED — desconocido, nunca
      // aprobado — y un fallo informado no se revierte por omitir métricas.
      const evaluacion = evaluarRestauracion(policy, {
        measuredRpoSeconds: dto.measuredRpoSeconds,
        measuredRtoSeconds: dto.measuredRtoSeconds,
        integrityCheckPassed: dto.integrityCheckPassed,
        reportedFailure: dto.outcomeConceptId === SYSOPS.RESTORE_OUTCOME_FAIL,
      });
      const objectiveBreached =
        evaluacion.status === RestoreObjectiveStatus.FAILED;

      const run = this.repo.createTestRun(tx, {
        objectiveStatus: evaluacion.status,
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
      if (evaluacion.status !== RestoreObjectiveStatus.PASSED) {
        this.logger.warn(
          {
            operation: 'sysops.backup.restore-test',
            runId: run.id,
            objectiveStatus: evaluacion.status,
            motivo: evaluacion.motivo,
          },
          evaluacion.status === RestoreObjectiveStatus.FAILED
            ? 'Restore objective breached'
            : 'Restore objective not measured',
        );
      }
      return {
        id: run.id,
        outcomeConceptId: run.outcomeConceptId,
        objectiveStatus: evaluacion.status,
        objectiveStatusReason: evaluacion.motivo,
        objectiveBreached,
      };
    });
  }
}
