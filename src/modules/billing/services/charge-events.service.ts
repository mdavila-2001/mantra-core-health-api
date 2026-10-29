import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/**
 * Eventos de las tarifas y los cargos devengados (CONTRATO-F2-F5 F5e;
 * `asyncapi/fragments/f5fin.yaml`).
 */
export const CHARGE_EVENTS = {
  /** Se devengó un cargo (día-cama o quirófano por tiempo). */
  chargeCreated: 'billing.charge_capture.created',
  /** Se anuló un cargo, por una persona o por una corrección de la ocupación. */
  chargeVoided: 'billing.charge_capture.voided',
  /** Un cargo entró en una factura. */
  chargeInvoiced: 'billing.charge_capture.invoiced',
  /** Se devengó un cargo sin tarifa vigente: Facturación tiene que configurarla. */
  tariffMissing: 'billing.charge_capture.tariff_missing',
  /** Se creó una tarifa de espacio. */
  tariffCreated: 'billing.space_tariff.created',
  /** Se cerró una tarifa de espacio. */
  tariffClosed: 'billing.space_tariff.closed',
} as const;

/** Nombre de evento de cargos y tarifas. */
export type ChargeEventType =
  (typeof CHARGE_EVENTS)[keyof typeof CHARGE_EVENTS];

/** Hecho a publicar. */
export interface ChargeEvent {
  /** Tipo. */
  readonly type: ChargeEventType;
  /** Agregado: `charge_capture` o `space_tariff`. */
  readonly aggregateType: 'charge_capture' | 'space_tariff';
  /** Id del agregado. */
  readonly aggregateId: string;
  /** Tenant dueño. */
  readonly tenantId: string;
  /** Quien lo hizo; `null` cuando lo devenga el sistema. */
  readonly actorUserId: string | null;
  /** Id de correlación de la petición. */
  readonly correlationId?: string;
  /** Carga: ids, fechas y códigos. Nunca nombres, motivos en texto libre ni datos clínicos. */
  readonly payload: Record<string, unknown>;
  /** Clave de idempotencia del evento (el job la fija para que un reintento no lo duplique). */
  readonly idempotencyKey?: string;
}

/**
 * Publica los hechos de facturación al outbox **dentro de la transacción de la
 * mutación**: el cambio y su evento se confirman juntos o ninguno.
 */
@Injectable()
export class ChargeEventsService {
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
  async publish(tx: EntityManager, event: ChargeEvent): Promise<void> {
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
      idempotencyKey: event.idempotencyKey,
    });
  }
}
