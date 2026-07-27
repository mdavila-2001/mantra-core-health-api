import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LegalHolds, RecordRevisions, RetentionExecutions } from '../entities';
import { CONCEPTS } from '../../../common';

/**
 * Acceso a datos del barrido de retención (UC-11-05): la ejecución en sí, las
 * revisiones append-only por fila afectada y la verificación de legal holds
 * activos que excluyen objetivos del barrido.
 */
@Injectable()
export class RetentionExecutionRepository {
  createExecution(
    em: EntityManager,
    data: {
      retentionPolicyId: string;
      entityRegistryId?: string;
      statusConceptId: string;
      startedAt: Date;
      recordedByUserId?: string;
    },
  ): RetentionExecutions {
    return em.create(
      RetentionExecutions,
      { ...data, recordedAt: new Date() },
      { partial: true },
    );
  }

  createRevision(
    em: EntityManager,
    data: {
      schemaName: string;
      tableName: string;
      recordId: string;
      operationConceptId: string;
      dataSnapshot: unknown;
      changedByUserId?: string;
    },
  ): RecordRevisions {
    return em.create(
      RecordRevisions,
      {
        ...data,
        recordedAt: new Date(),
        recordedByUserId: data.changedByUserId,
      },
      { partial: true },
    );
  }

  /** Cuenta holds ACTIVE sobre un objetivo (para excluirlo del barrido). */
  countActiveHoldsForTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<number> {
    return em.count(LegalHolds, {
      targetId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }
}
