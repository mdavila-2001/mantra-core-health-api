import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SOURCE_CODE,
  type ReviewStatus,
  type Sensitivity,
} from '../../domain/catalog/catalog.constants';
import {
  rankSql,
  type PiiSort,
  type QualitySeverity,
} from '../../domain/catalog/governance-insights';
import { escaparLike } from './catalog.repository';

/** Una columna que el catálogo clasifica como dato personal. Sólo metadatos: nunca valores. */
export interface PiiColumnRow {
  column_id: string;
  object_id: string;
  schema_name: string;
  object_name: string;
  column_name: string;
  native_type: string;
  sensitivity: Sensitivity;
  review_status: ReviewStatus;
  origin: string;
  approved: boolean;
  /** `null`: ninguna fila de `system_ops.field_registry` declara la columna. */
  registry_marks_personal: boolean | null;
  /** Posición negada en la escala (`-rank`), para ordenar de más a menos sensible con keyset. */
  rk: number;
}

export interface PiiColumnsFilter {
  schema?: string;
  /** Posición mínima en la escala de sensibilidad. */
  minRank: number;
  sensitivity?: Sensitivity;
  reviewStatus?: ReviewStatus;
  q?: string;
  sort: PiiSort;
  cursor?: { rk?: number; s: string; o: string; c: string };
  limit: number;
}

export interface PiiBySensitivityRow {
  sensitivity: Sensitivity;
  columns: number;
  approved: number;
  needs_review: number;
  auto_detected: number;
  other: number;
}

export interface PiiTotalsRow {
  observed_columns: number;
  classified_columns: number;
  personal_columns: number;
  objects_with_personal: number;
}

export interface RegistryTotalsRow {
  entities: number;
  entities_personal: number;
  fields: number;
  fields_personal: number;
}

export interface QualityIssueRow {
  rule_code: string;
  severity: QualitySeverity;
  schema_name: string;
  object_name: string;
  column_name: string | null;
  object_id: string;
  column_id: string | null;
  sensitivity: Sensitivity | null;
  review_status: ReviewStatus | null;
  /** Columnas afectadas: 1 para las reglas de columna; las personales del objeto en `CAT-PII-NO-OWNER`. */
  affected: number;
}

export interface QualityFilter {
  rule?: string;
  severity?: QualitySeverity;
  schema?: string;
  q?: string;
  cursor?: { r: string; s: string; o: string; c: string };
  limit?: number;
}

export interface QualityCountRow {
  rule_code: string;
  severity: QualitySeverity;
  issues: number;
}

const RANK_PERSONAL = 5;
const ORIGEN = `'${SOURCE_CODE}'`;

/** Columnas observadas de objetos observados, con la ficha de columna si la hay. */
const COLUMNAS_OBSERVADAS = `from data_catalog.catalog_columns c
    join data_catalog.catalog_objects o on o.id = c.object_id and o.source_code = ${ORIGEN} and o.observation_status = 'OBSERVED'
    left join data_catalog.catalog_annotations a on a.target_kind = 'COLUMN' and a.column_id = c.id
   where c.observation_status = 'OBSERVED'`;

/**
 * Lecturas de gobierno sobre `data_catalog.*` (datos personales y calidad del catálogo) con SQL
 * parametrizado. **Sólo `select`**, y sólo metadatos: nombres, tipos nativos, niveles y estados de
 * revisión. Ningún valor de dato ni el texto libre de las fichas sale de aquí.
 *
 * La escala de sensibilidad y los códigos de regla son constantes del dominio inlineadas en el SQL;
 * todo lo que viene del cliente viaja como parámetro.
 */
@Injectable()
export class CatalogInsightsRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  // ---- datos personales ------------------------------------------------------------------

  /**
   * Columnas con ficha de sensibilidad igual o superior a la pedida. Orden `name`
   * (`schema, objeto, columna`) o `sensitivity` (más sensible primero, luego por nombre); ambos
   * totales y con la clave completa como desempate, así la paginación nunca salta ni repite.
   */
  piiColumns(em: EntityManager, f: PiiColumnsFilter): Promise<PiiColumnRow[]> {
    const rank = rankSql('a.sensitivity');
    const where: string[] = [`${rank} >= ?`];
    const params: unknown[] = [f.minRank];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.schema) agregar('o.schema_name = ?', f.schema);
    if (f.sensitivity) agregar('a.sensitivity = ?', f.sensitivity);
    if (f.reviewStatus) agregar('a.review_status = ?', f.reviewStatus);
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      agregar(
        `lower(o.schema_name || '.' || o.object_name || '.' || c.column_name) like ? escape '\\'`,
        patron,
      );
    }
    const porSensibilidad = f.sort === 'sensitivity';
    const cursor: string[] = [];
    const paramsCursor: unknown[] = [];
    if (f.cursor) {
      if (porSensibilidad) {
        cursor.push(
          '(rk, schema_name, object_name, column_name) > (?, ?, ?, ?)',
        );
        paramsCursor.push(f.cursor.rk, f.cursor.s, f.cursor.o, f.cursor.c);
      } else {
        cursor.push('(schema_name, object_name, column_name) > (?, ?, ?)');
        paramsCursor.push(f.cursor.s, f.cursor.o, f.cursor.c);
      }
    }
    return this.q<PiiColumnRow[]>(
      em,
      `select * from (
         select c.id as column_id, o.id as object_id, o.schema_name, o.object_name, c.column_name, c.native_type,
                a.sensitivity, a.review_status, a.origin,
                (a.review_status = 'APPROVED' and a.approved_revision_no = a.current_revision_no) as approved,
                (select bool_or(coalesce(fr.is_pii, false) or coalesce(fr.is_phi, false))
                   from system_ops.field_registry fr
                   join system_ops.entity_registry er on er.id = fr.entity_registry_id
                  where er.schema_name = o.schema_name and er.table_name = o.object_name
                    and fr.column_name = c.column_name) as registry_marks_personal,
                (-${rank})::int as rk
           ${COLUMNAS_OBSERVADAS} and ${where.join(' and ')}
       ) t
       ${cursor.length ? `where ${cursor.join(' and ')}` : ''}
       order by ${porSensibilidad ? 'rk, ' : ''}schema_name, object_name, column_name
       limit ?`,
      [...params, ...paramsCursor, f.limit + 1],
    );
  }

  /** Columnas por nivel de sensibilidad y estado de revisión. `UNKNOWN` = sin ficha o sin clasificar. */
  piiBySensitivity(em: EntityManager): Promise<PiiBySensitivityRow[]> {
    return this.q<PiiBySensitivityRow[]>(
      em,
      `select coalesce(a.sensitivity, 'UNKNOWN') as sensitivity,
              count(*)::int as columns,
              (count(*) filter (where a.review_status = 'APPROVED' and a.approved_revision_no = a.current_revision_no))::int as approved,
              (count(*) filter (where a.review_status = 'NEEDS_REVIEW'))::int as needs_review,
              (count(*) filter (where a.review_status = 'AUTO_DETECTED'))::int as auto_detected,
              (count(*) filter (where a.id is not null
                  and a.review_status not in ('NEEDS_REVIEW', 'AUTO_DETECTED')
                  and not (a.review_status = 'APPROVED' and a.approved_revision_no = a.current_revision_no)))::int as other
         ${COLUMNAS_OBSERVADAS}
        group by 1`,
    );
  }

  async piiTotals(em: EntityManager): Promise<PiiTotalsRow> {
    const rank = rankSql('a.sensitivity');
    const [fila] = await this.q<PiiTotalsRow[]>(
      em,
      `select count(*)::int as observed_columns,
              (count(*) filter (where ${rank} > 0))::int as classified_columns,
              (count(*) filter (where ${rank} >= ${RANK_PERSONAL}))::int as personal_columns,
              (count(distinct o.id) filter (where ${rank} >= ${RANK_PERSONAL}))::int as objects_with_personal
         ${COLUMNAS_OBSERVADAS}`,
    );
    return (
      fila ?? {
        observed_columns: 0,
        classified_columns: 0,
        personal_columns: 0,
        objects_with_personal: 0,
      }
    );
  }

  /** Lo que el equipo declaró a mano en el registro de gobierno (`system_ops`). */
  async registryTotals(em: EntityManager): Promise<RegistryTotalsRow> {
    const [fila] = await this.q<RegistryTotalsRow[]>(
      em,
      `select (select count(*) from system_ops.entity_registry)::int as entities,
              (select count(*) from system_ops.entity_registry
                where coalesce(contains_pii, false) or coalesce(contains_phi, false))::int as entities_personal,
              (select count(*) from system_ops.field_registry)::int as fields,
              (select count(*) from system_ops.field_registry
                where coalesce(is_pii, false) or coalesce(is_phi, false))::int as fields_personal`,
    );
    return (
      fila ?? {
        entities: 0,
        entities_personal: 0,
        fields: 0,
        fields_personal: 0,
      }
    );
  }

  // ---- calidad del catálogo --------------------------------------------------------------

  /** Una fila por incumplimiento de cada regla de `QUALITY_RULES`, sin guardar nada. */
  private issuesCte(): string {
    const rank = rankSql('a.sensitivity');
    return `with issues as (
      select 'CAT-PII-UNREVIEWED'::text as rule_code, 'HIGH'::text as severity, o.schema_name, o.object_name,
             c.column_name::text as column_name, o.id as object_id, c.id as column_id,
             a.sensitivity::text as sensitivity, a.review_status::text as review_status, 1 as affected
        ${COLUMNAS_OBSERVADAS}
         and ${rank} >= ${RANK_PERSONAL}
         and not (a.review_status = 'APPROVED' and a.approved_revision_no = a.current_revision_no)
      union all
      select 'CAT-PII-NO-OWNER', 'MEDIUM', o.schema_name, o.object_name, null::text, o.id, null::uuid,
             null::text, null::text, count(*)::int
        ${COLUMNAS_OBSERVADAS}
         and ${rank} >= ${RANK_PERSONAL}
         and not exists (select 1 from data_catalog.catalog_annotations oa2
                          where oa2.target_kind = 'OBJECT' and oa2.object_id = o.id
                            and coalesce(nullif(trim(oa2.business_owner), ''), nullif(trim(oa2.data_steward), '')) is not null)
       group by o.id, o.schema_name, o.object_name
      union all
      select 'CAT-OBJECT-NOT-OBSERVED', 'MEDIUM', o.schema_name, o.object_name, null::text, o.id, null::uuid,
             null::text, oa.review_status::text, 0
        from data_catalog.catalog_objects o
        join data_catalog.catalog_annotations oa on oa.target_kind = 'OBJECT' and oa.object_id = o.id
       where o.source_code = ${ORIGEN} and o.observation_status = 'NOT_OBSERVED'
      union all
      select 'CAT-OBJECT-NO-ANNOTATION', 'LOW', o.schema_name, o.object_name, null::text, o.id, null::uuid,
             null::text, null::text, 0
        from data_catalog.catalog_objects o
       where o.source_code = ${ORIGEN} and o.observation_status = 'OBSERVED'
         and not exists (select 1 from data_catalog.catalog_annotations oa
                          where oa.target_kind = 'OBJECT' and oa.object_id = o.id)
    )`;
  }

  private qualityWhere(f: QualityFilter): {
    where: string[];
    params: unknown[];
  } {
    const where: string[] = [];
    const params: unknown[] = [];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.rule) agregar('rule_code = ?', f.rule);
    if (f.severity) agregar('severity = ?', f.severity);
    if (f.schema) agregar('schema_name = ?', f.schema);
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      agregar(
        `lower(schema_name || '.' || object_name || '.' || coalesce(column_name, '')) like ? escape '\\'`,
        patron,
      );
    }
    return { where, params };
  }

  /** Incidencias en orden `(regla, schema, objeto, columna)`, con un elemento de más. */
  qualityIssues(
    em: EntityManager,
    f: QualityFilter & { limit: number },
  ): Promise<QualityIssueRow[]> {
    const { where, params } = this.qualityWhere(f);
    if (f.cursor) {
      where.push(
        `(rule_code, schema_name, object_name, coalesce(column_name, '')) > (?, ?, ?, ?)`,
      );
      params.push(f.cursor.r, f.cursor.s, f.cursor.o, f.cursor.c);
    }
    return this.q<QualityIssueRow[]>(
      em,
      `${this.issuesCte()}
       select * from issues
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by rule_code, schema_name, object_name, coalesce(column_name, '')
       limit ?`,
      [...params, f.limit + 1],
    );
  }

  /** Cuántas incidencias hay por regla bajo los mismos filtros, sin paginar. */
  qualityCounts(
    em: EntityManager,
    f: QualityFilter,
  ): Promise<QualityCountRow[]> {
    const { where, params } = this.qualityWhere(f);
    return this.q<QualityCountRow[]>(
      em,
      `${this.issuesCte()}
       select rule_code, severity, count(*)::int as issues from issues
       ${where.length ? `where ${where.join(' and ')}` : ''}
       group by rule_code, severity`,
      params,
    );
  }
}
