import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';
import { PLAN_EVENTS } from './floor-plan.constants';

/** Tipo de evento del plano. */
export type PlanEventType = (typeof PLAN_EVENTS)[keyof typeof PLAN_EVENTS];

/** Hecho del plano a publicar. */
export interface PlanEvent {
  readonly type: PlanEventType;
  readonly floorPlanId: string;
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly correlationId?: string;
  /** Carga del evento: ids, versiones, recuentos. Nunca datos clínicos. */
  readonly payload: Record<string, unknown>;
}

/**
 * Publica los hechos del plano al outbox **dentro de la transacción de la
 * mutación** (INV-PL-15, INV-43): el cambio y su evento se confirman juntos o
 * ninguno. Documentados en `asyncapi/asyncapi.yaml`.
 */
@Injectable()
export class PlanEventsService {
  /**
   * @param outbox - Outbox transaccional de mensajería.
   */
  constructor(private readonly outbox: OutboxService) {}

  /**
   * Encola el evento en la transacción `tx`.
   *
   * @param tx - Transacción de la mutación.
   * @param event - El hecho.
   */
  async publish(tx: EntityManager, event: PlanEvent): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: event.type,
      aggregateType: 'floor_plan',
      aggregateId: event.floorPlanId,
      payloadJson: {
        ...event.payload,
        floorPlanId: event.floorPlanId,
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        requestId: event.correlationId ?? null,
      },
      correlationId: event.correlationId,
      actorUserId: event.actorUserId,
    });
  }
}
