import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/** Eventos de la operación de espacios (CONTRATO-F2-F5 §F2.3, `asyncapi/asyncapi.yaml`). */
export const OPS_EVENTS = {
  /** Equivalente a `ADT^A20` / NPU-1, NPU-2: un eje cambió de valor. */
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

/** Nombre de evento de la operación. */
export type OpsEventType = (typeof OPS_EVENTS)[keyof typeof OPS_EVENTS];

/** Hecho a publicar. */
export interface OpsEvent {
  readonly type: OpsEventType;
  /** `care_space`, `care_space_block` o `cleaning_order`. */
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly actorUserId: string | null;
  readonly requestId?: string | null;
  /** Dato que distingue este hecho de otro igual (id de la fila del evento A20, versión de la orden…). */
  readonly uniqueRef: string;
  /** Ids, versiones y códigos; nunca datos clínicos. */
  readonly payload: Record<string, unknown>;
}

/**
 * Publica los hechos de la operación al outbox **dentro de la transacción de la
 * mutación** (INV-43): el cambio y su evento se confirman juntos o ninguno.
 */
@Injectable()
export class OpsEventsService {
  /**
   * @param outbox - Outbox transaccional de mensajería.
   */
  constructor(private readonly outbox: OutboxService) {}

  /**
   * Encola el evento en la transacción `tx`.
   *
   * @param tx - Transacción de la mutación.
   * @param event - El hecho.
   * @returns `true` si se encoló; `false` si ese mismo hecho ya estaba publicado.
   */
  async publish(tx: EntityManager, event: OpsEvent): Promise<boolean> {
    const result = await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payloadJson: {
        ...event.payload,
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        requestId: event.requestId ?? null,
      },
      correlationId: event.requestId ?? undefined,
      actorUserId: event.actorUserId ?? undefined,
      idempotencyKey: `${event.type}:${event.aggregateId}:${event.uniqueRef}`,
    });
    return !result.duplicate;
  }
}
