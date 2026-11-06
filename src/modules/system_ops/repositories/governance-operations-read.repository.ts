import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';

export interface DomainRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  owner_team: string | null;
  entity_count: number;
  row_version: number;
  created_at: string;
  updated_at: string;
}

export interface LegalHoldRow {
  id: string;
  tenant_id: string;
  target_type: string | null;
  target_id: string;
  reason: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  has_authority_reference: boolean;
  row_version: number;
  created_at: string;
  updated_at: string;
}

export interface RetentionExecutionRow {
  id: string;
  policy_id: string;
  policy_code: string | null;
  entity_registry_id: string | null;
  schema_name: string | null;
  table_name: string | null;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  total_scanned: number | null;
  total_deleted: number | null;
  total_anonymized: number | null;
  total_archived: number | null;
  has_error: boolean;
  recorded_at: string;
}

/**
 * El `code` almacenado de un concepto de módulo es su CLAVE (`system_ops:EXEC_SUCCEEDED`); los del
 * catálogo base son planos (`ACTIVE`). Se muestra y se filtra sin el prefijo del módulo.
 */
const nombreConcepto = (columna: string): string =>
  `regexp_replace(${columna}, '^.*:', '')`;

const escaparLike = (texto: string): string =>
  texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Armado de `where` con parámetros posicionales. */
class Where {
  readonly parts: string[] = [];
  readonly params: unknown[] = [];
  add(sql: string, ...valores: unknown[]): void {
    this.parts.push(sql);
    this.params.push(...valores);
  }
  sql(): string {
    return this.parts.length ? `where ${this.parts.join(' and ')}` : '';
  }
}

/**
 * Lecturas de `system_ops` que el portal de gobierno necesita además de las de políticas y registro:
 * dominios, retenciones legales y ejecuciones de retención. **Sólo `select`**, SQL parametrizado,
 * orden total con desempate por `id` (keyset), y sólo metadatos: nada del texto libre de la
 * referencia de la autoridad de un hold ni del error de una ejecución (pueden citar valores).
 */
@Injectable()
export class GovernanceOperationsReadRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  /** Dominios de datos por código, con cuántas entidades del registro declaran cada uno. */
  domains(
    em: EntityManager,
    f: { q?: string; cursor?: { c: string; i: string }; limit: number },
  ): Promise<DomainRow[]> {
    const w = new Where();
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      w.add(
        `(lower(d.code) like ? escape '\\' or lower(d.name) like ? escape '\\')`,
        patron,
        patron,
      );
    }
    if (f.cursor)
      w.add('(d.code, d.id) > (?, ?::uuid)', f.cursor.c, f.cursor.i);
    return this.q<DomainRow[]>(
      em,
      `select d.id, d.code::text as code, d.name::text as name, d.description, d.owner_team::text as owner_team,
              (select count(*) from system_ops.entity_registry er where er.domain_id = d.id)::int as entity_count,
              d.row_version, ${isoTimestampSql('d.created_at')} as created_at, ${isoTimestampSql('d.updated_at')} as updated_at
         from system_ops.data_domains d
         ${w.sql()}
        order by d.code, d.id
        limit ?`,
      [...w.params, f.limit + 1],
    );
  }

  /** Retenciones legales, la modificada más recientemente primero. */
  legalHolds(
    em: EntityManager,
    f: {
      status?: string;
      targetType?: string;
      tenantId?: string;
      targetId?: string;
      cursor?: { t: string; i: string };
      limit: number;
    },
  ): Promise<LegalHoldRow[]> {
    const w = new Where();
    if (f.status) w.add(`${nombreConcepto('sc.code')} = ?`, f.status);
    if (f.targetType) w.add(`${nombreConcepto('tt.code')} = ?`, f.targetType);
    if (f.tenantId) w.add('h.tenant_id = ?::uuid', f.tenantId);
    if (f.targetId) w.add('h.target_id = ?::uuid', f.targetId);
    if (f.cursor)
      w.add(
        '(h.updated_at, h.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    return this.q<LegalHoldRow[]>(
      em,
      `select h.id, h.tenant_id, ${nombreConcepto('tt.code')}::text as target_type, h.target_id, ${nombreConcepto('rc.code')}::text as reason,
              ${nombreConcepto('sc.code')}::text as status, ${isoTimestampSql('h.starts_at')} as starts_at,
              ${isoTimestampSql('h.ends_at')} as ends_at,
              (coalesce(h.authority_reference, '') <> '') as has_authority_reference,
              h.row_version, ${isoTimestampSql('h.created_at')} as created_at, ${isoTimestampSql('h.updated_at')} as updated_at
         from system_ops.legal_holds h
         left join terminology.catalog_concepts tt on tt.id = h.target_type_concept_id
         left join terminology.catalog_concepts rc on rc.id = h.reason_concept_id
         left join terminology.catalog_concepts sc on sc.id = h.status_concept_id
         ${w.sql()}
        order by h.updated_at desc, h.id desc
        limit ?`,
      [...w.params, f.limit + 1],
    );
  }

  /** Ejecuciones de retención, la registrada más recientemente primero. */
  retentionExecutions(
    em: EntityManager,
    f: {
      policyId?: string;
      entityRegistryId?: string;
      status?: string;
      from?: Date;
      to?: Date;
      cursor?: { t: string; i: string };
      limit: number;
    },
  ): Promise<RetentionExecutionRow[]> {
    const w = new Where();
    if (f.policyId) w.add('e.retention_policy_id = ?::uuid', f.policyId);
    if (f.entityRegistryId)
      w.add('e.entity_registry_id = ?::uuid', f.entityRegistryId);
    if (f.status) w.add(`${nombreConcepto('sc.code')} = ?`, f.status);
    if (f.from) w.add('e.recorded_at >= ?::timestamptz', f.from);
    if (f.to) w.add('e.recorded_at < ?::timestamptz', f.to);
    if (f.cursor)
      w.add(
        '(e.recorded_at, e.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    return this.q<RetentionExecutionRow[]>(
      em,
      `select e.id, e.retention_policy_id as policy_id, rp.code::text as policy_code, e.entity_registry_id,
              er.schema_name::text as schema_name, er.table_name::text as table_name, ${nombreConcepto('sc.code')}::text as status,
              ${isoTimestampSql('e.started_at')} as started_at, ${isoTimestampSql('e.finished_at')} as finished_at,
              e.total_scanned::float8 as total_scanned, e.total_deleted::float8 as total_deleted,
              e.total_anonymized::float8 as total_anonymized, e.total_archived::float8 as total_archived,
              (e.error_text is not null) as has_error, ${isoTimestampSql('e.recorded_at')} as recorded_at
         from system_ops.retention_executions e
         left join system_ops.retention_policies rp on rp.id = e.retention_policy_id
         left join system_ops.entity_registry er on er.id = e.entity_registry_id
         left join terminology.catalog_concepts sc on sc.id = e.status_concept_id
         ${w.sql()}
        order by e.recorded_at desc, e.id desc
        limit ?`,
      [...w.params, f.limit + 1],
    );
  }
}
