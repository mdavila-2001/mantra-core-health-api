import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
} from '../../../common';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import {
  INSIGHTS_ALERT_SEVERITIES,
  INSIGHTS_ALERT_STATUSES,
  INSIGHTS_OWNER_TEAMS,
  INSIGHTS_RULE_CODES,
  INSIGHTS_RULE_THRESHOLD_MAX,
  INSIGHTS_RULE_THRESHOLD_MIN,
  type InsightsAlertRuleDto,
  type InsightsAlertWorkflowDto,
  type InsightsEnvelope,
  type PatchAlertRuleDto,
  type PutAlertWorkflowDto,
} from '../dto/insights-workspace.dto';
import { MarketingErrorReason } from '../marketing.error-reasons';
import {
  ALERT_SEVERITY_VALUE_SET,
  ALERT_STATUS_VALUE_SET,
  InsightsWorkflowRepository,
  type AlertRow,
  type RuleRow,
  type TransitionRow,
} from '../repositories/insights-workflow.repository';
import { InsightsFactsService } from './insights-facts.service';
import {
  assertVersion,
  ifMatchRequired,
  parseIfMatch,
  versionMismatch,
} from './insights-if-match';

/** Una alerta recién detectada empieza «nueva» y sin responsable. */
const BASELINE_STATUS = 'new';

const pick = <T extends string>(
  allowed: readonly T[],
  value: string | null,
): T | null => allowed.find((item) => item === value) ?? null;

/** Código legible y estable de una alerta creada desde el flujo de trabajo. */
export function alertCodeOf(fingerprint: string): string {
  return `A-${createHash('sha256').update(fingerprint).digest('hex').slice(0, 10).toUpperCase()}`;
}

/**
 * Alertas y reglas de AloVida Insights: lo que las personas hacen con ellas.
 * Son compartidas (sin `user_id`); cada cambio de estado o responsable deja una
 * fila en `insights_alert_transitions`, y toda modificación se protege con
 * `If-Match`/`row_version`.
 */
@Injectable()
export class InsightsWorkflowService {
  constructor(
    private readonly repo: InsightsWorkflowRepository,
    private readonly facts: InsightsFactsService,
  ) {}

  private assertFingerprint(value: string): string {
    const fingerprint = value.trim();
    if (
      fingerprint.length < 1 ||
      fingerprint.length > 200 ||
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u001f]/.test(fingerprint)
    ) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'El fingerprint de la alerta debe tener entre 1 y 200 caracteres',
        undefined,
        MarketingErrorReason.INSIGHTS_FINGERPRINT_INVALID,
      );
    }
    return fingerprint;
  }

  private async envelope<T>(data: T): Promise<InsightsEnvelope<T>> {
    return { data, meta: await this.facts.meta(null, []) };
  }

  private toWorkflow(
    row: AlertRow,
    transitions: readonly TransitionRow[],
  ): InsightsAlertWorkflowDto {
    return {
      fingerprint: row.fingerprint,
      status: pick(INSIGHTS_ALERT_STATUSES, row.status_code) ?? 'new',
      ownerTeam: pick(INSIGHTS_OWNER_TEAMS, row.owner_team_code),
      rowVersion: Number(row.row_version),
      updatedAt: row.updated_at,
      transitions: transitions.map((t) => ({
        at: t.at,
        fromStatus: pick(INSIGHTS_ALERT_STATUSES, t.from_status),
        toStatus: pick(INSIGHTS_ALERT_STATUSES, t.to_status) ?? 'new',
        fromOwner: pick(INSIGHTS_OWNER_TEAMS, t.from_owner),
        toOwner: pick(INSIGHTS_OWNER_TEAMS, t.to_owner),
        note: t.note,
      })),
    };
  }

  /** El estado de todas las alertas que existen (las que alguien tocó o el motor guardó). */
  async listWorkflow(): Promise<InsightsEnvelope<InsightsAlertWorkflowDto[]>> {
    const alerts = await this.repo.alerts();
    const transitions = await this.repo.transitionsOf(alerts.map((a) => a.id));
    const byAlert = new Map<string, TransitionRow[]>();
    for (const t of transitions) {
      byAlert.set(t.alert_id, [...(byAlert.get(t.alert_id) ?? []), t]);
    }
    return this.envelope(
      alerts.map((a) => this.toWorkflow(a, byAlert.get(a.id) ?? [])),
    );
  }

  /**
   * Cambia el estado y/o el responsable de una alerta, identificada por su
   * `fingerprint`. La primera vez la crea con el `snapshot` (el API no detecta
   * alertas: las detecta la pantalla). Escribe una transición solo si cambia
   * el estado o el responsable.
   */
  async putWorkflow(
    rawFingerprint: string,
    dto: PutAlertWorkflowDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsAlertWorkflowDto>> {
    const fingerprint = this.assertFingerprint(rawFingerprint);
    const expected = parseIfMatch(ifMatch);
    const note = dto.note?.trim() ? dto.note.trim() : null;

    const result = await this.repo.transaction(async (tx) => {
      const statusIds = await tx.conceptIds(ALERT_STATUS_VALUE_SET);
      const idOfStatus = (code: string): string => {
        const id = statusIds.get(code);
        if (!id) {
          throw new Error(
            `El value set ${ALERT_STATUS_VALUE_SET} no tiene el concepto «${code}»`,
          );
        }
        return id;
      };

      let row = await tx.alertByFingerprint(fingerprint, true);
      let created = false;
      if (!row) {
        assertVersion(expected, null);
        const severityIds = await tx.conceptIds(ALERT_SEVERITY_VALUE_SET);
        const severityId = severityIds.get(dto.snapshot.severity);
        if (!severityId) {
          throw new Error(
            `El value set ${ALERT_SEVERITY_VALUE_SET} no tiene el concepto «${dto.snapshot.severity}»`,
          );
        }
        created = await tx.insertAlert({
          code: alertCodeOf(fingerprint),
          fingerprint,
          severityConceptId: severityId,
          title: dto.snapshot.title,
          whatText: dto.snapshot.whatText,
          detectedOn: dto.snapshot.detectedOn,
          moduleCode: dto.snapshot.moduleCode,
          priority: dto.snapshot.priority,
          statusConceptId: idOfStatus(dto.status),
          ownerTeamCode: dto.ownerTeam,
          userId: actor.id,
        });
        row = await tx.alertByFingerprint(fingerprint, true);
        if (!row) throw new Error('La alerta recién insertada no se encuentra');
        // Otra petición la creó entre la lectura y el alta: esta ya es una edición.
        if (!created) assertVersion(expected, Number(row.row_version));
      } else {
        assertVersion(expected, Number(row.row_version));
      }

      const fromStatus = created ? BASELINE_STATUS : row.status_code;
      const fromOwner = created ? null : row.owner_team_code;
      const changed = fromStatus !== dto.status || fromOwner !== dto.ownerTeam;

      if (changed) {
        if (!created) {
          const updated = await tx.updateAlert(
            row.id,
            Number(row.row_version),
            idOfStatus(dto.status),
            dto.ownerTeam,
            actor.id,
          );
          if (!updated) throw versionMismatch(expected, null);
        }
        await tx.insertTransition({
          alertId: row.id,
          fromStatusConceptId: idOfStatus(fromStatus),
          toStatusConceptId: idOfStatus(dto.status),
          fromOwner,
          toOwner: dto.ownerTeam,
          note,
          userId: actor.id,
        });
      }

      const fresh = await tx.alertByFingerprint(fingerprint);
      if (!fresh) throw new Error('La alerta guardada no se encuentra');
      return this.toWorkflow(fresh, await tx.transitionsOf([fresh.id]));
    });
    return this.envelope(result);
  }

  private toRule(row: RuleRow): InsightsAlertRuleDto {
    const severity = pick(INSIGHTS_ALERT_SEVERITIES, row.severity);
    const code = pick(INSIGHTS_RULE_CODES, row.code);
    if (!severity || !code) {
      throw new Error(
        `Regla de alerta desconocida: ${row.code}/${row.severity}`,
      );
    }
    return {
      code,
      name: row.name,
      description: row.description,
      severity,
      unit: row.unit,
      threshold: Number(row.threshold),
      defaultThreshold: Number(row.default_threshold),
      direction: row.direction === '-' ? '-' : '+',
      enabled: row.enabled,
      rowVersion: Number(row.row_version),
    };
  }

  async listRules(): Promise<InsightsEnvelope<InsightsAlertRuleDto[]>> {
    const rules = (await this.repo.rules()).map((row) => this.toRule(row));
    rules.sort(
      (a, b) =>
        INSIGHTS_RULE_CODES.indexOf(a.code) -
        INSIGHTS_RULE_CODES.indexOf(b.code),
    );
    return this.envelope(rules);
  }

  /** Enciende, apaga o cambia el umbral (1 a 500) de una regla. `If-Match` obligatorio. */
  async patchRule(
    code: string,
    dto: PatchAlertRuleDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsAlertRuleDto>> {
    const expected = parseIfMatch(ifMatch);
    if (expected === null) throw ifMatchRequired();
    if (dto.enabled === undefined && dto.threshold === undefined) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'El cuerpo debe traer enabled o threshold',
        undefined,
        MarketingErrorReason.INSIGHTS_BODY_INVALID,
      );
    }
    if (
      dto.threshold !== undefined &&
      !(
        Number.isFinite(dto.threshold) &&
        dto.threshold >= INSIGHTS_RULE_THRESHOLD_MIN &&
        dto.threshold <= INSIGHTS_RULE_THRESHOLD_MAX
      )
    ) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        `El umbral debe estar entre ${INSIGHTS_RULE_THRESHOLD_MIN} y ${INSIGHTS_RULE_THRESHOLD_MAX}`,
        { min: INSIGHTS_RULE_THRESHOLD_MIN, max: INSIGHTS_RULE_THRESHOLD_MAX },
        MarketingErrorReason.INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE,
      );
    }

    const rule = await this.repo.transaction(async (tx) => {
      const row = await tx.ruleByCode(code, true);
      if (!row) {
        throw new ResourceNotFoundException(
          'La regla de alerta no existe',
          { code },
          MarketingErrorReason.INSIGHTS_RULE_NOT_FOUND,
        );
      }
      assertVersion(expected, Number(row.row_version));
      const enabled = dto.enabled ?? row.enabled;
      const threshold = dto.threshold ?? Number(row.threshold);
      if (enabled === row.enabled && threshold === Number(row.threshold)) {
        return this.toRule(row);
      }
      const updated = await tx.updateRule(
        code,
        Number(row.row_version),
        enabled,
        threshold,
        actor.id,
      );
      if (!updated) throw versionMismatch(expected, null);
      const fresh = await tx.ruleByCode(code);
      if (!fresh) throw new Error('La regla guardada no se encuentra');
      return this.toRule(fresh);
    });
    return this.envelope(rule);
  }
}
