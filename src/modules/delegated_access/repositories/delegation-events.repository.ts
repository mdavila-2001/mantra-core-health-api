import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegationEvents } from '../entities';

/** Un asiento del ledger append-only de delegación. */
export interface RecordEventData {
  practitionerDelegateAssignmentId: string;
  eventTypeConceptId: string;
  actorUserId?: string;
  targetUserId?: string;
  reasonConceptId?: string;
  previousStateHash?: string;
  newStateHash?: string;
}

/**
 * Acceso a datos de `delegated_access.delegation_events`. Es un ledger append-only:
 * solo se insertan asientos (nunca update/delete).
 */
@Injectable()
export class DelegationEventsRepository {
  record(em: EntityManager, data: RecordEventData): DelegationEvents {
    const now = new Date();
    return em.create(
      DelegationEvents,
      {
        practitionerDelegateAssignmentId: data.practitionerDelegateAssignmentId,
        eventTypeConceptId: data.eventTypeConceptId,
        actorUserId: data.actorUserId,
        targetUserId: data.targetUserId,
        reasonConceptId: data.reasonConceptId,
        previousStateHash: data.previousStateHash,
        newStateHash: data.newStateHash,
        occurredAt: now,
        createdAt: now,
      },
      { partial: true },
    );
  }
}
