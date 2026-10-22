import { Injectable, Optional } from '@nestjs/common';
import { IdentityEvidenceLifecycleService } from '../../identity_assurance/services/identity-evidence-lifecycle.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  GovernanceRepository,
  RetentionExecutionRepository,
} from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import { RetentionExecutionResponseDto, RunRetentionDto } from '../dto';

/**
 * UC-11-05: ejecuta un barrido de retención sobre una entidad objetivo.
 *
 * Precondiciones (RULE): la política debe estar ACTIVE y **los objetivos con
 * legal holds ACTIVE se excluyen** del barrido (include UC-11-08). Cada corrida
 * queda registrada en `retention_executions`; las filas afectadas se auditan en
 * `record_revisions` (append-only). Aquí el barrido no materializa borrados de
 * tablas de negocio (eso lo hace el worker por lote): registra la corrida, la
 * disposición aplicada y respeta el hold.
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

      const execution = this.repo.createExecution(tx, {
        retentionPolicyId: policy.id,
        entityRegistryId: entity.id,
        statusConceptId: SYSOPS.EXEC_RUNNING,
        startedAt: new Date(),
        recordedByUserId: actor.id,
      });
      await tx.flush();

      if (
        entity.schemaName === 'identity_assurance' &&
        entity.tableName === 'identity_evidence_records'
      ) {
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

      // Barrido: mapea la disposición de la política a la operación de revisión.
      const operationConceptId = this.dispositionToOperation(
        policy.dispositionConceptId,
      );
      this.repo.createRevision(tx, {
        schemaName: entity.schemaName,
        tableName: entity.tableName,
        recordId: entity.id,
        operationConceptId,
        dataSnapshot: {
          sweep: 'retention',
          disposition: policy.dispositionConceptId,
          retentionPeriodDays: policy.retentionPeriodDays,
        },
        changedByUserId: actor.id,
      });

      execution.statusConceptId = SYSOPS.EXEC_SUCCEEDED;
      execution.finishedAt = new Date();
      execution.totalScanned = '0';
      execution.totalDeleted =
        operationConceptId === SYSOPS.OP_DELETE ? '0' : '0';
      execution.totalAnonymized = '0';
      execution.totalArchived = '0';
      return this.toResponse(execution, false);
    });
  }

  /**
   * Ejecuta la operación disposition to operation.
   *
   * @param dispositionConceptId - Identificador de disposition concept.
   * @returns Resultado de disposition to operation conforme al contrato `string`.
   */
  private dispositionToOperation(dispositionConceptId?: string): string {
    if (dispositionConceptId === SYSOPS.DISPOSITION_DELETE)
      return SYSOPS.OP_DELETE;
    if (dispositionConceptId === SYSOPS.DISPOSITION_ANONYMIZE)
      return SYSOPS.OP_ANONYMIZE;
    return SYSOPS.OP_UPDATE;
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
