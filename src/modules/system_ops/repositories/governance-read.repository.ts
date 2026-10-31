import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import type {
  PolicySort,
  PolicyType,
  SortOrder,
} from '../dto/governance-read.dto';

export interface PolicyRow {
  policy_type: PolicyType;
  id: string;
  code: string;
  name: string | null;
  state: string | null;
  row_version: number;
  updated_at: string;
}

export interface PolicyListFilter {
  type?: PolicyType;
  state?: string;
  q?: string;
  sort: PolicySort;
  order: SortOrder;
  /** Valores de la última fila devuelta: `k` es el código o el instante, según el orden. */
  cursor?: { k: string; t: string; i: string };
  limit: number;
}

export interface PolicyDetailRow extends PolicyRow {
  created_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  settings: Record<string, unknown>;
}

export interface AppliedToRow {
  schema_name: string;
  table_name: string;
  column_name: string | null;
  total: number;
}

export interface ChangeLogRow {
  id: string;
  target_type: string;
  target_id: string;
  action: string | null;
  changed_by_user_id: string;
  reason: string | null;
  recorded_at: string;
}

export interface ChangeLogFilter {
  from: Date;
  to?: Date;
  targetType?: string;
  targetId?: string;
  changedBy?: string;
  cursor?: { t: string; i: string };
  limit: number;
}

export interface EntityRegistryRow {
  id: string;
  schema_name: string;
  table_name: string;
  domain_code: string | null;
  domain_name: string | null;
  classification_code: string | null;
  classification_name: string | null;
  owner_team: string | null;
  contains_pii: boolean | null;
  contains_phi: boolean | null;
  is_append_only: boolean;
  is_soft_delete: boolean;
  has_history: boolean;
  retention_policy_code: string | null;
  write_policy_code: string | null;
  field_count: number;
  personal_field_count: number;
}

export interface EntityRegistryFilter {
  schema?: string;
  q?: string;
  domain?: string;
  classification?: string;
  containsPii?: boolean;
  containsPhi?: boolean;
  cursor?: { s: string; t: string; i: string };
  limit: number;
}

export interface FieldRegistryRow {
  id: string;
  column_name: string;
  classification: string | null;
  is_pii: boolean | null;
  is_phi: boolean | null;
  masking_strategy: string | null;
  anonymization_rule_code: string | null;
}

/** Cuántos «aplicada a» devuelve el detalle de una política; el resto se informa como `truncated`. */
export const APPLIED_TO_LIMIT = 50;

const escaparLike = (texto: string): string =>
  texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Lecturas de gobierno de `system_ops.*` con SQL parametrizado. **Sólo `select`**: ninguna de estas
 * rutas escribe, y ninguna devuelve valores de parámetros ni snapshots (en una regla de anonimización
 * sólo los nombres de sus parámetros). Los estados y modos salen como `code` del concepto, no como id.
 */
@Injectable()
export class GovernanceReadRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  // ---- políticas -------------------------------------------------------------------------

  private policiesCte(): string {
    return `with p as (
      select 'WRITE'::text as policy_type, w.id, w.code::text as code, w.name::text as name, sc.code::text as state,
             w.row_version, w.updated_at
        from system_ops.write_policies w
        left join terminology.catalog_concepts sc on sc.id = w.state_concept_id
      union all
      select 'RETENTION', r.id, r.code::text, r.name::text, sc.code::text, r.row_version, r.updated_at
        from system_ops.retention_policies r
        left join terminology.catalog_concepts sc on sc.id = r.state_concept_id
      union all
      select 'ANONYMIZATION', a.id, a.code::text, null::text, null::text, a.row_version, a.updated_at
        from system_ops.anonymization_rules a
      union all
      select 'RESIDENCY', d.id, d.code::text, null::text, sc.code::text, d.row_version, d.updated_at
        from system_ops.data_residency_policies d
        left join terminology.catalog_concepts sc on sc.id = d.status_concept_id
    )`;
  }

  /** Políticas de los cuatro tipos en una sola lista, con orden total `(clave, tipo, id)`. */
  policies(em: EntityManager, f: PolicyListFilter): Promise<PolicyRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.type) agregar('policy_type = ?', f.type);
    if (f.state) agregar('state = ?', f.state);
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      agregar(
        `(lower(code) like ? escape '\\' or lower(coalesce(name, '')) like ? escape '\\')`,
        patron,
        patron,
      );
    }
    const dir = f.order === 'desc' ? 'desc' : 'asc';
    const cmp = f.order === 'desc' ? '<' : '>';
    if (f.cursor) {
      if (f.sort === 'code')
        agregar(
          `(code, policy_type, id) ${cmp} (?, ?, ?::uuid)`,
          f.cursor.k,
          f.cursor.t,
          f.cursor.i,
        );
      else
        agregar(
          `(updated_at, policy_type, id) ${cmp} (?::timestamptz, ?, ?::uuid)`,
          f.cursor.k,
          f.cursor.t,
          f.cursor.i,
        );
    }
    const clave = f.sort === 'code' ? 'code' : 'updated_at';
    return this.q<PolicyRow[]>(
      em,
      `${this.policiesCte()}
       select policy_type, id, code, name, state, row_version, ${isoTimestampSql('updated_at')} as updated_at
         from p
         ${where.length ? `where ${where.join(' and ')}` : ''}
        order by ${clave} ${dir}, policy_type ${dir}, id ${dir}
        limit ?`,
      [...params, f.limit + 1],
    );
  }

  /** Detalle: los campos comunes y los ajustes propios del tipo, con conceptos resueltos a su código. */
  async policyDetail(
    em: EntityManager,
    type: PolicyType,
    id: string,
  ): Promise<PolicyDetailRow | null> {
    const comunes = (alias: string, nombre: string, estado: string): string =>
      `${alias}.id, ${alias}.code::text as code, ${nombre} as name, ${estado} as state, ${alias}.row_version,
       ${isoTimestampSql(`${alias}.updated_at`)} as updated_at, ${isoTimestampSql(`${alias}.created_at`)} as created_at,
       ${alias}.created_by_user_id, ${alias}.updated_by_user_id`;
    const consultas: Record<PolicyType, string> = {
      WRITE: `select 'WRITE'::text as policy_type, ${comunes('w', 'w.name::text', 'sc.code::text')},
          jsonb_build_object('insertMode', im.code, 'updateMode', um.code, 'deleteMode', dm.code,
            'requiresReason', w.requires_reason, 'requiresApproval', w.requires_approval,
            'dualControl', w.dual_control, 'maxBatchSize', w.max_batch_size) as settings
        from system_ops.write_policies w
        left join terminology.catalog_concepts sc on sc.id = w.state_concept_id
        left join terminology.catalog_concepts im on im.id = w.insert_mode_concept_id
        left join terminology.catalog_concepts um on um.id = w.update_mode_concept_id
        left join terminology.catalog_concepts dm on dm.id = w.delete_mode_concept_id
       where w.id = ?::uuid`,
      RETENTION: `select 'RETENTION'::text as policy_type, ${comunes('r', 'r.name::text', 'sc.code::text')},
          jsonb_build_object('retentionPeriodDays', r.retention_period_days, 'legalBasis', lb.code,
            'disposition', dp.code, 'jurisdiction', jc.code) as settings
        from system_ops.retention_policies r
        left join terminology.catalog_concepts sc on sc.id = r.state_concept_id
        left join terminology.catalog_concepts lb on lb.id = r.legal_basis_concept_id
        left join terminology.catalog_concepts dp on dp.id = r.disposition_concept_id
        left join terminology.catalog_concepts jc on jc.id = r.jurisdiction_concept_id
       where r.id = ?::uuid`,
      ANONYMIZATION: `select 'ANONYMIZATION'::text as policy_type, ${comunes('a', 'null::text', 'null::text')},
          jsonb_build_object('technique', tc.code, 'description', a.description,
            'parameterKeys', coalesce((select jsonb_agg(k order by k) from jsonb_object_keys(
               case when jsonb_typeof(a.parameters_json) = 'object' then a.parameters_json else '{}'::jsonb end) k), '[]'::jsonb)) as settings
        from system_ops.anonymization_rules a
        left join terminology.catalog_concepts tc on tc.id = a.technique_concept_id
       where a.id = ?::uuid`,
      RESIDENCY: `select 'RESIDENCY'::text as policy_type, ${comunes('d', 'null::text', 'sc.code::text')},
          jsonb_build_object('jurisdiction', jc.code, 'dataClassification', dc.code,
            'crossBorderTransferBasis', tb.code,
            'transferImpactAssessmentRequired', d.transfer_impact_assessment_required,
            'encryptionKeyRegionLocked', d.encryption_key_region_locked,
            'validFrom', ${isoTimestampSql('d.valid_from')}, 'validTo', ${isoTimestampSql('d.valid_to')}) as settings
        from system_ops.data_residency_policies d
        left join terminology.catalog_concepts sc on sc.id = d.status_concept_id
        left join terminology.catalog_concepts jc on jc.id = d.jurisdiction_concept_id
        left join system_ops.data_classifications dc on dc.id = d.data_classification_id
        left join terminology.catalog_concepts tb on tb.id = d.cross_border_transfer_basis_concept_id
       where d.id = ?::uuid`,
    };
    const [fila] = await this.q<PolicyDetailRow[]>(em, consultas[type], [id]);
    return fila ?? null;
  }

  /** Dónde se aplica una política: tablas o columnas, nombres solamente, acotado. */
  appliedTo(
    em: EntityManager,
    type: PolicyType,
    id: string,
  ): Promise<AppliedToRow[]> {
    if (type === 'RESIDENCY') return Promise.resolve([]);
    const origen: Record<Exclude<PolicyType, 'RESIDENCY'>, string> = {
      WRITE: `select er.schema_name, er.table_name, null::text as column_name
                from system_ops.entity_registry er where er.write_policy_id = ?::uuid`,
      RETENTION: `select er.schema_name, er.table_name, null::text as column_name
                from system_ops.entity_registry er where er.retention_policy_id = ?::uuid`,
      ANONYMIZATION: `select er.schema_name, er.table_name, fr.column_name::text as column_name
                from system_ops.field_registry fr
                join system_ops.entity_registry er on er.id = fr.entity_registry_id
               where fr.anonymization_rule_id = ?::uuid`,
    };
    return this.q<AppliedToRow[]>(
      em,
      `select schema_name::text, table_name::text, column_name, (count(*) over())::int as total
         from (${origen[type]}) x
        order by schema_name, table_name, column_name nulls first
        limit ?`,
      [id, APPLIED_TO_LIMIT],
    );
  }

  // ---- bitácora de cambios de gobierno -----------------------------------------------------

  /** Cambios de gobierno, más recientes primero. Sin índice por objeto o fecha: la ventana es obligatoria. */
  changeLog(em: EntityManager, f: ChangeLogFilter): Promise<ChangeLogRow[]> {
    const where: string[] = ['g.recorded_at >= ?::timestamptz'];
    const params: unknown[] = [f.from];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.to) agregar('g.recorded_at < ?::timestamptz', f.to);
    if (f.targetType) agregar('g.target_type = ?', f.targetType);
    if (f.targetId) agregar('g.target_id = ?::uuid', f.targetId);
    if (f.changedBy) agregar('g.changed_by_user_id = ?::uuid', f.changedBy);
    if (f.cursor)
      agregar(
        '(g.recorded_at, g.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    return this.q<ChangeLogRow[]>(
      em,
      `select g.id, g.target_type, g.target_id, ac.code::text as action, g.changed_by_user_id, g.reason,
              ${isoTimestampSql('g.recorded_at')} as recorded_at
         from system_ops.governance_change_log g
         left join terminology.catalog_concepts ac on ac.id = g.action_concept_id
        where ${where.join(' and ')}
        order by g.recorded_at desc, g.id desc
        limit ?`,
      [...params, f.limit + 1],
    );
  }

  // ---- registro de entidades y campos ------------------------------------------------------

  entityRegistry(
    em: EntityManager,
    f: EntityRegistryFilter,
  ): Promise<EntityRegistryRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.schema) agregar('er.schema_name = ?', f.schema);
    if (f.domain) agregar('dd.code = ?', f.domain);
    if (f.classification) agregar('dc.code = ?', f.classification);
    if (f.containsPii !== undefined)
      agregar('coalesce(er.contains_pii, false) = ?', f.containsPii);
    if (f.containsPhi !== undefined)
      agregar('coalesce(er.contains_phi, false) = ?', f.containsPhi);
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      agregar(
        `lower(er.schema_name || '.' || er.table_name) like ? escape '\\'`,
        patron,
      );
    }
    if (f.cursor)
      agregar(
        '(er.schema_name, er.table_name, er.id) > (?, ?, ?::uuid)',
        f.cursor.s,
        f.cursor.t,
        f.cursor.i,
      );
    return this.q<EntityRegistryRow[]>(
      em,
      `select er.id, er.schema_name, er.table_name, dd.code::text as domain_code, dd.name::text as domain_name,
              dc.code::text as classification_code, dc.name::text as classification_name, er.owner_team,
              er.contains_pii, er.contains_phi, er.is_append_only, er.is_soft_delete, er.has_history,
              rp.code::text as retention_policy_code, wp.code::text as write_policy_code,
              (select count(*) from system_ops.field_registry fr where fr.entity_registry_id = er.id)::int as field_count,
              (select count(*) from system_ops.field_registry fr where fr.entity_registry_id = er.id
                  and (coalesce(fr.is_pii, false) or coalesce(fr.is_phi, false)))::int as personal_field_count
         from system_ops.entity_registry er
         left join system_ops.data_domains dd on dd.id = er.domain_id
         left join system_ops.data_classifications dc on dc.id = er.classification_id
         left join system_ops.retention_policies rp on rp.id = er.retention_policy_id
         left join system_ops.write_policies wp on wp.id = er.write_policy_id
        ${where.length ? `where ${where.join(' and ')}` : ''}
        order by er.schema_name, er.table_name, er.id
        limit ?`,
      [...params, f.limit + 1],
    );
  }

  async entityExists(em: EntityManager, id: string): Promise<boolean> {
    const filas = await this.q<{ id: string }[]>(
      em,
      'select id from system_ops.entity_registry where id = ?::uuid',
      [id],
    );
    return filas.length > 0;
  }

  /** Campos declarados de una entidad. Las notas libres no salen. */
  fieldRegistry(
    em: EntityManager,
    entityId: string,
    f: { cursor?: { c: string; i: string }; limit: number },
  ): Promise<FieldRegistryRow[]> {
    const params: unknown[] = [entityId];
    let cursor = '';
    if (f.cursor) {
      cursor = 'and (fr.column_name, fr.id) > (?, ?::uuid)';
      params.push(f.cursor.c, f.cursor.i);
    }
    return this.q<FieldRegistryRow[]>(
      em,
      `select fr.id, fr.column_name::text as column_name, dc.code::text as classification, fr.is_pii, fr.is_phi,
              ms.code::text as masking_strategy, ar.code::text as anonymization_rule_code
         from system_ops.field_registry fr
         left join system_ops.data_classifications dc on dc.id = fr.classification_id
         left join terminology.catalog_concepts ms on ms.id = fr.masking_strategy_concept_id
         left join system_ops.anonymization_rules ar on ar.id = fr.anonymization_rule_id
        where fr.entity_registry_id = ?::uuid ${cursor}
        order by fr.column_name, fr.id
        limit ?`,
      [...params, f.limit + 1],
    );
  }
}
