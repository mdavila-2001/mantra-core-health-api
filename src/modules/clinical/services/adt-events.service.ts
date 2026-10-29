import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/**
 * Eventos de la internación (CONTRATO-F2-F5 F3.3; `asyncapi/fragments/f3.yaml`).
 *
 * Los nombres HL7 entre paréntesis son el equivalente v2 del hecho. El estado de
 * la cama (`practice.care_space.status_changed`, A20) lo emite F2 por el puerto,
 * no se repite acá.
 */
export const ADT_EVENTS = {
  /** Ingreso (A01). */
  admitted: 'clinical.adt.admitted',
  /** Cama asignada a un encuentro ya ingresado (A01/A02). */
  bedAssigned: 'clinical.adt.bed_assigned',
  /** Cama reservada (A14/A15). */
  reservationCreated: 'clinical.adt.reservation_created',
  /** Reserva cancelada (A11 parcial). */
  reservationCancelled: 'clinical.adt.reservation_cancelled',
  /** Compatibilidad forzada: se abrió un incidente. */
  placementOverride: 'clinical.adt.placement_override',
  /** Traslado (A02: PV1-3 nuevo y PV1-6 previo). */
  transferred: 'clinical.adt.transferred',
  /** Traslado cancelado (A12). */
  transferCancelled: 'clinical.adt.transfer_cancelled',
  /** Intercambio de camas (A17). */
  swapped: 'clinical.adt.swapped',
  /** Egreso (A03). */
  discharged: 'clinical.adt.discharged',
  /** Incidente de colocación revisado o cerrado. */
  incidentReviewed: 'clinical.adt.placement_incident_reviewed',
  /** Censo diario cerrado. */
  censusClosed: 'clinical.census_day.closed',
  /** Censo diario ajustado. */
  censusAdjusted: 'clinical.census_day.adjusted',
} as const;

/** Nombre de evento de la internación. */
export type AdtEventType = (typeof ADT_EVENTS)[keyof typeof ADT_EVENTS];

/** Hecho de internación a publicar. */
export interface AdtEvent {
  /** Tipo. */
  readonly type: AdtEventType;
  /** Agregado: `encounter`, `encounter_location`, `placement_incident`, `inpatient_census_day`. */
  readonly aggregateType: string;
  /** Id del agregado. */
  readonly aggregateId: string;
  /** Tenant dueño. */
  readonly tenantId: string;
  /** Quien lo hizo; `null` cuando lo hace el sistema (cierre programado del censo). */
  readonly actorUserId: string | null;
  /** Id de correlación de la petición. */
  readonly correlationId?: string;
  /** Carga: ids, códigos, versiones. Nunca nombres ni datos clínicos. */
  readonly payload: Record<string, unknown>;
}

/**
 * Publica los hechos de internación al outbox **dentro de la transacción de la
 * mutación** (INV-43): el cambio y su evento se confirman juntos o ninguno.
 */
@Injectable()
export class AdtEventsService {
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
  async publish(tx: EntityManager, event: AdtEvent): Promise<void> {
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
      actorUserId: event.actorUserId ?? undefined,
    });
  }
}
