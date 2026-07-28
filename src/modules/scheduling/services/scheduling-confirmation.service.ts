import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SCHED } from '../scheduling.concepts';
import { SchedulingConfirmationRepository } from '../repositories';
import type { BookingConfirmationRules, RuleCondition } from '../entities';
import {
  CreateConfirmationRuleDto,
  ConfirmationRuleResponseDto,
  EvaluateBookingResultDto,
  type RuleScope,
  type RuleDecision,
} from '../dto';

const SCOPE_CONCEPT: Readonly<Record<RuleScope, string>> = {
  TENANT: SCHED.RULE_SCOPE_TENANT,
  PRACTICE: SCHED.RULE_SCOPE_PRACTICE,
  RESOURCE: SCHED.RULE_SCOPE_RESOURCE,
  SERVICE: SCHED.RULE_SCOPE_SERVICE,
};

/** Rango de especificidad por tipo de alcance (mayor = más específico). */
const SCOPE_RANK: Readonly<Record<string, number>> = {
  [SCHED.RULE_SCOPE_TENANT]: 0,
  [SCHED.RULE_SCOPE_PRACTICE]: 1,
  [SCHED.RULE_SCOPE_SERVICE]: 2,
  [SCHED.RULE_SCOPE_RESOURCE]: 3,
};

const DECISION_CONCEPT: Readonly<Record<RuleDecision, string>> = {
  AUTO_CONFIRM: SCHED.DECISION_AUTO_CONFIRM,
  AUTO_REJECT: SCHED.DECISION_AUTO_REJECT,
  MANUAL_REVIEW: SCHED.DECISION_MANUAL_REVIEW,
};

const CONCEPT_DECISION: Readonly<Record<string, RuleDecision>> = {
  [SCHED.DECISION_AUTO_CONFIRM]: 'AUTO_CONFIRM',
  [SCHED.DECISION_AUTO_REJECT]: 'AUTO_REJECT',
  [SCHED.DECISION_MANUAL_REVIEW]: 'MANUAL_REVIEW',
};

/** Valores de alcance que aporta la solicitud, por tipo de alcance. */
export interface ScopeValues {
  practiceId?: string;
  resourceId?: string;
  serviceConceptId?: string;
}

/**
 * Motor de confirmación automática de reservas (C-11).
 *
 * CRUD de reglas (sin borrado duro: `enabled`/`version`) y evaluación determinista
 * de una solicitud contra las reglas activas y vigentes de su alcance. La decisión
 * es reproducible: mismas reglas + mismos datos congelados ⇒ misma salida.
 */
@Injectable()
export class SchedulingConfirmationService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SchedulingConfirmationRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingConfirmationService.name);
  }

  /** Crea una regla activa en su versión 1. */
  async createRule(
    dto: CreateConfirmationRuleDto,
    actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    this.logger.info(
      { operation: 'scheduling.confirmation-rule.create', tenantId: dto.tenantId },
      'Creating booking confirmation rule',
    );

    return this.em.transactional(async (tx) => {
      const rule = this.repo.createRule(tx, {
        tenantId: dto.tenantId,
        scopeTypeConceptId: SCOPE_CONCEPT[dto.scope],
        scopeId: dto.scopeId,
        priority: dto.priority ?? 100,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        conditionJson: dto.condition,
        decisionConceptId: DECISION_CONCEPT[dto.decision],
        actorUserId: actor.id,
      });
      return this.toResponse(rule);
    });
  }

  /** Reactiva una regla desactivada, subiendo su versión. */
  activateRule(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.setEnabled(id, true, actor);
  }

  /** Desactiva una regla (no se borra en duro), subiendo su versión. */
  deactivateRule(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.setEnabled(id, false, actor);
  }

  private async setEnabled(
    id: string,
    enabled: boolean,
    actor: AuthenticatedUser,
  ): Promise<ConfirmationRuleResponseDto> {
    return this.em.transactional(async (tx) => {
      const rule = await this.repo.findRuleByIdForUpdate(tx, id);
      if (!rule) {
        throw new ResourceNotFoundException('Regla no encontrada', { id });
      }
      rule.enabled = enabled;
      rule.version += 1;
      touch(rule, actor.id);
      return this.toResponse(rule);
    });
  }

  /** Lista las reglas de un tenant (por defecto sólo las habilitadas). */
  async listRules(
    tenantId: string,
    includeDisabled = false,
  ): Promise<ConfirmationRuleResponseDto[]> {
    const rules = await this.repo.findRulesByTenant(
      this.em,
      tenantId,
      !includeDisabled,
    );
    return rules.map((rule) => this.toResponse(rule));
  }

  /**
   * Evalúa una solicitud de reserva de forma determinista (C-11).
   *
   * Filtra las reglas activas y vigentes del alcance, las ordena por especificidad
   * y prioridad, y aplica la PRIMERA regla concluyente. Un empate de prioridad (misma
   * especificidad y prioridad) con decisiones distintas se resuelve a MANUAL_REVIEW.
   * Si ninguna regla concluye, MANUAL_REVIEW (fail-closed). La evaluación se hace
   * SIEMPRE contra `requestData` congelado.
   */
  async evaluateBookingRequest(
    tenantId: string,
    requestData: Record<string, unknown>,
    scope: ScopeValues = {},
    now: Date = new Date(),
  ): Promise<EvaluateBookingResultDto> {
    const rules = await this.repo.findActiveRules(this.em, tenantId, now);

    // 1) Reglas cuyo alcance aplica a esta solicitud.
    const inScope = rules.filter((rule) => this.isInScope(rule, scope));

    // 2) Reglas concluyentes: su condición se satisface con los datos congelados.
    const evaluatedRuleIds: string[] = [];
    const conclusive = inScope.filter((rule) => {
      evaluatedRuleIds.push(rule.id);
      return this.evalCondition(rule.conditionJson, requestData);
    });

    if (conclusive.length === 0) {
      return this.result('MANUAL_REVIEW', {
        reason: 'Ninguna regla activa y vigente concluyó (fail-closed).',
        variables: requestData,
        evaluatedRuleIds,
      });
    }

    // 3) Orden por especificidad desc, prioridad asc, antigüedad asc.
    conclusive.sort((a, b) => {
      const specDiff = this.specificity(b) - this.specificity(a);
      if (specDiff !== 0) return specDiff;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // 4) Empate en el tramo superior (misma especificidad y prioridad) con
    //    decisiones distintas ⇒ MANUAL_REVIEW.
    const top = conclusive[0];
    const topTier = conclusive.filter(
      (rule) =>
        this.specificity(rule) === this.specificity(top) &&
        rule.priority === top.priority,
    );
    const distinctDecisions = new Set(
      topTier.map((rule) => rule.decisionConceptId),
    );
    if (distinctDecisions.size > 1) {
      return this.result('MANUAL_REVIEW', {
        reason:
          'Empate de prioridad entre reglas con decisiones distintas: se enruta a revisión manual.',
        variables: requestData,
        evaluatedRuleIds,
      });
    }

    // 5) Primera regla concluyente del tramo superior.
    const decision = CONCEPT_DECISION[top.decisionConceptId] ?? 'MANUAL_REVIEW';
    this.logger.info(
      {
        operation: 'scheduling.confirmation.evaluate',
        tenantId,
        ruleId: top.id,
        ruleVersion: top.version,
        decision,
      },
      'Booking request evaluated by confirmation engine',
    );
    return this.result(decision, {
      ruleId: top.id,
      ruleVersion: top.version,
      reason: `Regla ${top.id} (v${top.version}) aplicada por especificidad y prioridad.`,
      variables: requestData,
      evaluatedRuleIds,
    });
  }

  // --- Alcance -------------------------------------------------------------

  /** ¿Aplica el alcance de la regla a esta solicitud? */
  private isInScope(rule: BookingConfirmationRules, scope: ScopeValues): boolean {
    // scope_id nulo ⇒ regla amplia sobre todo el tipo de alcance (aplica siempre
    // dentro del tenant ya filtrado).
    if (!rule.scopeId) return true;

    const requestValue = this.scopeValueFor(rule.scopeTypeConceptId, scope);
    return requestValue !== undefined && requestValue === rule.scopeId;
  }

  private scopeValueFor(
    scopeTypeConceptId: string,
    scope: ScopeValues,
  ): string | undefined {
    if (scopeTypeConceptId === SCHED.RULE_SCOPE_PRACTICE)
      return scope.practiceId;
    if (scopeTypeConceptId === SCHED.RULE_SCOPE_RESOURCE)
      return scope.resourceId;
    if (scopeTypeConceptId === SCHED.RULE_SCOPE_SERVICE)
      return scope.serviceConceptId;
    return undefined; // TENANT con scope_id concreto no se acota por valor de solicitud
  }

  private specificity(rule: BookingConfirmationRules): number {
    const rank = SCOPE_RANK[rule.scopeTypeConceptId] ?? 0;
    return (rule.scopeId ? 100 : 0) + rank;
  }

  // --- Evaluación de condiciones (fail-closed) -----------------------------

  /**
   * Evalúa una condición contra los datos congelados. Cualquier forma no
   * reconocida se considera NO satisfecha: una regla que no se puede leer no
   * decide (fail-closed).
   */
  private evalCondition(
    cond: RuleCondition | unknown,
    data: Record<string, unknown>,
  ): boolean {
    if (cond == null || typeof cond !== 'object') return false;
    const c = cond as Record<string, unknown>;

    if (Array.isArray(c.all)) {
      return (
        c.all.length > 0 && c.all.every((x) => this.evalCondition(x, data))
      );
    }
    if (Array.isArray(c.any)) {
      return c.any.length > 0 && c.any.some((x) => this.evalCondition(x, data));
    }
    if ('not' in c) {
      // Sólo se niega una condición reconocible; si no lo es, fail-closed.
      if (!this.isRecognized(c.not)) return false;
      return !this.evalCondition(c.not, data);
    }
    if (typeof c.field === 'string' && typeof c.op === 'string') {
      return this.evalLeaf(c.field, c.op, c.value, data);
    }
    return false;
  }

  private isRecognized(x: unknown): boolean {
    if (x == null || typeof x !== 'object') return false;
    const c = x as Record<string, unknown>;
    return (
      Array.isArray(c.all) ||
      Array.isArray(c.any) ||
      'not' in c ||
      (typeof c.field === 'string' && typeof c.op === 'string')
    );
  }

  private evalLeaf(
    field: string,
    op: string,
    value: unknown,
    data: Record<string, unknown>,
  ): boolean {
    const actual = this.readPath(data, field);
    switch (op) {
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'eq':
        return actual === value;
      case 'ne':
        return actual !== value;
      case 'in':
        return Array.isArray(value) && value.includes(actual);
      case 'nin':
        return Array.isArray(value) && !value.includes(actual);
      case 'gt':
        return typeof actual === 'number' && typeof value === 'number'
          ? actual > value
          : false;
      case 'gte':
        return typeof actual === 'number' && typeof value === 'number'
          ? actual >= value
          : false;
      case 'lt':
        return typeof actual === 'number' && typeof value === 'number'
          ? actual < value
          : false;
      case 'lte':
        return typeof actual === 'number' && typeof value === 'number'
          ? actual <= value
          : false;
      default:
        return false; // operador desconocido ⇒ fail-closed
    }
  }

  private readPath(source: Record<string, unknown>, path: string): unknown {
    let current: unknown = source;
    for (const segment of path.split('.')) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  // --- Helpers de forma ----------------------------------------------------

  private result(
    decision: RuleDecision,
    explanation: {
      ruleId?: string;
      ruleVersion?: number;
      reason: string;
      variables: Record<string, unknown>;
      evaluatedRuleIds: string[];
    },
  ): EvaluateBookingResultDto {
    return {
      decision,
      decisionConceptId: DECISION_CONCEPT[decision],
      explanation,
    };
  }

  private toResponse(
    rule: BookingConfirmationRules,
  ): ConfirmationRuleResponseDto {
    return {
      id: rule.id,
      scopeTypeConceptId: rule.scopeTypeConceptId,
      scopeId: rule.scopeId,
      priority: rule.priority,
      decisionConceptId: rule.decisionConceptId,
      enabled: rule.enabled,
      version: rule.version,
    };
  }
}
