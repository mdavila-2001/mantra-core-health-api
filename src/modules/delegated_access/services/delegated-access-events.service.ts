import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/** Eventos del acceso delegado por espacio (CONTRATO-F2-F5 F5g; `asyncapi/fragments/f5ops.yaml`). */
export const DELEGATED_ACCESS_EVENTS = {
  /** Una asignación de usuario cambió de alcance, de rol o de estado. */
  scopeChanged: 'delegated_access.assignment.scope_changed',
} as const;

/** Qué le pasó a la asignación. */
export type AssignmentChange =
  'CREATED' | 'RETARGETED' | 'SUPERVISOR_CHANGED' | 'SUSPENDED';

/** Hecho a publicar. */
export interface AssignmentScopeChangedEvent {
  readonly tenantId: string;
  readonly assignmentId: string;
  readonly actorUserId: string;
  readonly change: AssignmentChange;
  /** Versión de la fila resultante: distingue dos cambios seguidos de la misma asignación. */
  readonly rowVersion: number;
  readonly roleCode: string;
  readonly from: AssignmentScopeSnapshot | null;
  readonly to: AssignmentScopeSnapshot;
}

/** Alcance de una asignación en un instante: ids y códigos, nunca nombres de personas. */
export interface AssignmentScopeSnapshot {
  readonly scope: string;
  readonly practiceId: string | null;
  readonly practiceSiteId: string | null;
  readonly clinicalUnitId: string | null;
  readonly careSpaceId: string | null;
  readonly status: 'ACTIVE' | 'SUSPENDED';
}

/**
 * Publica los cambios de alcance al outbox **dentro de la transacción** de la
 * mutación: el cambio y su evento se confirman juntos o ninguno.
 */
@Injectable()
export class DelegatedAccessEventsService {
  /**
   * @param outbox - Outbox transaccional de mensajería.
   */
  constructor(private readonly outbox: OutboxService) {}

  /**
   * Encola `delegated_access.assignment.scope_changed`.
   *
   * @param tx - Transacción de la mutación.
   * @param event - El hecho.
   */
  async scopeChanged(
    tx: EntityManager,
    event: AssignmentScopeChangedEvent,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: DELEGATED_ACCESS_EVENTS.scopeChanged,
      aggregateType: 'delegated_access.organization_user_assignment',
      aggregateId: event.assignmentId,
      actorUserId: event.actorUserId,
      payloadJson: {
        assignmentId: event.assignmentId,
        tenantId: event.tenantId,
        change: event.change,
        role: event.roleCode,
        rowVersion: event.rowVersion,
        from: event.from,
        to: event.to,
      },
      idempotencyKey: `${DELEGATED_ACCESS_EVENTS.scopeChanged}:${event.assignmentId}:${event.rowVersion}`,
    });
  }
}
