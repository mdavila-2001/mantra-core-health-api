import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../common';
import { SYSOPS } from '../system_ops/system_ops.concepts';

/** Estados de incidente que siguen vivos. */
const OPEN_INCIDENT = [
  CONCEPTS.INCIDENT_OPEN,
  CONCEPTS.INCIDENT_ACKNOWLEDGED,
  CONCEPTS.INCIDENT_MITIGATED,
];
const OPEN_DEFECT = [
  CONCEPTS.DEFECT_OPEN,
  CONCEPTS.DEFECT_TRIAGED,
  CONCEPTS.DEFECT_IN_PROGRESS,
];

/**
 * Lecturas de operación y gobierno para la consola: sólo SELECT sobre los
 * schemas de los módulos 11, 36, 46, 67 y 68. Este módulo no tiene tablas ni
 * escribe en las de otros.
 */
@Injectable()
export class OpsConsoleRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  /** `IN (?, ?, …)` con un parámetro por valor (el driver no expande bien arrays tipados). */
  private list(values: readonly string[]) {
    return { clause: values.map(() => '?').join(', '), params: [...values] };
  }

  listIncidents(filters: { open?: boolean; limit: number }) {
    const open = this.list(OPEN_INCIDENT);
    return this.sql<{
      id: string;
      incident_number: string;
      severity_concept_id: string;
      status_concept_id: string;
      opened_at: Date | null;
      acknowledged_at: Date | null;
      resolved_at: Date | null;
      component_code: string | null;
      component_name: string | null;
      title: string | null;
    }>(
      // `title` existe en el DDL canónico pero no en la entidad del ORM: se lee
      // por JSON para no romper en una base creada sólo desde las entidades.
      `SELECT i.id, i.incident_number, i.severity_concept_id, i.status_concept_id,
              i.opened_at, i.acknowledged_at, i.resolved_at, to_jsonb(i)->>'title' AS title,
              c.code AS component_code, c.name AS component_name
         FROM platform_ops.health_incidents i
         LEFT JOIN platform_ops.service_components c ON c.id = i.service_component_id
        ${filters.open ? `WHERE i.status_concept_id IN (${open.clause})` : ''}
        ORDER BY i.opened_at DESC NULLS LAST, i.id
        LIMIT ?`,
      [...(filters.open ? open.params : []), filters.limit],
    );
  }

  async findIncident(id: string) {
    const [incident] = await this.sql<{
      id: string;
      incident_number: string;
      severity_concept_id: string;
      status_concept_id: string;
      opened_at: Date | null;
      acknowledged_at: Date | null;
      resolved_at: Date | null;
      root_cause_text: string | null;
      resolution_text: string | null;
      component_code: string | null;
      title: string | null;
    }>(
      `SELECT i.id, i.incident_number, i.severity_concept_id, i.status_concept_id,
              i.opened_at, i.acknowledged_at, i.resolved_at, i.root_cause_text, i.resolution_text,
              to_jsonb(i)->>'title' AS title,
              c.code AS component_code
         FROM platform_ops.health_incidents i
         LEFT JOIN platform_ops.service_components c ON c.id = i.service_component_id
        WHERE i.id = ?`,
      [id],
    );
    if (!incident) return null;
    const timeline = await this.sql<{
      occurred_at: Date;
      event_type_concept_id: string;
      actor_user_id: string | null;
      source_reference: string | null;
    }>(
      `SELECT occurred_at, event_type_concept_id, actor_user_id, source_reference
         FROM platform_ops.incident_timeline_events
        WHERE health_incident_id = ?
        ORDER BY occurred_at, id LIMIT 500`,
      [id],
    );
    return { incident, timeline };
  }

  listDeployments(limit: number) {
    return this.sql<{
      id: string;
      deployment_number: string;
      environment_concept_id: string;
      status_concept_id: string;
      strategy_concept_id: string;
      git_ref: string | null;
      started_at: Date | null;
      finished_at: Date | null;
      is_current: boolean | null;
      rollback_of_deployment_id: string | null;
      component_code: string | null;
    }>(
      `SELECT d.id, d.deployment_number, d.environment_concept_id, d.status_concept_id,
              d.strategy_concept_id, d.git_ref, d.started_at, d.finished_at, d.is_current,
              d.rollback_of_deployment_id, c.code AS component_code
         FROM platform_ops.deployments d
         LEFT JOIN platform_ops.service_components c ON c.id = d.service_component_id
        ORDER BY d.created_at DESC, d.id LIMIT ?`,
      [limit],
    );
  }

  listChangeRequests(limit: number) {
    return this.sql<{
      id: string;
      change_number: string;
      change_type_concept_id: string;
      risk_level_concept_id: string;
      status_concept_id: string;
      planned_start_at: Date | null;
      planned_end_at: Date | null;
      implemented_at: Date | null;
    }>(
      `SELECT id, change_number, change_type_concept_id, risk_level_concept_id, status_concept_id,
              planned_start_at, planned_end_at, implemented_at
         FROM platform_ops.change_requests
        ORDER BY created_at DESC, id LIMIT ?`,
      [limit],
    );
  }

  /** SLO activos con su última medición. */
  listSlos() {
    return this.sql<{
      id: string;
      target_value: string;
      rolling_window_seconds: number | null;
      indicator_code: string | null;
      indicator_name: string | null;
      measured_at: Date | null;
      status_concept_id: string | null;
      attained_value: string | null;
      good_events: string | null;
      total_events: string | null;
    }>(
      `SELECT o.id, o.target_value::text AS target_value, o.rolling_window_seconds,
              i.code AS indicator_code, i.name AS indicator_name,
              m.measured_at, m.status_concept_id, m.attained_value::text AS attained_value,
              m.good_events::text AS good_events, m.total_events::text AS total_events
         FROM platform_ops.service_level_objectives o
         LEFT JOIN platform_ops.service_level_indicators i ON i.id = o.service_level_indicator_id
         LEFT JOIN LATERAL (
           SELECT measured_at, status_concept_id, attained_value, good_events, total_events
             FROM platform_ops.slo_measurements
            WHERE service_level_objective_id = o.id
            ORDER BY measured_at DESC LIMIT 1) m ON true
        WHERE o.state_concept_id = ?
          AND (o.effective_to IS NULL OR o.effective_to > now())
        ORDER BY i.code NULLS LAST, o.id`,
      [CONCEPTS.STATE_ACTIVE],
    );
  }

  /** Políticas de backup activas con su última prueba de restauración. */
  listBackupPolicies() {
    return this.sql<{
      id: string;
      rpo_seconds: number;
      rto_seconds: number;
      restore_test_frequency_days: number | null;
      retention_days: number | null;
      test_id: string | null;
      finished_at: Date | null;
      outcome_concept_id: string | null;
      integrity_check_passed: boolean | null;
      measured_rpo_seconds: number | null;
      measured_rto_seconds: number | null;
    }>(
      `SELECT p.id, p.rpo_seconds, p.rto_seconds, p.restore_test_frequency_days, p.retention_days,
              t.id AS test_id, t.finished_at, t.outcome_concept_id, t.integrity_check_passed,
              t.measured_rpo_seconds, t.measured_rto_seconds
         FROM system_ops.backup_policies p
         LEFT JOIN LATERAL (
           SELECT id, finished_at, outcome_concept_id, integrity_check_passed,
                  measured_rpo_seconds, measured_rto_seconds
             FROM system_ops.restore_test_runs
            WHERE backup_policy_id = p.id
            ORDER BY finished_at DESC NULLS LAST LIMIT 1) t ON true
        WHERE p.status_concept_id = ?
        ORDER BY p.created_at, p.id`,
      [CONCEPTS.STATE_ACTIVE],
    );
  }

  restorePassConceptId() {
    return SYSOPS.RESTORE_OUTCOME_PASS;
  }

  listOpenDefects() {
    const open = this.list(OPEN_DEFECT);
    return this.sql<{
      id: string;
      defect_number: string;
      severity_concept_id: string;
      status_concept_id: string;
    }>(
      `SELECT id, defect_number, severity_concept_id, status_concept_id
         FROM qa_lab.test_defects WHERE status_concept_id IN (${open.clause})`,
      open.params,
    );
  }

  /** Último plan del servidor por suite activa (el gate de QA). */
  lastPlanPerActiveSuite() {
    return this.sql<{
      suite_id: string;
      suite_code: string;
      plan_id: string | null;
      plan_status: string | null;
      finished_at: Date | null;
    }>(
      `SELECT s.id AS suite_id, s.code AS suite_code, p.id AS plan_id, p.status AS plan_status, p.finished_at
         FROM qa_lab.test_suites s
         LEFT JOIN LATERAL (
           SELECT id, status, finished_at FROM qa_execution.execution_plans
            WHERE suite_id = s.id AND finished_at IS NOT NULL
            ORDER BY finished_at DESC LIMIT 1) p ON true
        WHERE s.state_concept_id = ?
        ORDER BY s.code`,
      [CONCEPTS.SUITE_ACTIVE],
    );
  }

  async lastProductionDeployment() {
    const [row] = await this.sql<{
      id: string;
      deployment_number: string;
      status_concept_id: string;
      finished_at: Date | null;
    }>(
      `SELECT id, deployment_number, status_concept_id, finished_at
         FROM platform_ops.deployments
        WHERE environment_concept_id = ?
        ORDER BY created_at DESC LIMIT 1`,
      [CONCEPTS.OPS_ENV_PRODUCTION],
    );
    return row ?? null;
  }

  /** Revisión del catálogo: objetos observados con ficha aprobada vigente. */
  async catalogReview() {
    const [row] = await this.sql<{
      has_scan: boolean;
      observed: number;
      reviewed: number;
    }>(
      `SELECT EXISTS (SELECT 1 FROM data_catalog.catalog_scan_runs WHERE status = 'SUCCEEDED') AS has_scan,
              (SELECT count(*)::int FROM data_catalog.catalog_objects WHERE observation_status = 'OBSERVED') AS observed,
              (SELECT count(*)::int FROM data_catalog.catalog_objects o
                 JOIN data_catalog.catalog_annotations a ON a.object_id = o.id AND a.target_kind = 'OBJECT'
                WHERE o.observation_status = 'OBSERVED' AND a.review_status = 'APPROVED'
                  AND a.approved_revision_no = a.current_revision_no) AS reviewed`,
    );
    return row;
  }
}
