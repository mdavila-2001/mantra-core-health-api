import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/** Nombres de evento de la estructura (CONTRATO-F0-F1 §3, `asyncapi/asyncapi.yaml`). */
export const STRUCTURE_EVENTS = {
  spaceCreated: 'practice.care_space.created',
  spaceUpdated: 'practice.care_space.updated',
  spaceMoved: 'practice.care_space.moved',
  spaceLifecycle: 'practice.care_space.lifecycle_changed',
  unitCreated: 'practice.clinical_unit.created',
  unitUpdated: 'practice.clinical_unit.updated',
  unitLifecycle: 'practice.clinical_unit.lifecycle_changed',
  assignmentCreated: 'practice.space_unit_assignment.created',
  assignmentClosed: 'practice.space_unit_assignment.closed',
  siteRegulatory: 'practice.site.regulatory_updated',
  siteSnisVerified: 'practice.site.snis_verified',
  licenseCreated: 'practice.site_license.created',
  licenseUpdated: 'practice.site_license.updated',
  capacityDeclared: 'practice.site.declared_capacity_recorded',
} as const;

/** Nombre de evento de la estructura. */
export type StructureEventType =
  (typeof STRUCTURE_EVENTS)[keyof typeof STRUCTURE_EVENTS];

/** Hecho de estructura a publicar. */
export interface StructureEvent {
  /** Tipo de evento. */
  readonly type: StructureEventType;
  /** Agregado afectado: `care_space`, `clinical_unit`, `practice_site`… */
  readonly aggregateType: string;
  /** Id del agregado. */
  readonly aggregateId: string;
  /** Tenant dueño. */
  readonly tenantId: string;
  /** Quien lo hizo. */
  readonly actorUserId: string;
  /** Id de correlación de la petición (el `correlationId` de los errores). */
  readonly correlationId?: string;
  /** Carga del evento: ids, versiones, motivo. Nunca datos clínicos. */
  readonly payload: Record<string, unknown>;
}

/**
 * Publica los hechos de estructura al outbox **dentro de la transacción de la
 * mutación** (INV-43): el cambio y su evento se confirman juntos o ninguno.
 */
@Injectable()
export class StructureEventsService {
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
  async publish(tx: EntityManager, event: StructureEvent): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payloadJson: {
        ...event.payload,
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        requestId: event.correlationId ?? null,
      },
      correlationId: event.correlationId,
      actorUserId: event.actorUserId,
    });
  }
}
