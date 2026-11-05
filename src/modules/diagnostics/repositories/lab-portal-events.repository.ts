import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequestPerformerEvents } from '../entities';

/** What the performer tenant writes when it ends an order it did not issue. */
export interface PerformerEventData {
  readonly serviceRequestId: string;
  /** The performer tenant: the custodian (owner) of the row. */
  readonly custodianTenantId: string;
  readonly eventTypeConceptId: string;
  readonly reasonText: string;
  readonly actorUserId: string;
}

/**
 * Reads and appends `diagnostics.service_request_performer_events`: the
 * performer's own append-only answers (cancel / reject) to routed orders.
 * Every read is scoped by `custodian_tenant_id` = the performer, so what
 * another center recorded about the same order never counts.
 */
@Injectable()
export class LabPortalEventsRepository {
  /** The newest performer event of each order, by order id. */
  async findLatestByOrders(
    em: EntityManager,
    tenantId: string,
    orderIds: readonly string[],
  ): Promise<Map<string, ServiceRequestPerformerEvents>> {
    const latest = new Map<string, ServiceRequestPerformerEvents>();
    if (orderIds.length === 0) return latest;
    const events = await em.find(
      ServiceRequestPerformerEvents,
      { serviceRequestId: { $in: [...orderIds] }, custodianTenantId: tenantId },
      { orderBy: { recordedAt: 'DESC', id: 'DESC' } },
    );
    for (const event of events) {
      if (!latest.has(event.serviceRequestId)) {
        latest.set(event.serviceRequestId, event);
      }
    }
    return latest;
  }

  /** Appends one event; events are never updated or deleted. */
  record(
    em: EntityManager,
    data: PerformerEventData,
  ): ServiceRequestPerformerEvents {
    return em.create(ServiceRequestPerformerEvents, {
      serviceRequestId: data.serviceRequestId,
      custodianTenantId: data.custodianTenantId,
      eventTypeConceptId: data.eventTypeConceptId,
      reasonText: data.reasonText,
      recordedAt: new Date(),
      recordedByUserId: data.actorUserId,
    });
  }
}
