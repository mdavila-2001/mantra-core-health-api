import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../common';
import { conceptCode } from '../../common/constants/concept-code';
import {
  catalogControl,
  defectsControl,
  deploymentControl,
  incidentsControl,
  overallStatus,
  qaControl,
  restoreControl,
  sloControl,
  type Control,
} from './domain/readiness';
import { OpsConsoleRepository } from './ops-console.repository';

const iso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null;

/** Versión de la definición de controles: cambiar un control cambia su significado. */
export const READINESS_MODEL_VERSION = 'release-readiness/v1';

/**
 * Consola de operación: lecturas de incidentes, despliegues, cambios, SLO y
 * backups, y la preparación para producción calculada con evidencia. Todo con
 * códigos legibles y fechas UTC; nada se promedia en el frontend.
 */
@Injectable()
export class OpsConsoleService {
  constructor(private readonly repo: OpsConsoleRepository) {}

  async listIncidents(filters: { open?: boolean; limit?: number }) {
    const rows = await this.repo.listIncidents({
      open: filters.open,
      limit: Math.min(filters.limit ?? 50, 200),
    });
    return rows.map((row) => ({
      id: row.id,
      number: row.incident_number,
      title: row.title,
      severity: conceptCode(row.severity_concept_id),
      status: conceptCode(row.status_concept_id),
      component: row.component_code
        ? { code: row.component_code, name: row.component_name }
        : null,
      openedAt: iso(row.opened_at),
      acknowledgedAt: iso(row.acknowledged_at),
      resolvedAt: iso(row.resolved_at),
    }));
  }

  async getIncident(id: string) {
    const found = await this.repo.findIncident(id);
    if (!found)
      throw new ResourceNotFoundException('Incidente no encontrado', { id });
    const { incident, timeline } = found;
    return {
      id: incident.id,
      number: incident.incident_number,
      title: incident.title,
      severity: conceptCode(incident.severity_concept_id),
      status: conceptCode(incident.status_concept_id),
      component: incident.component_code,
      openedAt: iso(incident.opened_at),
      acknowledgedAt: iso(incident.acknowledged_at),
      resolvedAt: iso(incident.resolved_at),
      rootCause: incident.root_cause_text,
      resolution: incident.resolution_text,
      timeline: timeline.map((event) => ({
        at: iso(event.occurred_at),
        type: conceptCode(event.event_type_concept_id),
        actorUserId: event.actor_user_id,
        sourceReference: event.source_reference,
      })),
    };
  }

  async listDeployments(limit?: number) {
    const rows = await this.repo.listDeployments(Math.min(limit ?? 50, 200));
    return rows.map((row) => ({
      id: row.id,
      number: row.deployment_number,
      environment: conceptCode(row.environment_concept_id),
      status: conceptCode(row.status_concept_id),
      strategy: conceptCode(row.strategy_concept_id),
      gitRef: row.git_ref,
      component: row.component_code,
      startedAt: iso(row.started_at),
      finishedAt: iso(row.finished_at),
      isCurrent: row.is_current ?? false,
      rollbackOf: row.rollback_of_deployment_id,
    }));
  }

  async listChangeRequests(limit?: number) {
    const rows = await this.repo.listChangeRequests(Math.min(limit ?? 50, 200));
    return rows.map((row) => ({
      id: row.id,
      number: row.change_number,
      type: conceptCode(row.change_type_concept_id),
      risk: conceptCode(row.risk_level_concept_id),
      status: conceptCode(row.status_concept_id),
      plannedStartAt: iso(row.planned_start_at),
      plannedEndAt: iso(row.planned_end_at),
      implementedAt: iso(row.implemented_at),
    }));
  }

  async listSlos() {
    const rows = await this.repo.listSlos();
    return rows.map((row) => ({
      id: row.id,
      indicator: row.indicator_code
        ? { code: row.indicator_code, name: row.indicator_name }
        : null,
      target: Number(row.target_value),
      // bigint llega como texto desde el driver.
      rollingWindowSeconds:
        row.rolling_window_seconds === null
          ? null
          : Number(row.rolling_window_seconds),
      lastMeasurement: row.measured_at
        ? {
            measuredAt: iso(row.measured_at),
            status: conceptCode(row.status_concept_id),
            attained:
              row.attained_value === null ? null : Number(row.attained_value),
            // Numerador y denominador: el porcentaje sin su base no se puede auditar.
            goodEvents:
              row.good_events === null ? null : Number(row.good_events),
            totalEvents:
              row.total_events === null ? null : Number(row.total_events),
          }
        : null,
    }));
  }

  async listBackups() {
    const rows = await this.repo.listBackupPolicies();
    const pass = this.repo.restorePassConceptId();
    return rows.map((row) => ({
      policyId: row.id,
      rpoSeconds: row.rpo_seconds,
      rtoSeconds: row.rto_seconds,
      restoreTestFrequencyDays: row.restore_test_frequency_days,
      retentionDays: row.retention_days,
      lastRestoreTest: row.test_id
        ? {
            id: row.test_id,
            finishedAt: iso(row.finished_at),
            outcome: row.outcome_concept_id === pass ? 'PASS' : 'FAIL',
            integrityCheckPassed: row.integrity_check_passed,
            measuredRpoSeconds: row.measured_rpo_seconds,
            measuredRtoSeconds: row.measured_rto_seconds,
          }
        : null,
    }));
  }

  /** Preparación para producción: controles con evidencia y veredicto que no promedia. */
  async readiness() {
    const now = new Date();
    const [backups, incidents, slos, suites, defects, deployment, catalog] =
      await Promise.all([
        this.repo.listBackupPolicies(),
        this.repo.listIncidents({ open: true, limit: 200 }),
        this.repo.listSlos(),
        this.repo.lastPlanPerActiveSuite(),
        this.repo.listOpenDefects(),
        this.repo.lastProductionDeployment(),
        this.repo.catalogReview(),
      ]);
    const pass = this.repo.restorePassConceptId();
    const controls: Control[] = [
      restoreControl(
        backups.map((row) => ({
          policyId: row.id,
          rpoSeconds: row.rpo_seconds,
          rtoSeconds: row.rto_seconds,
          testFrequencyDays: row.restore_test_frequency_days,
          lastTest: row.test_id
            ? {
                id: row.test_id,
                finishedAt: row.finished_at ? new Date(row.finished_at) : null,
                outcomePass: row.outcome_concept_id === pass,
                integrityPassed: row.integrity_check_passed,
                measuredRpoSeconds: row.measured_rpo_seconds,
                measuredRtoSeconds: row.measured_rto_seconds,
              }
            : null,
        })),
        now,
      ),
      incidentsControl(
        incidents.map((row) => ({
          id: row.id,
          number: row.incident_number,
          severity: conceptCode(row.severity_concept_id) ?? 'UNKNOWN',
          status: conceptCode(row.status_concept_id) ?? 'UNKNOWN',
          openedAt: row.opened_at ? new Date(row.opened_at) : null,
        })),
      ),
      sloControl(
        slos.map((row) => ({
          sloId: row.indicator_code ?? row.id,
          target: row.target_value,
          lastMeasurement: row.measured_at
            ? {
                status: conceptCode(row.status_concept_id) ?? 'UNKNOWN',
                measuredAt: new Date(row.measured_at),
                attained: row.attained_value,
              }
            : null,
        })),
        now,
      ),
      qaControl(
        suites.map((row) => ({
          suiteId: row.suite_id,
          suiteCode: row.suite_code,
          lastPlan: row.plan_id
            ? {
                id: row.plan_id,
                status: row.plan_status ?? 'UNKNOWN',
                finishedAt: row.finished_at ? new Date(row.finished_at) : null,
              }
            : null,
        })),
        now,
      ),
      defectsControl(
        defects.map((row) => ({
          id: row.id,
          number: row.defect_number,
          severity: conceptCode(row.severity_concept_id) ?? 'UNKNOWN',
          status: conceptCode(row.status_concept_id) ?? 'UNKNOWN',
        })),
      ),
      deploymentControl(
        deployment
          ? {
              id: deployment.id,
              number: deployment.deployment_number,
              status: conceptCode(deployment.status_concept_id) ?? 'UNKNOWN',
              finishedAt: deployment.finished_at
                ? new Date(deployment.finished_at)
                : null,
            }
          : null,
      ),
      catalogControl({
        hasScan: catalog?.has_scan ?? false,
        reviewed: catalog?.reviewed ?? 0,
        denominator: catalog?.observed ?? 0,
      }),
    ];
    return {
      modelVersion: READINESS_MODEL_VERSION,
      evaluatedAt: now.toISOString(),
      ...overallStatus(controls),
      controls,
      notImplemented: [
        'Excepciones con owner, motivo y vencimiento',
        'Control de autorización/aislamiento (RLS efectivo): la API conecta como superusuario (ADR-0023)',
      ],
    };
  }
}
