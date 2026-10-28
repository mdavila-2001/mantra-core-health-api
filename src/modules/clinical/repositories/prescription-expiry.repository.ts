import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';

/** Una receta próxima a vencer cuyo paciente todavía no fue avisado. */
export interface ExpiringPrescriptionRow {
  id: string;
  custodian_tenant_id: string;
  /** Cuenta activa del paciente: a quien se le avisa. */
  recipient_user_id: string;
}

export interface ExpiringPrescriptionFilter {
  /** Estado en que una receta está vigente para el paciente (emitida). */
  issuedStatusConceptId: string;
  /** Las que vencen después de este instante (las ya vencidas no «están por vencer»). */
  after: Date;
  /** …y hasta este instante, incluido. */
  until: Date;
  /** Clave de idempotencia del aviso es `<prefijo><id de la receta>`. */
  noticeKeyPrefix: string;
  limit: number;
}

/**
 * Lectura de `clinical.medication_requests` para el aviso de vencimiento (PAC-REC-002). Sólo
 * `SELECT`.
 *
 * «Todavía no avisado» se decide contra `messaging.notification_requests`, que guarda una fila por
 * cada aviso pedido —también el suprimido por preferencia— con su clave de idempotencia. Excluirlas
 * en la propia consulta evita que un lote se llene de recetas ya avisadas y deje fuera a las
 * demás.
 */
@Injectable()
export class PrescriptionExpiryRepository {
  /**
   * Recetas emitidas que vencen dentro de la ventana, sin aviso previo y con paciente con cuenta
   * activa, las que vencen antes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Estado, ventana, prefijo de la clave de aviso y tope.
   * @returns Hasta `limit` recetas con la cuenta a avisar.
   */
  findToNotify(
    em: EntityManager,
    filter: ExpiringPrescriptionFilter,
  ): Promise<ExpiringPrescriptionRow[]> {
    return em.getConnection().execute(
      `select m.id, m.custodian_tenant_id, l.user_id as recipient_user_id
           from clinical.medication_requests m
           join lateral (
                  select pl.user_id
                    from profiles.person_account_links pl
                   where pl.person_id = m.patient_profile_id
                     and pl.status_concept_id = ?::uuid
                   order by pl.valid_from desc, pl.id
                   limit 1
                ) l on true
          where m.status_concept_id = ?::uuid
            and m.valid_to > ?::timestamptz
            and m.valid_to <= ?::timestamptz
            and not exists (
                  select 1 from messaging.notification_requests n
                   where n.idempotency_key = ?::text || m.id::text
                )
          order by m.valid_to asc, m.id asc
          limit ?`,
      [
        PROF.ACCOUNT_LINK_ACTIVE,
        filter.issuedStatusConceptId,
        filter.after,
        filter.until,
        filter.noticeKeyPrefix,
        filter.limit,
      ],
      'all',
      em.getTransactionContext(),
    );
  }
}
