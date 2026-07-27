import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly em: EntityManager,
    private readonly repo: RetentionExecutionRepository,
    private readonly governanceRepo: GovernanceRepository,
    private readonly logger: PinoLogger,
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

  private dispositionToOperation(dispositionConceptId?: string): string {
    if (dispositionConceptId === SYSOPS.DISPOSITION_DELETE)
      return SYSOPS.OP_DELETE;
    if (dispositionConceptId === SYSOPS.DISPOSITION_ANONYMIZE)
      return SYSOPS.OP_ANONYMIZE;
    return SYSOPS.OP_UPDATE;
  }

  private toResponse(
    e: {
      id: string;
      statusConceptId: string;
      totalScanned?: string;
      totalDeleted?: string;
      totalAnonymized?: string;
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
