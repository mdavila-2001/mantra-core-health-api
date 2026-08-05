import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DraftRecords, RecordRevisions } from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos de borradores genéricos (UC-11-15): guardar el borrador y, al
 * publicar, registrar una revisión append-only del registro materializado.
 */
@Injectable()
export class DraftRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DraftRecords | null>`.
   */
  findById(em: EntityManager, id: string): Promise<DraftRecords | null> {
    return em.findOne(DraftRecords, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DraftRecords`.
   */
  create(
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
       * Identificador asociado a target record.
       */
      targetRecordId?: string;
      /**
       * Identificador asociado a owner user.
       */
      ownerUserId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de draft label mantenido por la instancia.
       */
      draftLabel?: string;
      /**
       * Valor de payload json mantenido por la instancia.
       */
      payloadJson: unknown;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de schema version mantenido por la instancia.
       */
      schemaVersion?: number;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): DraftRecords {
    const { actorUserId, ...rest } = data;
    return em.create(
      DraftRecords,
      { ...rest, ...createdBy(actorUserId) },
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
}
