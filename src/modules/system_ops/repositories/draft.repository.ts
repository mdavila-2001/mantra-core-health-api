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
  findById(em: EntityManager, id: string): Promise<DraftRecords | null> {
    return em.findOne(DraftRecords, { id });
  }

  create(
    em: EntityManager,
    data: {
      schemaName: string;
      tableName: string;
      targetRecordId?: string;
      ownerUserId: string;
      tenantId?: string;
      draftLabel?: string;
      payloadJson: unknown;
      statusConceptId: string;
      schemaVersion?: number;
      expiresAt?: Date;
      actorUserId?: string;
    },
  ): DraftRecords {
    const { actorUserId, ...rest } = data;
    return em.create(DraftRecords, { ...rest, ...createdBy(actorUserId) }, { partial: true });
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
      { ...data, recordedAt: new Date(), recordedByUserId: data.changedByUserId },
      { partial: true },
    );
  }
}
