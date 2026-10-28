import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';

/** Fila de `audit.audit_log` tal como la consulta la devuelve (sin los hashes de la cadena). */
export interface AuditLogRow {
  id: string;
  user_id: string;
  tenant_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  outcome_concept_id: string;
  ip: string | null;
  recorded_at: string;
}

export interface DataAccessRow {
  id: string;
  user_id: string;
  tenant_id: string | null;
  patient_profile_id: string | null;
  action_concept_id: string;
  resource_type: string | null;
  resource_id: string | null;
  purpose: string | null;
  recorded_at: string;
}

/** Cursor keyset: `(recorded_at, id)` de la última fila de la página anterior. */
export interface TimeCursor {
  t: string;
  i: string;
}

/**
 * Qué acciones de `audit_log` cumplen un filtro de verbo o de ruta. El sello no guarda ni verbo ni
 * ruta: sólo la acción. Las derivadas (`HTTP <VERBO> <plantilla>`) se reconocen por prefijo o por
 * valor exacto; las de negocio, por la lista que arma el mapa de rutas.
 */
export interface ActionMatcher {
  /** Acciones exactas (de negocio o derivadas completas). */
  exact: readonly string[];
  /** Prefijos de acciones derivadas, p. ej. `HTTP POST ` (sin comodines). */
  prefixes: readonly string[];
}

export interface AuditLogFilter {
  from: Date;
  to?: Date;
  userId?: string;
  tenantId?: string;
  outcomeConceptId?: string;
  /** Acción exacta pedida por el cliente. */
  action?: string;
  entity?: string;
  /** Resultado de combinar verbo y ruta; ausente si el cliente no filtró por ninguno. */
  matcher?: ActionMatcher;
  cursor?: TimeCursor;
  limit: number;
}

export interface DataAccessFilter {
  from: Date;
  to?: Date;
  userId?: string;
  tenantId?: string;
  patientProfileId?: string;
  resourceType?: string;
  actionConceptId?: string;
  cursor?: TimeCursor;
  limit: number;
}

/**
 * Lecturas de `audit.audit_log` y `audit.data_access_log`. Sólo `SELECT`: ambas tablas son WORM
 * y esta clase no escribe. Un elemento de más (`limit + 1`) permite saber si hay otra página.
 *
 * Índices que usan los filtros: usuario, tenant y fecha tienen índice propio; por acción no hay,
 * y por eso la consulta siempre acota por fecha.
 */
@Injectable()
export class AuditQueryRepository {
  private run<T>(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  auditLog(em: EntityManager, f: AuditLogFilter): Promise<AuditLogRow[]> {
    const where: string[] = ['a.recorded_at >= ?::timestamptz'];
    const params: unknown[] = [f.from];
    const add = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.to) add('a.recorded_at < ?::timestamptz', f.to);
    if (f.userId) add('a.user_id = ?::uuid', f.userId);
    if (f.tenantId) add('a.tenant_id = ?::uuid', f.tenantId);
    if (f.outcomeConceptId)
      add('a.outcome_concept_id = ?::uuid', f.outcomeConceptId);
    if (f.action) add('a.action = ?', f.action);
    if (f.entity) add('a.entity = ?', f.entity);
    if (f.matcher) {
      add(
        `(a.action in (select value from jsonb_array_elements_text(?::jsonb))
          or exists (select 1 from jsonb_array_elements_text(?::jsonb) p where a.action like p.value || '%'))`,
        JSON.stringify(f.matcher.exact),
        JSON.stringify(f.matcher.prefixes),
      );
    }
    if (f.cursor)
      add(
        '(a.recorded_at, a.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    params.push(f.limit + 1);
    return this.run<AuditLogRow[]>(
      em,
      `select a.id, a.user_id, a.tenant_id, a.action, a.entity, a.entity_id, a.outcome_concept_id,
              host(a.ip) as ip, ${isoTimestampSql('a.recorded_at')} as recorded_at
         from audit.audit_log a
        where ${where.join(' and ')}
        order by a.recorded_at desc, a.id desc
        limit ?`,
      params,
    );
  }

  dataAccess(em: EntityManager, f: DataAccessFilter): Promise<DataAccessRow[]> {
    const where: string[] = ['d.recorded_at >= ?::timestamptz'];
    const params: unknown[] = [f.from];
    const add = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.to) add('d.recorded_at < ?::timestamptz', f.to);
    if (f.userId) add('d.user_id = ?::uuid', f.userId);
    if (f.tenantId) add('d.tenant_id = ?::uuid', f.tenantId);
    if (f.patientProfileId)
      add('d.patient_profile_id = ?::uuid', f.patientProfileId);
    if (f.resourceType) add('d.resource_type = ?', f.resourceType);
    if (f.actionConceptId)
      add('d.action_concept_id = ?::uuid', f.actionConceptId);
    if (f.cursor)
      add(
        '(d.recorded_at, d.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    params.push(f.limit + 1);
    return this.run<DataAccessRow[]>(
      em,
      `select d.id, d.user_id, d.tenant_id, d.patient_profile_id, d.action_concept_id, d.resource_type,
              d.resource_id, d.purpose, ${isoTimestampSql('d.recorded_at')} as recorded_at
         from audit.data_access_log d
        where ${where.join(' and ')}
        order by d.recorded_at desc, d.id desc
        limit ?`,
      params,
    );
  }
}
