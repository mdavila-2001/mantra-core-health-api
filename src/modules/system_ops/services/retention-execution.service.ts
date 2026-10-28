import { Inject, Injectable, Optional } from '@nestjs/common';
import { IdentityEvidenceLifecycleService } from '../../identity_assurance/services/identity-evidence-lifecycle.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  GovernanceRepository,
  RetentionExecutionRepository,
} from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import { SystemOpsErrorReason } from '../system_ops.error-reasons';
import { RetentionExecutionResponseDto, RunRetentionDto } from '../dto';
import {
  RETENTION_DISPOSITION_EXECUTORS,
  type RetentionDisposition,
  type RetentionDispositionExecutor,
} from './retention-disposition.executor';

/** Filas por lote si la solicitud no pide un tope. */
const DEFAULT_BATCH_SIZE = 500;
/** Tope duro de un lote: una transacción de retención no debe crecer sin límite. */
const MAX_BATCH_SIZE = 5_000;
const MS_PER_DAY = 86_400_000;

/** Disposición de la política → disposición del adaptador. */
const DISPOSITION_BY_CONCEPT: Readonly<Record<string, RetentionDisposition>> = {
  [SYSOPS.DISPOSITION_DELETE]: 'DELETE',
  [SYSOPS.DISPOSITION_ANONYMIZE]: 'ANONYMIZE',
  [SYSOPS.DISPOSITION_ARCHIVE]: 'ARCHIVE',
};

/** Disposición → operación que queda en la revisión append-only. */
const OPERATION_BY_DISPOSITION: Readonly<Record<RetentionDisposition, string>> =
  {
    DELETE: SYSOPS.OP_DELETE,
    ANONYMIZE: SYSOPS.OP_ANONYMIZE,
    ARCHIVE: SYSOPS.OP_UPDATE,
  };

/**
 * UC-11-05: ejecuta un barrido de retención sobre una entidad objetivo.
 *
 * Precondiciones (RULE): la política debe estar ACTIVE y **los objetivos con
 * legal holds ACTIVE se excluyen** del barrido (include UC-11-08). Cada corrida
 * queda registrada en `retention_executions`; las filas afectadas se auditan en
 * `record_revisions` (append-only, con el `recordId` de la fila afectada).
 *
 * El barrido no conoce las tablas de negocio: cada entidad se dispone mediante
 * su `RetentionDispositionExecutor` (selección paginada de filas vencidas y
 * disposición por fila, en la transacción del lote). La identidad
 * (`identity_assurance.identity_evidence_records`) conserva su camino
 * especializado. Una entidad sin adaptador se rechaza con
 * `SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED` y no deja una ejecución `SUCCEEDED`.
 */
@Injectable()
export class RetentionExecutionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param governanceRepo - Valor de governance repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: RetentionExecutionRepository,
    private readonly governanceRepo: GovernanceRepository,
    private readonly logger: PinoLogger,
    @Optional()
    private readonly identityLifecycle?: IdentityEvidenceLifecycleService,
    @Optional()
    @Inject(RETENTION_DISPOSITION_EXECUTORS)
    private readonly executors: readonly RetentionDispositionExecutor[] = [],
  ) {
    this.logger.setContext(RetentionExecutionService.name);
  }

  /** UC-11-05: corre el barrido de retención de forma transaccional. */
  async run(
    dto: RunRetentionDto,
    actor: AuthenticatedUser,
  ): Promise<RetentionExecutionResponseDto> {
    this.logger.info(
      {
        operation: 'sysops.retention.run',
        policyId: dto.retentionPolicyId,
        entityId: dto.entityRegistryId,
      },
      'Running retention sweep',
    );
    return this.em.transactional(async (tx) => {
      const policy = await this.governanceRepo.findRetentionPolicyById(
        tx,
        dto.retentionPolicyId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de retención no encontrada',
          {
            retentionPolicyId: dto.retentionPolicyId,
          },
        );
      }
      if (policy.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La política de retención no está ACTIVE',
          {
            retentionPolicyId: dto.retentionPolicyId,
          },
        );
      }
      const entity = await this.governanceRepo.findEntityById(
        tx,
        dto.entityRegistryId,
      );
      if (!entity) {
        throw new ResourceNotFoundException('Entidad objetivo no encontrada', {
          entityRegistryId: dto.entityRegistryId,
        });
      }

      const isIdentityEvidence =
        entity.schemaName === 'identity_assurance' &&
        entity.tableName === 'identity_evidence_records';
      const executor = isIdentityEvidence
        ? undefined
        : this.executors.find((candidate) =>
            candidate.supports(entity.schemaName, entity.tableName),
          );
      if (!isIdentityEvidence && !executor) {
        // Sin adaptador no hay forma de seleccionar ni disponer filas: informar
        // éxito con contadores en cero haría pasar por cumplida una retención
        // que no ocurrió. Se rechaza antes de abrir la ejecución.
        this.logger.warn(
          {
            operation: 'sysops.retention.run',
            entityId: entity.id,
            entity: `${entity.schemaName}.${entity.tableName}`,
          },
          'Retention sweep rejected: entity has no registered executor',
        );
        throw new PreconditionFailedException(
          'La entidad no tiene un ejecutor de retención registrado',
          { entityRegistryId: entity.id },
          SystemOpsErrorReason.SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED,
        );
      }

      const disposition = executor
        ? DISPOSITION_BY_CONCEPT[policy.dispositionConceptId ?? '']
        : undefined;
      if (
        executor &&
        (!disposition ||
          !policy.retentionPeriodDays ||
          policy.retentionPeriodDays < 1)
      ) {
        throw new PreconditionFailedException(
          'La política de retención no declara plazo y disposición ejecutables',
          { retentionPolicyId: policy.id },
          SystemOpsErrorReason.SYSOPS_RETENTION_POLICY_INCOMPLETE,
        );
      }

      const execution = this.repo.createExecution(tx, {
        retentionPolicyId: policy.id,
        entityRegistryId: entity.id,
        statusConceptId: SYSOPS.EXEC_RUNNING,
        startedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();

      if (isIdentityEvidence) {
        if (!this.identityLifecycle)
          throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
        const result = await this.identityLifecycle.scan(
          undefined,
          policy.code,
        );
        execution.statusConceptId = SYSOPS.EXEC_SUCCEEDED;
        execution.finishedAt = new Date();
        execution.totalScanned = String(result.scanned);
        execution.totalDeleted = '0';
        execution.totalAnonymized = '0';
        execution.totalArchived = '0';
        execution.errorText = result.boundary
          ? 'DESTRUCTIVE_RUNTIME_GATE_BLOCKED'
          : undefined;
        return this.toResponse(execution, false);
      }

      // Include UC-11-08: excluir objetivos bajo legal hold ACTIVE.
      const activeHolds = await this.repo.countActiveHoldsForTarget(
        tx,
        entity.id,
      );
      if (activeHolds > 0) {
        execution.statusConceptId = SYSOPS.EXEC_SUCCEEDED;
        execution.finishedAt = new Date();
        execution.totalScanned = '0';
        execution.totalDeleted = '0';
        execution.totalAnonymized = '0';
        execution.totalArchived = '0';
        execution.errorText = 'Skipped: target under active legal hold';
        this.logger.warn(
          { operation: 'sysops.retention.run', entityId: entity.id },
          'Retention sweep skipped due to active legal hold',
        );
        return this.toResponse(execution, true);
      }

      return this.sweepBatch(
        tx,
        execution,
        executor as RetentionDispositionExecutor,
        disposition as RetentionDisposition,
        {
          schemaName: entity.schemaName,
          tableName: entity.tableName,
          retentionPeriodDays: policy.retentionPeriodDays as number,
          dto,
          actor,
        },
      );
    });
  }

  /**
   * Barre UN lote: selecciona filas vencidas, descarta las que están bajo legal
   * hold, dispone el resto y deja una revisión por fila afectada. Los contadores
   * y el estado se fijan al terminar el lote, en la misma transacción.
   */
  private async sweepBatch(
    tx: EntityManager,
    execution: {
      statusConceptId: string;
      finishedAt?: Date;
      totalScanned?: string;
      totalDeleted?: string;
      totalAnonymized?: string;
      totalArchived?: string;
      id: string;
    },
    executor: RetentionDispositionExecutor,
    disposition: RetentionDisposition,
    context: {
      schemaName: string;
      tableName: string;
      retentionPeriodDays: number;
      dto: RunRetentionDto;
      actor: AuthenticatedUser;
    },
  ): Promise<RetentionExecutionResponseDto> {
    const { dto, actor } = context;
    const limit = Math.min(
      dto.maxBatchSize ?? DEFAULT_BATCH_SIZE,
      MAX_BATCH_SIZE,
    );
    const cutoff = new Date(
      Date.now() - context.retentionPeriodDays * MS_PER_DAY,
    );

    // Se pide una fila de más sólo para saber si el lote dejó pendientes.
    const found = await executor.selectExpired(tx, {
      schemaName: context.schemaName,
      tableName: context.tableName,
      cutoff,
      limit: limit + 1,
      afterId: dto.cursor,
      tenantId: this.sweepTenant(actor),
    });
    const batch = found.slice(0, limit);
    const hasMore = found.length > limit;

    let disposed = 0;
    let held = 0;
    for (const record of batch) {
      if ((await this.repo.countActiveHoldsForTarget(tx, record.id)) > 0) {
        held += 1;
        continue;
      }
      await executor.dispose(tx, disposition, record);
      this.repo.createRevision(tx, {
        schemaName: context.schemaName,
        tableName: context.tableName,
        recordId: record.id,
        operationConceptId: OPERATION_BY_DISPOSITION[disposition],
        dataSnapshot: {
          sweep: 'retention',
          executionId: execution.id,
          disposition,
          retentionPeriodDays: context.retentionPeriodDays,
        },
        changedByUserId: actor.id,
      });
      disposed += 1;
    }

    execution.statusConceptId = SYSOPS.EXEC_SUCCEEDED;
    execution.finishedAt = new Date();
    execution.totalScanned = String(batch.length);
    execution.totalDeleted = String(disposition === 'DELETE' ? disposed : 0);
    execution.totalAnonymized = String(
      disposition === 'ANONYMIZE' ? disposed : 0,
    );
    execution.totalArchived = String(disposition === 'ARCHIVE' ? disposed : 0);

    return {
      ...this.toResponse(execution, false),
      totalHeld: held,
      hasMore,
      nextCursor: hasMore ? batch[batch.length - 1]?.id : undefined,
    };
  }

  /**
   * Tenant al que se acota el barrido: el del contexto si lo hay; sin tenant,
   * sólo `SYSTEM` como rol global barre todos; cualquier otro actor sin tenant
   * se rechaza (`TENANT_REQUIRED`). Nunca `roles.includes('SYSTEM')`: un
   * `SYSTEM` concedido con ámbito de tenant no es un barrido global.
   */
  private sweepTenant(actor: AuthenticatedUser): string | undefined {
    const tenantId = getCurrentTenantId();
    if (tenantId) return tenantId;
    if (roleAuthorizesInTenant(actor, 'SYSTEM', undefined)) return undefined;
    return requireTenantId();
  }

  /**
   * Transforma to response.
   *
   * @param e - Valor de e requerido por la operación.
   * @param blocked - Valor de blocked requerido por la operación.
   * @returns Resultado de to response conforme al contrato `RetentionExecutionResponseDto`.
   */
  private toResponse(
    e: {
      /**
       * Identificador único de la instancia.
       */
      id: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de total scanned mantenido por la instancia.
       */
      totalScanned?: string;
      /**
       * Valor de total deleted mantenido por la instancia.
       */
      totalDeleted?: string;
      /**
       * Valor de total anonymized mantenido por la instancia.
       */
      totalAnonymized?: string;
      /**
       * Valor de total archived mantenido por la instancia.
       */
      totalArchived?: string;
    },
    blocked: boolean,
  ): RetentionExecutionResponseDto {
    return {
      id: e.id,
      statusConceptId: e.statusConceptId,
      totalScanned: Number(e.totalScanned ?? 0),
      totalDeleted: Number(e.totalDeleted ?? 0),
      totalAnonymized: Number(e.totalAnonymized ?? 0),
      totalArchived: Number(e.totalArchived ?? 0),
      blockedByLegalHold: blocked,
    };
  }
}
