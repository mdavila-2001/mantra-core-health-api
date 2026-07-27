import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SecurityEvents } from '../entities';
import { CONCEPTS } from '../../../common';

/** Datos de un evento de seguridad append-only. */
export interface RecordSecurityEventData {
  eventTypeConceptId: string;
  outcomeConceptId: string;
  userId?: string;
  ip?: string;
  detailJson?: unknown;
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `iam.security_events`. Tabla append-only: sin `row_version`
 * ni `updated_at`, solo `recorded_at`. No se actualizan filas.
 */
@Injectable()
export class SecurityEventsRepository {
  /** Registra un evento de seguridad (sin flush). */
  record(em: EntityManager, data: RecordSecurityEventData): SecurityEvents {
    return em.create(
      SecurityEvents,
      {
        eventTypeConceptId: data.eventTypeConceptId,
        outcomeConceptId: data.outcomeConceptId,
        userId: data.userId,
        ip: data.ip,
        detailJson: data.detailJson,
        recordedByUserId: data.recordedByUserId,
        recordedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Nº de logins fallidos del usuario desde un instante dado (o desde siempre).
   * Sustenta el umbral de bloqueo automático de cuenta.
   */
  countFailedLoginsSince(
    em: EntityManager,
    userId: string,
    since?: Date,
  ): Promise<number> {
    return em.count(SecurityEvents, {
      userId,
      eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
      ...(since ? { recordedAt: { $gte: since } } : {}),
    });
  }
}
