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
  /**
   * Crea create execution.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create execution conforme al contrato `RetentionExecutions`.
   */
  createExecution(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a retention policy.
       */
      retentionPolicyId: string;
      /**
       * Identificador asociado a entity registry.
       */
      entityRegistryId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): RetentionExecutions {
    return em.create(
      RetentionExecutions,
      { ...data, recordedAt: new Date() },
      { partial: true },
    );
  }

  /**
   * Crea create revision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create revision conforme al contrato `RecordRevisions`.
   */
  createRevision(
    em: EntityManager,
    data: {
      /**
       * Valor de schema name mantenido por la instancia.
       */
      schemaName: string;
      /**
       * Valor de table name mantenido por la instancia.
       */
      tableName: string;
      /**
       * Identificador asociado a record.
       */
      recordId: string;
      /**
       * Identificador asociado a operation concept.
       */
      operationConceptId: string;
      /**
       * Valor de data snapshot mantenido por la instancia.
       */
      dataSnapshot: unknown;
      /**
       * Identificador asociado a changed by user.
       */
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
