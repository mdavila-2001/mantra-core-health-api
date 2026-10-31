import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';

/** Tipos de evento de dominio del gobierno de accesos (CONTRATO-GOBIERNO §8.5). */
export const GovernanceEventType = {
  campaignLaunched: 'delegated_access.access_review.campaign_launched',
  campaignClosed: 'delegated_access.access_review.campaign_closed',
  itemDecided: 'delegated_access.access_review.item_decided',
  itemEscalated: 'delegated_access.access_review.item_escalated',
  reminderDue: 'delegated_access.access_review.reminder_due',
  autoRevoked: 'delegated_access.access_review.auto_revoked',
  anomalyDetected: 'delegated_access.anomaly.detected',
  reportExported: 'delegated_access.governance.report_exported',
  sodExceptionExpired: 'delegated_access.sod.exception_expired',
  fourEyesExpired: 'delegated_access.four_eyes.expired',
} as const;
export type GovernanceEventTypeCode =
  (typeof GovernanceEventType)[keyof typeof GovernanceEventType];

/** Un hecho para el outbox: solo identificadores. */
export interface GovernanceEventInput {
  /** Organización. */
  readonly tenantId: string;
  /** Tipo del evento. */
  readonly type: GovernanceEventTypeCode;
  /** Agregado (`access_review_campaign`, `access_review_item`, …). */
  readonly aggregate: string;
  /** Id del agregado. */
  readonly aggregateId: string;
  /** Solo identificadores y números: nunca texto libre ni datos del paciente. */
  readonly payload: Record<string, unknown>;
  /** Quien lo provoca; ausente = el sistema. */
  readonly actorUserId?: string;
}

/**
 * Publica los eventos del gobierno de accesos por el outbox transaccional: se
 * confirman, o se pierden, junto con el cambio que los produjo. Quienes los
 * consumen (`messaging`: avisos en la aplicación y correo) reciben solo
 * identificadores y vuelven a leer lo que necesitan.
 */
@Injectable()
export class GovernanceEvents {
  /**
   * @param outbox - Outbox de mensajería.
   */
  constructor(private readonly outbox: OutboxService) {}

  /**
   * Publica un evento dentro de la transacción en curso.
   *
   * @param tx - Transacción activa del cambio.
   * @param event - El hecho.
   */
  async publish(tx: EntityManager, event: GovernanceEventInput): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: event.tenantId,
      eventType: event.type,
      aggregateType: event.aggregate,
      aggregateId: event.aggregateId,
      payloadJson: { tenantId: event.tenantId, ...event.payload },
      ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
    });
  }
}
