import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SecurityEvents } from '../../entities';
import { CONCEPTS } from '../../../../common';

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
   * Nº de códigos de segundo factor rechazados en el login desde un instante
   * dado (o desde siempre): el contador PROPIO del segundo factor, aparte del de
   * contraseña. Sustenta el bloqueo por adivinar el código con la contraseña ya
   * conocida.
   */
  async countFailedMfaSince(
    em: EntityManager,
    userId: string,
    since?: Date,
  ): Promise<number> {
    const rows = await em.getConnection().execute<{ n: string | number }[]>(
      `select count(*) as n from iam.security_events
        where user_id = ? and event_type_concept_id = ?
          and detail_json ->> 'reason' = 'bad-mfa'
          ${since ? 'and recorded_at >= ?' : ''}`,
      [userId, CONCEPTS.SEC_LOGIN_FAILED, ...(since ? [since] : [])],
    );
    return Number(rows[0]?.n ?? 0);
  }

  /**
   * Ejecuta `work` con un cerrojo de la base por persona (`pg_advisory_xact_lock`): dos
   * verificaciones del segundo factor de la MISMA persona no se solapan, así que el contador
   * de fallos que lee la segunda ya incluye el fallo de la primera (B-B10). El cerrojo vive
   * en su propia transacción, que dura lo que dure `work`; el trabajo usa sus propias
   * conexiones y confirma lo suyo antes de que el cerrojo se suelte.
   *
   * @param em - Contexto de persistencia (se bifurca).
   * @param userId - Persona cuyas verificaciones se serializan.
   * @param work - Sección crítica.
   * @returns Lo que devuelva `work`.
   */
  withMfaAttemptLock<T>(
    em: EntityManager,
    userId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    return em.fork().transactional(async (tx) => {
      await tx.execute('select pg_advisory_xact_lock(hashtext(?))', [
        `iam:mfa-attempts:${userId}`,
      ]);
      return work();
    });
  }

  /**
   * Último paso de tiempo TOTP aceptado para un factor, o `undefined`. Solo se
   * miran los últimos minutos: un código vale por su paso de 30 segundos, así
   * que un uso más viejo no puede repetirse.
   */
  async lastMfaTimeStep(
    em: EntityManager,
    userId: string,
    factorId: string,
  ): Promise<number | undefined> {
    const rows = await em
      .getConnection()
      .execute<{ step: string | number | null }[]>(
        `select max((detail_json ->> 'timeStep')::bigint) as step
           from iam.security_events
          where user_id = ? and event_type_concept_id = ?
            and detail_json ->> 'action' = 'code-used'
            and detail_json ->> 'factorId' = ?
            and recorded_at > now() - interval '10 minutes'`,
        [userId, CONCEPTS.SEC_MFA_ENROLL, factorId],
      );
    const step = rows[0]?.step;
    return step === null || step === undefined ? undefined : Number(step);
  }

  /**
   * ¿Se usó ya este código de confirmación de dispositivo? Un código vale una
   * sola vez: al aceptarlo se deja su huella (sin el código) en el evento.
   */
  async deviceCodeUsed(
    em: EntityManager,
    userId: string,
    codeDigest: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<{ ok: number }[]>(
      `select 1 as ok from iam.security_events
        where user_id = ? and event_type_concept_id = ?
          and detail_json ->> 'codeDigest' = ?
          and recorded_at > now() - interval '1 day' limit 1`,
      [userId, CONCEPTS.SEC_DEVICE_TRUST, codeDigest],
    );
    return rows.length > 0;
  }
}
