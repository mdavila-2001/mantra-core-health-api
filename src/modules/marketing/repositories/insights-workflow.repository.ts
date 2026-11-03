import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from '@mikro-orm/postgresql';
import { InsightsSqlBase, isoTs, placeholders } from './insights-sql';

export const ALERT_STATUS_VALUE_SET = 'vs_insights_alert_status';
export const ALERT_SEVERITY_VALUE_SET = 'vs_insights_alert_severity';

export interface AlertRow {
  id: string;
  fingerprint: string;
  status_code: string;
  owner_team_code: string | null;
  row_version: number;
  updated_at: string;
}

export interface TransitionRow {
  alert_id: string;
  at: string;
  from_status: string | null;
  to_status: string;
  from_owner: string | null;
  to_owner: string | null;
  note: string | null;
}

export interface RuleRow {
  code: string;
  name: string;
  description: string | null;
  severity: string;
  unit: string;
  threshold: number;
  default_threshold: number;
  direction: string;
  enabled: boolean;
  row_version: number;
}

export interface InsertAlertData {
  code: string;
  fingerprint: string;
  severityConceptId: string;
  title: string;
  whatText: string;
  detectedOn: string;
  moduleCode: string;
  priority: number;
  statusConceptId: string;
  ownerTeamCode: string | null;
  userId: string;
}

export interface InsertTransitionData {
  alertId: string;
  fromStatusConceptId: string | null;
  toStatusConceptId: string;
  fromOwner: string | null;
  toOwner: string | null;
  note: string | null;
  userId: string;
}

const ALERT_COLUMNS = `a.id, a.fingerprint, lower(st.code) AS status_code,
       a.owner_team_code, a.row_version, ${isoTs('a.updated_at')} AS updated_at`;
const RULE_COLUMNS = `r.code, r.name, r.description, lower(sev.code) AS severity, r.unit,
       r.threshold::float8 AS threshold, r.default_threshold::float8 AS default_threshold,
       r.direction, r.enabled, r.row_version`;

/**
 * Escrituras de AloVida Insights sobre las alertas y las reglas, que son
 * compartidas por todo el portal (sin `user_id` ni `tenant_id`). SQL crudo; las
 * operaciones compuestas corren en `transaction` con la fila bloqueada
 * (`FOR UPDATE`) para que `If-Match` y `row_version` sean atómicos.
 */
@Injectable()
export class InsightsWorkflowRepository extends InsightsSqlBase {
  constructor(em: EntityManager) {
    super(em);
  }

  /** Ejecuta `work` en una transacción con un repositorio ligado a ella. */
  transaction<T>(
    work: (tx: InsightsWorkflowRepository) => Promise<T>,
  ): Promise<T> {
    return this.em.transactional((tem) =>
      work(new InsightsWorkflowRepository(tem)),
    );
  }

  alerts(): Promise<AlertRow[]> {
    return this.sql<AlertRow>(
      `SELECT ${ALERT_COLUMNS}
         FROM marketing.insights_alerts a
         JOIN terminology.catalog_concepts st ON st.id = a.status_concept_id
        ORDER BY a.detected_on DESC, a.code`,
    );
  }

  alertByFingerprint(
    fingerprint: string,
    lock = false,
  ): Promise<AlertRow | null> {
    return this.one<AlertRow>(
      `SELECT ${ALERT_COLUMNS}
         FROM marketing.insights_alerts a
         JOIN terminology.catalog_concepts st ON st.id = a.status_concept_id
        WHERE a.fingerprint = ?${lock ? ' FOR UPDATE OF a' : ''}`,
      [fingerprint],
    );
  }

  async transitionsOf(alertIds: readonly string[]): Promise<TransitionRow[]> {
    if (alertIds.length === 0) return [];
    return this.sql<TransitionRow>(
      `SELECT t.alert_id, ${isoTs('t.recorded_at')} AS at,
              lower(fs.code) AS from_status, lower(ts.code) AS to_status,
              t.from_owner_team_code AS from_owner, t.to_owner_team_code AS to_owner, t.note
         FROM marketing.insights_alert_transitions t
         LEFT JOIN terminology.catalog_concepts fs ON fs.id = t.from_status_concept_id
         JOIN terminology.catalog_concepts ts ON ts.id = t.to_status_concept_id
        WHERE t.alert_id IN (${placeholders(alertIds)})
        ORDER BY t.recorded_at, t.id`,
      [...alertIds],
    );
  }

  /** `true` si insertó; `false` si otra petición ganó la carrera por el `fingerprint`. */
  async insertAlert(data: InsertAlertData): Promise<boolean> {
    const rows = await this.sql<{ id: string }>(
      `INSERT INTO marketing.insights_alerts
         (id, code, fingerprint, severity_concept_id, title, what_text, detected_on,
          module_code, priority, status_concept_id, owner_team_code,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (?, ?, ?, ?, ?, ?, ?::date, ?, ?, ?, ?,
               clock_timestamp(), clock_timestamp(), ?, ?, 1)
       ON CONFLICT (fingerprint) DO NOTHING
       RETURNING id`,
      [
        randomUUID(),
        data.code,
        data.fingerprint,
        data.severityConceptId,
        data.title,
        data.whatText,
        data.detectedOn,
        data.moduleCode,
        data.priority,
        data.statusConceptId,
        data.ownerTeamCode,
        data.userId,
        data.userId,
      ],
    );
    return rows.length > 0;
  }

  /** Cambia estado y responsable si `rowVersion` sigue siendo la leída; `false` si otra petición la cambió. */
  async updateAlert(
    id: string,
    rowVersion: number,
    statusConceptId: string,
    ownerTeamCode: string | null,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.sql<{ id: string }>(
      `UPDATE marketing.insights_alerts
          SET status_concept_id = ?, owner_team_code = ?, updated_at = clock_timestamp(),
              updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = ? AND row_version = ?
        RETURNING id`,
      [statusConceptId, ownerTeamCode, userId, id, rowVersion],
    );
    return rows.length > 0;
  }

  async insertTransition(data: InsertTransitionData): Promise<void> {
    await this.sql(
      `INSERT INTO marketing.insights_alert_transitions
         (id, alert_id, from_status_concept_id, to_status_concept_id,
          from_owner_team_code, to_owner_team_code, note, recorded_by_user_id, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, clock_timestamp())`,
      [
        randomUUID(),
        data.alertId,
        data.fromStatusConceptId,
        data.toStatusConceptId,
        data.fromOwner,
        data.toOwner,
        data.note,
        data.userId,
      ],
    );
  }

  rules(): Promise<RuleRow[]> {
    return this.sql<RuleRow>(
      `SELECT ${RULE_COLUMNS}
         FROM marketing.insights_alert_rules r
         JOIN terminology.catalog_concepts sev ON sev.id = r.severity_concept_id`,
    );
  }

  ruleByCode(code: string, lock = false): Promise<RuleRow | null> {
    return this.one<RuleRow>(
      `SELECT ${RULE_COLUMNS}
         FROM marketing.insights_alert_rules r
         JOIN terminology.catalog_concepts sev ON sev.id = r.severity_concept_id
        WHERE r.code = ?${lock ? ' FOR UPDATE OF r' : ''}`,
      [code],
    );
  }

  async updateRule(
    code: string,
    rowVersion: number,
    enabled: boolean,
    threshold: number,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.sql<{ id: string }>(
      `UPDATE marketing.insights_alert_rules
          SET enabled = ?, threshold = ?, updated_at = clock_timestamp(),
              updated_by_user_id = ?, row_version = row_version + 1
        WHERE code = ? AND row_version = ?
        RETURNING id`,
      [enabled, threshold, userId, code, rowVersion],
    );
    return rows.length > 0;
  }
}
