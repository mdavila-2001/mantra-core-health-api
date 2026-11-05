import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { PROF } from '../../profiles/profiles.concepts';
import type { TimeCursor } from './audit-query.repository';

/**
 * Una fila de `audit.data_access_log` con el nombre de quien accedió.
 *
 * Es el recorte que se le muestra al titular: no trae IP, ni organización, ni el identificador del
 * recurso leído, ni la base legal. El `user_id` viaja sólo para decidir si el acceso es del propio
 * titular; la capa de servicio no lo devuelve.
 */
export interface PatientAccessRow {
  id: string;
  user_id: string;
  action_concept_id: string;
  resource_type: string | null;
  purpose: string | null;
  recorded_at: string;
  accessor_name: string | null;
  accessor_is_practitioner: boolean;
}

export interface PatientAccessFilter {
  /** Paciente cuyo historial se consulta; lo fija el servidor, nunca el cliente. */
  patientProfileId: string;
  from?: Date;
  to?: Date;
  /** Si viene, omite los accesos de esta cuenta (la del propio titular). */
  excludeUserId?: string;
  cursor?: TimeCursor;
  limit: number;
}

/**
 * Lectura de `audit.data_access_log` acotada a un paciente. Sólo `SELECT`: la tabla es WORM.
 *
 * El `patient_profile_id` es una condición fija de la consulta y no un filtro opcional: no hay
 * forma de pedirla sin él. Usa el índice `ix_data_access_log_patient_profile_id`. Pide un elemento
 * de más (`limit + 1`) para saber si hay otra página.
 */
@Injectable()
export class PatientAccessLogRepository {
  /**
   * Accesos al historial de un paciente, del más reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Paciente, rango, exclusión del titular, cursor y tope.
   * @returns Hasta `limit + 1` filas con el nombre de quien accedió.
   */
  accessesTo(
    em: EntityManager,
    filter: PatientAccessFilter,
  ): Promise<PatientAccessRow[]> {
    const where: string[] = ['d.patient_profile_id = ?::uuid'];
    const params: unknown[] = [
      PROF.ACCOUNT_LINK_ACTIVE,
      filter.patientProfileId,
    ];
    const add = (sql: string, ...values: unknown[]): void => {
      where.push(sql);
      params.push(...values);
    };
    if (filter.from) add('d.recorded_at >= ?::timestamptz', filter.from);
    if (filter.to) add('d.recorded_at < ?::timestamptz', filter.to);
    if (filter.excludeUserId) add('d.user_id <> ?::uuid', filter.excludeUserId);
    if (filter.cursor)
      add(
        '(d.recorded_at, d.id) < (?::timestamptz, ?::uuid)',
        filter.cursor.t,
        filter.cursor.i,
      );
    params.push(filter.limit + 1);
    return em.getConnection().execute(
      `select d.id, d.user_id, d.action_concept_id, d.resource_type, d.purpose,
                ${isoTimestampSql('d.recorded_at')} as recorded_at,
                nullif(btrim(coalesce(p.display_name, concat_ws(' ', p.name, p.last_name))), '') as accessor_name,
                (hp.profile_id is not null) as accessor_is_practitioner
           from audit.data_access_log d
           left join profiles.person_account_links l
                  on l.user_id = d.user_id and l.status_concept_id = ?::uuid
           left join profiles.persons p on p.id = l.person_id
           left join profiles.health_practitioner_profiles hp on hp.profile_id = l.person_id
          where ${where.join(' and ')}
          order by d.recorded_at desc, d.id desc
          limit ?`,
      params,
      'all',
      em.getTransactionContext(),
    );
  }
}
