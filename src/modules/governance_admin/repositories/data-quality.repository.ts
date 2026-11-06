import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ISSUE_STATUS_CONCEPT,
  SEVERITY_CONCEPT,
  type IssueStatus,
  type Severity,
} from '../governance_admin.constants';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { SqlFilter, escapeLike } from '../sql-filter';
import type { Keyset } from '../keyset';

export interface IssueRow {
  id: string;
  field_path: string;
  created_at: Date;
  /** Marca con microsegundos, para el cursor: un `Date` de JS los pierde. */
  created_at_key: string;
  resolved_at: Date | null;
  assigned_user_id: string | null;
  resolution_text: string | null;
  canonical_health_resource_id: string | null;
  status_concept_id: string;
  rule_id: string;
  rule_code: string;
  rule_name: string;
  severity_concept_id: string;
  run_id: string;
  tenant_id: string;
}

export interface RuleRow {
  id: string;
  rule_code: string;
  name: string;
  severity_concept_id: string;
  state_concept_id: string;
  dimension_concept_id: string;
  dimension_code: string | null;
  dimension_display: string | null;
  state_code: string | null;
  state_display: string | null;
  rule_set_id: string;
  rule_set_code: string;
  rule_set_name: string;
  rule_set_version: string;
  updated_at: Date;
  open_issues: string;
  total_issues: string;
  rule_expression?: string;
  remediation_guidance?: string | null;
  expression_language_code?: string | null;
  row_version?: number;
}

export interface RunRow {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  result_concept_id: string;
  result_code: string | null;
  result_display: string | null;
  records_evaluated: string | null;
  issues_detected: string | null;
}

export interface IssueFilters {
  status?: IssueStatus;
  severity?: Severity;
  ruleId?: string;
  q?: string;
}

export interface RuleFilters {
  severity?: Severity;
  dimension?: string;
  q?: string;
}

const ISSUE_SELECT = `
  i.id, i.field_path, i.created_at, ${isoTimestampSql('i.created_at')} as created_at_key, i.resolved_at, i.assigned_user_id, i.resolution_text,
  i.canonical_health_resource_id, i.status_concept_id,
  r.id as rule_id, r.rule_code, r.name as rule_name, r.severity_concept_id,
  run.id as run_id, run.tenant_id`;

const ISSUE_FROM = `
  from health_data.health_data_quality_issues i
  join health_data.health_data_quality_rules r on r.id = i.health_data_quality_rule_id
  join health_data.health_data_quality_runs run on run.id = i.health_data_quality_run_id`;

const RULE_SELECT = `
  r.id, r.rule_code, r.name, r.severity_concept_id, r.state_concept_id, r.dimension_concept_id,
  dim.code as dimension_code, dim.display as dimension_display,
  st.code as state_code, st.display as state_display,
  rs.id as rule_set_id, rs.code as rule_set_code, rs.name as rule_set_name, rs.version as rule_set_version,
  r.updated_at,
  (select count(*) from health_data.health_data_quality_issues x
     where x.health_data_quality_rule_id = r.id and x.status_concept_id = $OPEN) as open_issues,
  (select count(*) from health_data.health_data_quality_issues x
     where x.health_data_quality_rule_id = r.id) as total_issues`;

const RULE_FROM = `
  from health_data.health_data_quality_rules r
  join health_data.health_data_quality_rule_sets rs on rs.id = r.health_data_quality_rule_set_id
  left join terminology.catalog_concepts dim on dim.id = r.dimension_concept_id
  left join terminology.catalog_concepts st on st.id = r.state_concept_id`;

/** Lecturas y la única escritura de la calidad de datos, con SQL parametrizado. */
@Injectable()
export class DataQualityRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  private issueFilter(f: IssueFilters): SqlFilter {
    const w = new SqlFilter();
    if (f.status)
      w.add('i.status_concept_id = ?', ISSUE_STATUS_CONCEPT[f.status]);
    if (f.severity)
      w.add('r.severity_concept_id = ?', SEVERITY_CONCEPT[f.severity]);
    if (f.ruleId) w.add('r.id = ?', f.ruleId);
    if (f.q) {
      const like = `%${escapeLike(f.q.toLowerCase())}%`;
      const p = w.param(like);
      w.addRaw(
        `(lower(i.field_path) like ${p} or lower(r.rule_code) like ${p} or lower(r.name) like ${p})`,
      );
    }
    return w;
  }

  async countIssues(em: EntityManager, f: IssueFilters): Promise<number> {
    const w = this.issueFilter(f);
    const rows = await this.q<{ n: string }[]>(
      em,
      `select count(*) as n ${ISSUE_FROM} ${w.where}`,
      w.params,
    );
    return Number(rows[0]?.n ?? 0);
  }

  /** Orden estable: más nuevas primero, desempate por id. `after` es la última fila de la página anterior. */
  listIssues(
    em: EntityManager,
    f: IssueFilters,
    limit: number,
    after?: Keyset,
  ): Promise<IssueRow[]> {
    const w = this.issueFilter(f);
    if (after) {
      const c = w.param(after.c);
      const i = w.param(after.i);
      w.addRaw(`(i.created_at, i.id) < (${c}::timestamptz, ${i}::uuid)`);
    }
    const lim = w.param(limit);
    return this.q<IssueRow[]>(
      em,
      `select ${ISSUE_SELECT} ${ISSUE_FROM} ${w.where}
       order by i.created_at desc, i.id desc limit ${lim}`,
      w.params,
    );
  }

  async findIssue(em: EntityManager, id: string): Promise<IssueRow | null> {
    const rows = await this.q<IssueRow[]>(
      em,
      `select ${ISSUE_SELECT} ${ISSUE_FROM} where i.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * Cierra la incidencia **sólo si sigue abierta**: la precondición va en el `UPDATE`, así que dos
   * resoluciones simultáneas no se pisan. Devuelve `false` si ya no estaba abierta.
   */
  async closeIfOpen(
    em: EntityManager,
    id: string,
    toStatusConceptId: string,
    note: string,
  ): Promise<boolean> {
    const rows = await this.q<{ id: string }[]>(
      em,
      `update health_data.health_data_quality_issues
          set status_concept_id = $1, resolution_text = $2, resolved_at = now()
        where id = $3 and status_concept_id = $4
        returning id`,
      [toStatusConceptId, note, id, ISSUE_STATUS_CONCEPT.OPEN],
    );
    return rows.length > 0;
  }

  private ruleFilter(f: RuleFilters): SqlFilter {
    const w = new SqlFilter();
    if (f.severity)
      w.add('r.severity_concept_id = ?', SEVERITY_CONCEPT[f.severity]);
    if (f.dimension) w.add('dim.code = ?', f.dimension);
    if (f.q) {
      const like = `%${escapeLike(f.q.toLowerCase())}%`;
      const p = w.param(like);
      w.addRaw(`(lower(r.rule_code) like ${p} or lower(r.name) like ${p})`);
    }
    return w;
  }

  async countRules(em: EntityManager, f: RuleFilters): Promise<number> {
    const w = this.ruleFilter(f);
    const rows = await this.q<{ n: string }[]>(
      em,
      `select count(*) as n ${RULE_FROM} ${w.where}`,
      w.params,
    );
    return Number(rows[0]?.n ?? 0);
  }

  /** Orden por código de regla y, a igualdad, por id. */
  listRules(
    em: EntityManager,
    f: RuleFilters,
    limit: number,
    after?: Keyset,
  ): Promise<RuleRow[]> {
    const w = this.ruleFilter(f);
    const open = w.param(ISSUE_STATUS_CONCEPT.OPEN);
    if (after) {
      const c = w.param(after.c);
      const i = w.param(after.i);
      w.addRaw(`(r.rule_code, r.id) > (${c}, ${i}::uuid)`);
    }
    const lim = w.param(limit);
    return this.q<RuleRow[]>(
      em,
      `select ${RULE_SELECT.replace('$OPEN', () => open)} ${RULE_FROM} ${w.where}
       order by r.rule_code asc, r.id asc limit ${lim}`,
      w.params,
    );
  }

  async findRule(em: EntityManager, id: string): Promise<RuleRow | null> {
    const rows = await this.q<RuleRow[]>(
      em,
      `select ${RULE_SELECT.replace('$OPEN', () => '$2')},
         r.rule_expression, r.remediation_guidance, r.row_version,
         lang.code as expression_language_code
       ${RULE_FROM}
       left join terminology.catalog_concepts lang on lang.id = r.expression_language_concept_id
       where r.id = $1`,
      [id, ISSUE_STATUS_CONCEPT.OPEN],
    );
    return rows[0] ?? null;
  }

  /** Cuántas incidencias hay por estado para una regla. */
  async issueCountsByStatus(
    em: EntityManager,
    ruleId: string,
  ): Promise<{ status_concept_id: string; n: string }[]> {
    return this.q(
      em,
      `select status_concept_id, count(*) as n
         from health_data.health_data_quality_issues
        where health_data_quality_rule_id = $1
        group by status_concept_id`,
      [ruleId],
    );
  }

  /** Corridas más recientes del conjunto de reglas al que pertenece la regla. */
  recentRuns(
    em: EntityManager,
    ruleSetId: string,
    limit: number,
  ): Promise<RunRow[]> {
    return this.q<RunRow[]>(
      em,
      `select run.id, run.started_at, run.completed_at, run.result_concept_id,
              res.code as result_code, res.display as result_display,
              run.records_evaluated, run.issues_detected
         from health_data.health_data_quality_runs run
         left join terminology.catalog_concepts res on res.id = run.result_concept_id
        where run.health_data_quality_rule_set_id = $1
        order by run.started_at desc, run.id desc
        limit $2`,
      [ruleSetId, limit],
    );
  }
}
