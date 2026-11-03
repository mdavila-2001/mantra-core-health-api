import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SecurityEvents } from '../../entities';
import { CONCEPTS } from '../../../../common';
import { isoTimestampSql } from '../../../../common/pagination/iso-timestamp-sql';
import {
  USER_LIFECYCLE_ACTIONS,
  type UserLifecycleAction,
} from '../../domain/user-lifecycle';

/** Datos de un evento de seguridad append-only. */
export interface RecordSecurityEventData {
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a user.
   */
  userId?: string;
  /**
   * Valor de ip mantenido por la instancia.
   */
  ip?: string;
  /**
   * Valor de detail json mantenido por la instancia.
   */
  detailJson?: unknown;
  /**
   * Identificador asociado a recorded by user.
   */
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

  /**
   * Última acción de ciclo de vida de la cuenta (`SUSPEND`, `REACTIVATE`, `DEACTIVATE`), o `null`.
   *
   * La baja se reconoce por esta marca porque el catálogo cerrado `user-status` no tiene un
   * estado «dada de baja»: la cuenta queda `LOCKED` y esta última acción dice que fue una baja.
   */
  async latestLifecycleAction(
    em: EntityManager,
    userId: string,
  ): Promise<UserLifecycleAction | null> {
    const rows = await em
      .getConnection()
      .execute<Array<{ action: UserLifecycleAction | null }>>(
        `select detail_json->>'action' as action
           from iam.security_events
          where user_id = ?::uuid and event_type_concept_id = ?::uuid
            and detail_json->>'action' in (select value from jsonb_array_elements_text(?::jsonb))
          order by recorded_at desc, id desc
          limit 1`,
        [
          userId,
          CONCEPTS.SEC_ACCOUNT_LOCK,
          JSON.stringify(USER_LIFECYCLE_ACTIONS),
        ],
        'all',
        em.getTransactionContext(),
      );
    return rows[0]?.action ?? null;
  }

  /**
   * Historia de ciclo de vida de la cuenta, de la más reciente a la más antigua, con cursor
   * keyset `(recorded_at, id)`. Pide una fila de más para saber si hay otra página.
   */
  lifecycleHistory(
    em: EntityManager,
    userId: string,
    page: { limit: number; after?: { recordedAt: string; id: string } },
  ): Promise<LifecycleEventRow[]> {
    const params: unknown[] = [
      userId,
      CONCEPTS.SEC_ACCOUNT_LOCK,
      JSON.stringify(USER_LIFECYCLE_ACTIONS),
    ];
    let keyset = '';
    if (page.after) {
      keyset = 'and (e.recorded_at, e.id) < (?::timestamptz, ?::uuid)';
      params.push(page.after.recordedAt, page.after.id);
    }
    params.push(page.limit + 1);
    return em.getConnection().execute(
      `select e.id, e.detail_json->>'action' as action, e.detail_json->>'reason' as reason,
                e.recorded_by_user_id, ${isoTimestampSql('e.recorded_at')} as recorded_at
           from iam.security_events e
          where e.user_id = ?::uuid and e.event_type_concept_id = ?::uuid
            and e.detail_json->>'action' in (select value from jsonb_array_elements_text(?::jsonb))
            ${keyset}
          order by e.recorded_at desc, e.id desc
          limit ?`,
      params,
      'all',
      em.getTransactionContext(),
    );
  }
}

/** Fila de la historia de ciclo de vida, tal como sale de `iam.security_events`. */
export interface LifecycleEventRow {
  id: string;
  action: UserLifecycleAction;
  reason: string | null;
  recorded_by_user_id: string | null;
  /** ISO 8601 UTC con microsegundos: sirve de componente del cursor. */
  recorded_at: string;
}
