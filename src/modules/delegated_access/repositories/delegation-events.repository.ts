import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegationEvents } from '../entities';

/** Un asiento del ledger append-only de delegación. */
export interface RecordEventData {
  /**
   * Identificador asociado a practitioner delegate assignment.
   */
  practitionerDelegateAssignmentId: string;
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
  /**
   * Identificador asociado a target user.
   */
  targetUserId?: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de previous state hash mantenido por la instancia.
   */
  previousStateHash?: string;
  /**
   * Valor de new state hash mantenido por la instancia.
   */
  newStateHash?: string;
}

/**
 * Acceso a datos de `delegated_access.delegation_events`. Es un ledger append-only:
 * solo se insertan asientos (nunca update/delete).
 */
@Injectable()
export class DelegationEventsRepository {
  /**
   * Ejecuta la operación record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record conforme al contrato `DelegationEvents`.
   */
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
