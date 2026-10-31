import type { EntityManager } from '@mikro-orm/postgresql';
import type { OutboxService } from '../../../messaging/services/outbox.service';

/**
 * Eventos de la operación de F2 (CONTRATO-F2-F5 §F2.3; catálogo en
 * `asyncapi/asyncapi.yaml` → `InfrastructureOpsEvent`). Se publican en la
 * misma transacción que el cambio. `status_changed` equivale a `ADT^A20`.
 */
export const OPS_EVENTS = {
  statusChanged: 'practice.care_space.status_changed',
  blockStarted: 'practice.care_space.block_started',
  blockEnded: 'practice.care_space.block_ended',
  blockCancelled: 'practice.care_space.block_cancelled',
  blockOverdue: 'practice.care_space.block_overdue',
  cleaningCreated: 'practice.cleaning_order.created',
  cleaningAssigned: 'practice.cleaning_order.assigned',
  cleaningStarted: 'practice.cleaning_order.started',
  cleaningFinished: 'practice.cleaning_order.finished',
  cleaningInspected: 'practice.cleaning_order.inspected',
  cleaningRejected: 'practice.cleaning_order.rejected',
  cleaningCancelled: 'practice.cleaning_order.cancelled',
} as const;

/** Tipo de evento de operación. */
export type OpsEventType = (typeof OPS_EVENTS)[keyof typeof OPS_EVENTS];

/**
 * Publica un evento de operación en la transacción del llamador.
 *
 * @param outbox - `OutboxService`.
 * @param tx - Transacción en curso.
 * @param eventType - Uno de `OPS_EVENTS`.
 * @param input - Tenant, agregado, actor y payload (ids y códigos).
 */
export async function publishOpsEvent(
  outbox: Pick<OutboxService, 'publishDomainEvent'>,
  tx: EntityManager,
  eventType: OpsEventType,
  input: {
    tenantId: string;
    aggregateId: string;
    actorUserId?: string;
    correlationId?: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await outbox.publishDomainEvent(tx, {
    tenantId: input.tenantId,
    eventType,
    aggregateType: eventType.startsWith('practice.cleaning_order')
      ? 'practice.cleaning_orders'
      : eventType.includes('.block_')
        ? 'practice.care_space_blocks'
        : 'practice.care_spaces',
    aggregateId: input.aggregateId,
    payloadJson: input.payload,
    actorUserId: input.actorUserId,
  });
}
