import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { getAuditRequestContext } from '../../../common';
import {
  SupportAccessReason,
  evaluateSupportAccessV2,
  primaryAtomOf,
  type EngagementFacts,
  type SupportAccessContext,
  type SupportAccessDecision,
  type SupportAccessQuery,
  type SupportCondition,
  type SupportEvaluationResult,
  type UsageSnapshot,
} from '../domain';
import {
  atomsOfGrant,
  denyApplies,
  evaluateCandidate,
  type CandidateEval,
  type Pair,
} from '../domain/support-access.candidates';
import { withinWindow } from '../domain/support-access.coverage';
import { AccessDecisionRecorder } from './access-decision-recorder.service';
import { AccessUsageRecorder } from './access-usage-recorder';
import { SupportAccessContextLoader } from './support-access-context.loader';
import {
  SupportApprovalGate,
  type ApprovalProblem,
} from './support-approval-gate';
import { SupportGovernanceRules } from './support-governance-rules.reader';
import { SupportUsageCounter } from './support-usage-counter';

/** Datos de una decisión completa. */
export interface PipelineInput {
  /** Contexto de lectura o transacción activa. */
  readonly em: EntityManager;
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo. */
  readonly userId: string;
  /** Vínculos de la persona (ya cargados). */
  readonly engagements: readonly EngagementFacts[];
  /** Acción, objetivo y contexto. */
  readonly query: SupportAccessQuery;
  /** Instante de la decisión (por defecto, el del contexto o ahora). */
  readonly now?: Date;
  /** `false` en explicar/simular: no consume, no registra, no cuenta. */
  readonly sideEffects?: boolean;
  /**
   * Completa el contexto con datos que cuestan una consulta (la hora de la
   * cita): solo se invoca si alguna condición los usa (`appointment`), así que un
   * permiso sin condiciones no paga nada por ellos.
   */
  readonly completeContext?: () => Promise<Partial<SupportAccessContext>>;
}

/** Resultado de la decisión completa. */
export interface PipelineResult extends SupportEvaluationResult {
  /** Regla de la organización que decidió, si fue una. */
  readonly ruleId?: string;
}

/**
 * Orquesta UNA decisión de la política del personal de apoyo
 * (CONTRATO-GOBIERNO §8.2 puntos 5 y 6):
 *
 *  1. reglas de la organización (caché) y contexto del PIP (ip, sesión);
 *  2. verifica la aprobación presentada (`X-Approval-Id`) y solo si vale la
 *     entrega al motor;
 *  3. corre el motor puro cargando solo los hechos que lee;
 *  4. si permite: consume la aprobación (una sola vez) y los contadores (todo o
 *     nada, atómico); una carrera perdida cambia el veredicto a `DENY`/`CHALLENGE`;
 *  5. registra la decisión; para sensibilidad ≥ ALTA el `PERMIT` exige que el
 *     asiento se haya escrito (`DECISION_LOG_UNAVAILABLE` si no: falla cerrado);
 *  6. anota el uso agregado.
 *
 * Sin condiciones, sin obligaciones y sin reglas el costo es el de siempre: el
 * motor puro sobre lo que la política ya cargó.
 */
@Injectable()
export class SupportDecisionPipeline {
  /**
   * @param rules - Reglas de la organización (caché).
   * @param loader - PIP de hechos perezosos.
   * @param counter - Contadores de límites y montos.
   * @param recorder - Bitácora de decisiones.
   * @param usage - Estadística de uso.
   * @param approvals - Aprobaciones de cuatro ojos de acción.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly rules: SupportGovernanceRules,
    private readonly loader: SupportAccessContextLoader,
    private readonly counter: SupportUsageCounter,
    private readonly recorder: AccessDecisionRecorder,
    private readonly usage: AccessUsageRecorder,
    private readonly approvals: SupportApprovalGate,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportDecisionPipeline.name);
  }

  /**
   * Decide.
   *
   * @param input - Vínculos, pregunta y contexto de transacción.
   * @returns La decisión con su traza y lo que se consumió.
   */
  async evaluate(input: PipelineInput): Promise<PipelineResult> {
    const { em, tenantId, userId, engagements } = input;
    const now = input.now ?? input.query.context?.now ?? new Date();
    const peek =
      input.sideEffects === false || input.query.context?.peek === true;
    const rules = await this.rules.forTenant(em, tenantId, now);
    const atom = primaryAtomOf(String(input.query.action));
    const conditions = this.loader.conditionsOf(
      grantConditions(engagements),
      rules,
    );
    const demand = this.loader.demandOf(conditions, atom);
    // Datos que cuestan una consulta (hora de la cita): solo si una condición los
    // usa o si hay una aprobación que comparar con ESTA cita.
    const presented =
      input.query.context?.proof?.approvalId ??
      getAuditRequestContext()?.approvalId;
    const extra =
      (demand.needsAppointment || !!presented) && input.completeContext
        ? await input.completeContext()
        : undefined;
    const base: SupportAccessContext = {
      ...extra,
      ...this.withPip(input.query.context, peek),
    };

    // Aprobación presentada: solo vale si es de esta persona, de esta acción y vigente.
    let approvalId = base.proof?.approvalId;
    let approvalProblem: ApprovalProblem | undefined;
    if (approvalId && atom) {
      const verdict = await this.approvals.check(em, {
        tenantId,
        userId,
        atom,
        approvalId,
        target: {
          practitionerRoleAssignmentIds:
            input.query.practitionerRoleAssignmentIds,
          healthcareServiceId: input.query.healthcareServiceId,
          careSpaceId: input.query.careSpaceId,
          patientProfileId: base.patientProfileId,
          appointmentStartAt: base.appointmentStartAt,
        },
        now,
      });
      if (!verdict.ok) {
        approvalProblem = verdict.problem;
        approvalId = undefined;
      }
    }
    const context: SupportAccessContext = {
      ...base,
      proof: { ...base.proof, approvalId },
    };
    const query: SupportAccessQuery = { ...input.query, context };

    const zone = demand.hasConditions
      ? await this.loader.timeZoneOf(em, tenantId)
      : undefined;
    const evaluation = await this.loader.evaluate<SupportEvaluationResult>(
      {
        em,
        tenantId,
        userId,
        practitionerProfileId: input.query.practitionerProfileId,
        context,
        now,
        demand,
      },
      zone,
      (facts) =>
        evaluateSupportAccessV2(engagements, query, now, {
          facts,
          rules,
          ...(zone ? { timeZone: zone } : {}),
        }),
    );
    let result: PipelineResult = {
      ...evaluation.result,
      ...(ruleIdOf(evaluation.result)
        ? { ruleId: ruleIdOf(evaluation.result) }
        : {}),
    };
    if (approvalProblem && result.decision.challenge?.kind === 'APPROVAL') {
      result = withApprovalProblem(result, approvalProblem);
    }
    if (peek) return result;

    // 4. consumir lo que la decisión gastó (solo si permite).
    if (result.decision.effect === 'PERMIT') {
      result = await this.consume(
        em,
        tenantId,
        userId,
        result,
        approvalId,
        now,
      );
    }

    // 5. registro de la decisión (obligatorio para sensibilidad ≥ ALTA).
    result = await this.record(em, input, result, context, now);

    // 6. estadística de uso (no es evidencia; nunca bloquea).
    const grantId = result.decision.grantId;
    if (grantId) {
      this.usage.note({
        tenantId,
        userId,
        grantId,
        permissionCode: atom ?? String(input.query.action),
        effect:
          result.decision.effect ??
          (result.decision.allowed ? 'PERMIT' : 'DENY'),
        patientProfileId: context.patientProfileId,
        at: now,
        timeZone: zone,
      });
    }
    return result;
  }

  /**
   * Qué pacientes de una lista ve la persona con un átomo que NO depende de un
   * doctor (la búsqueda exacta): las condiciones `patients` (alcance, edad,
   * banderas, cobertura) actúan como FILTRO del resultado, una concesión `DENY`
   * que alcanza al paciente lo quita y el cupo `DISTINCT_PATIENTS` se consume
   * SOLO por los pacientes que quedan. Un paciente fuera del alcance es
   * indistinguible de uno inexistente. Sin condiciones ni `DENY` no hace nada
   * más que devolver la lista (los permisos de siempre no cambian).
   *
   * @param input - Persona, vínculos, átomo y pacientes encontrados.
   * @returns Los ids de los pacientes que la persona puede ver.
   */
  async filterPatients(input: {
    readonly em: EntityManager;
    readonly tenantId: string;
    readonly userId: string;
    readonly engagements: readonly EngagementFacts[];
    readonly atom: string;
    readonly patientProfileIds: readonly string[];
    readonly now?: Date;
  }): Promise<Set<string>> {
    const now = input.now ?? new Date();
    const { em, tenantId, userId, atom, engagements } = input;
    const pairs: Pair[] = engagements
      .filter(
        (e) =>
          e.active &&
          withinWindow(now, e.validFrom, e.validTo) &&
          !e.onboardingIncomplete,
      )
      .flatMap((e) =>
        e.grants
          .filter(
            (g) =>
              g.active &&
              withinWindow(now, g.validFrom, g.validTo) &&
              atomsOfGrant(g).has(atom),
          )
          .map((g) => ({ e, g })),
      );
    const allowRows = pairs.filter((p) => p.g.effect !== 'DENY');
    const denyRows = pairs.filter((p) => p.g.effect === 'DENY');
    const rules = await this.rules.forTenant(em, tenantId, now);
    const conditions = this.loader.conditionsOf(
      grantConditions(engagements),
      rules,
    );
    // Sin condiciones ni prohibiciones la lista queda como estaba (no regresión).
    if (conditions.length === 0 && denyRows.length === 0) {
      return new Set(input.patientProfileIds);
    }
    const demand = this.loader.demandOf(conditions, atom);
    const zone = await this.loader.timeZoneOf(em, tenantId);
    const base = this.withPip(undefined, false);
    const visible = new Set<string>();
    for (const patientProfileId of input.patientProfileIds) {
      const query: SupportAccessQuery = {
        action: atom as SupportAccessQuery['action'],
        context: { ...base, patientProfileId },
      };
      const evaluation = await this.loader.evaluate<{
        readonly allow: readonly CandidateEval[];
        readonly denied: boolean;
        readonly usage: { readonly readings: readonly UsageSnapshot[] };
      }>(
        { em, tenantId, userId, context: query.context!, now, demand },
        zone,
        (facts) => {
          const denied = denyRows.some((p) =>
            denyApplies(p, atom, query, facts, now, zone),
          );
          const allow = allowRows.map((p) =>
            evaluateCandidate(p, atom, query, facts, rules, now, zone, false),
          );
          return {
            allow,
            denied,
            usage: {
              readings: allow.flatMap((c) =>
                c.runs.flatMap((r) => r.result.readings),
              ),
            },
          };
        },
      );
      const { allow, denied } = evaluation.result;
      const chosen = allow
        .filter((c) => c.unmet.length === 0)
        .sort((a, b) => a.pair.g.grantId.localeCompare(b.pair.g.grantId))[0];
      if (denied || !chosen) continue;
      // Consume SOLO el cupo del paciente que queda (todo o nada).
      const maxOf = new Map(
        chosen.runs
          .flatMap((r) => r.result.readings)
          .map((r) => [SupportUsageCounter.serialize(r.key), r.max]),
      );
      const requests = chosen.runs.flatMap((r) => r.result.usage);
      const outcome = await this.counter.consume(
        tenantId,
        requests.map((c) => ({
          key: c.key,
          amount: c.amount,
          max: maxOf.get(SupportUsageCounter.serialize(c.key)) ?? 0,
        })),
        now,
      );
      if (outcome.ok) visible.add(patientProfileId);
    }
    return visible;
  }

  /**
   * Reglas de la organización vigentes (caché por organización).
   *
   * @param em - Contexto de lectura.
   * @param tenantId - Organización.
   * @param now - Instante.
   * @returns Las reglas que actúan al decidir.
   */
  rulesFor(em: EntityManager, tenantId: string, now: Date) {
    return this.rules.forTenant(em, tenantId, now);
  }

  /**
   * Decide SOLO la estructura (vínculo, aceptación, permiso, reglas de la
   * organización, prohibiciones y condiciones sin hechos): para listar a quién se
   * muestra algo. Sin efectos y sin cargar nada de la petición.
   *
   * @param input - Persona, vínculos y pregunta.
   * @returns La decisión del motor sin hechos.
   */
  async evaluateStructure(input: {
    readonly em: EntityManager;
    readonly tenantId: string;
    readonly engagements: readonly EngagementFacts[];
    readonly query: SupportAccessQuery;
    readonly now: Date;
  }): Promise<SupportAccessDecision> {
    const rules = await this.rules.forTenant(
      input.em,
      input.tenantId,
      input.now,
    );
    return evaluateSupportAccessV2(input.engagements, input.query, input.now, {
      rules,
    }).decision;
  }

  /**
   * Prepara un evaluador EN MEMORIA para decidir muchas filas (la agenda
   * combinada): reglas y hechos de la petición se cargan una vez y los pacientes
   * en lote. Es solo lectura: no consume contadores, no registra y no pide
   * aprobaciones; sirve para decidir qué ofrece la pantalla. La acción real
   * vuelve a pasar por {@link SupportDecisionPipeline.evaluate}.
   *
   * @param input - Vínculos, pacientes y doctores que aparecen en la lista.
   * @returns Una función `pregunta → decisión` síncrona.
   */
  async prepareListing(input: {
    readonly em: EntityManager;
    readonly tenantId: string;
    readonly userId: string;
    readonly engagements: readonly EngagementFacts[];
    readonly patientProfileIds: readonly string[];
    readonly practitionerProfileIds: readonly string[];
    readonly now?: Date;
    /** `false`: solo la estructura (reglas y permisos), sin cargar hechos. */
    readonly withFacts?: boolean;
  }): Promise<(query: SupportAccessQuery) => SupportAccessDecision> {
    const now = input.now ?? new Date();
    const rules = await this.rules.forTenant(input.em, input.tenantId, now);
    const conditions = this.loader.conditionsOf(
      grantConditions(input.engagements),
      rules,
    );
    const demand = this.loader.demandOf(conditions, undefined);
    const zone = demand.hasConditions
      ? await this.loader.timeZoneOf(input.em, input.tenantId)
      : undefined;
    const context = this.withPip(undefined, true);
    const factsOf =
      demand.hasConditions && input.withFacts !== false
        ? await this.loader.prepareListing(
            {
              em: input.em,
              tenantId: input.tenantId,
              userId: input.userId,
              context,
              now,
              demand,
              patientProfileIds: input.patientProfileIds,
              practitionerProfileIds: input.practitionerProfileIds,
            },
            zone,
          )
        : undefined;
    return (query) => {
      const patientProfileId = query.context?.patientProfileId;
      const facts = factsOf?.(patientProfileId, query.practitionerProfileId);
      return evaluateSupportAccessV2(
        input.engagements,
        {
          ...query,
          context: { ...context, ...query.context, now, peek: true },
        },
        now,
        { facts, rules, ...(zone ? { timeZone: zone } : {}) },
      ).decision;
    };
  }

  /**
   * Anota una decisión que se tomó antes del motor (sin vínculo, objetivo ajeno
   * a la organización): todo `DENY` deja asiento.
   *
   * @param input - Persona, organización y pregunta.
   * @param decision - El veredicto.
   */
  async recordEarlyDeny(
    input: Pick<PipelineInput, 'em' | 'tenantId' | 'userId' | 'query'>,
    decision: SupportAccessDecision,
  ): Promise<void> {
    const now = input.query.context?.now ?? new Date();
    const context = this.withPip(input.query.context, false);
    try {
      await this.recorder.write(
        input.em,
        {
          tenantId: input.tenantId,
          userId: input.userId,
          action: String(input.query.action),
          decision: { ...decision, effect: 'DENY' },
          context,
          now,
        },
        { write: true, required: false },
      );
    } catch {
      // Mejor esfuerzo: el recorder ya dejó el aviso.
    }
  }

  /** Completa lo que solo el servidor sabe: origen y sesión (nunca del cliente). */
  private withPip(
    context: SupportAccessContext | undefined,
    peek: boolean,
  ): SupportAccessContext {
    const request = getAuditRequestContext();
    return {
      ...context,
      // `X-Approval-Id` de la petición: solo si el llamador no trajo su propia prueba.
      ...(request?.approvalId && !context?.proof?.approvalId
        ? { proof: { ...context?.proof, approvalId: request.approvalId } }
        : {}),
      ...(request?.ip ? { ip: request.ip } : {}),
      ...(request?.sessionId ? { sessionId: request.sessionId } : {}),
      ...(request?.deviceId !== undefined
        ? { deviceId: request.deviceId }
        : {}),
      ...(peek ? { peek: true } : {}),
    };
  }

  /** Consume aprobación y contadores; una carrera perdida cambia el veredicto. */
  private async consume(
    em: EntityManager,
    tenantId: string,
    userId: string,
    result: PipelineResult,
    approvalId: string | undefined,
    now: Date,
  ): Promise<PipelineResult> {
    const usedApproval =
      !!approvalId && result.trace.steps.some((s) => s.code === 'APPROVAL_OK');
    if (usedApproval && approvalId) {
      const won = await this.approvals.consume(em, approvalId, now);
      if (!won) {
        return lose(result, 'APPROVAL', SupportAccessReason.APPROVAL_REQUIRED, {
          approvalProblem: 'FOUR_EYES_ALREADY_CONSUMED',
        });
      }
    }
    if (result.usage.consume.length > 0) {
      const maxOf = new Map(
        result.usage.readings.map((r: UsageSnapshot) => [
          SupportUsageCounter.serialize(r.key),
          r.max,
        ]),
      );
      const outcome = await this.counter.consume(
        tenantId,
        result.usage.consume.map((c) => ({
          key: c.key,
          amount: c.amount,
          max: maxOf.get(SupportUsageCounter.serialize(c.key)) ?? 0,
        })),
        now,
      );
      if (!outcome.ok) {
        this.logger.info(
          { operation: 'delegated_access.usage.race', tenantId, userId },
          'Un tope se llenó entre la lectura y el consumo',
        );
        return lose(result, 'DENY', SupportAccessReason.LIMIT_EXCEEDED, {});
      }
    }
    return result;
  }

  /** Registra la decisión; el `PERMIT` de sensibilidad ≥ ALTA exige el asiento. */
  private async record(
    em: EntityManager,
    input: PipelineInput,
    result: PipelineResult,
    context: SupportAccessContext,
    now: Date,
  ): Promise<PipelineResult> {
    const action = String(input.query.action);
    const plan = this.recorder.plan(
      action,
      result.decision,
      result.obligations,
    );
    if (!plan.write) return result;
    const target = {
      practitionerRoleAssignmentId:
        input.query.practitionerRoleAssignmentIds?.[0],
      healthcareServiceId: input.query.healthcareServiceId,
      careSpaceId: input.query.careSpaceId,
    };
    try {
      await this.recorder.write(
        em,
        {
          tenantId: input.tenantId,
          userId: input.userId,
          action,
          decision: result.decision,
          target,
          context,
          ruleId: result.ruleId,
          obligations: result.obligations,
          readings: result.usage.readings,
          now,
        },
        plan,
      );
    } catch {
      if (plan.required) {
        // Sin evidencia no hay acceso: la evidencia es condición del acceso.
        return lose(
          result,
          'DENY',
          SupportAccessReason.DECISION_LOG_UNAVAILABLE,
          {},
        );
      }
    }
    return result;
  }
}

/** Condiciones de los permisos y de sus átomos (cota superior de lo que puede intervenir). */
function grantConditions(
  engagements: readonly EngagementFacts[],
): (SupportCondition | null | undefined)[] {
  const out: (SupportCondition | null | undefined)[] = [];
  for (const e of engagements) {
    for (const g of e.grants) {
      if (g.condition) out.push(g.condition);
      for (const [, entry] of atomsOfGrant(g)) {
        if (entry.condition) out.push(entry.condition);
      }
    }
  }
  return out;
}

/** Regla de la organización que decidió (la traza la nombra en el paso que decidió). */
function ruleIdOf(result: SupportEvaluationResult): string | undefined {
  const step = result.trace.steps.find(
    (s) => s.order === result.trace.decidedByStep,
  );
  return step?.ruleId;
}

/** Anota en el desafío de aprobación por qué la presentada no sirvió. */
function withApprovalProblem(
  result: PipelineResult,
  problem: ApprovalProblem,
): PipelineResult {
  const challenge = result.decision.challenge;
  if (!challenge) return result;
  return {
    ...result,
    decision: {
      ...result.decision,
      challenge: {
        ...challenge,
        details: { ...challenge.details, approvalProblem: problem },
      },
    },
  };
}

/** Cambia un `PERMIT` por un veredicto que no abre (carrera perdida o evidencia imposible). */
function lose(
  result: PipelineResult,
  kind: 'DENY' | 'APPROVAL',
  reason: SupportAccessReason,
  details: Record<string, unknown>,
): PipelineResult {
  const { grantId, atom } = result.decision;
  const decision: SupportAccessDecision =
    kind === 'APPROVAL'
      ? {
          allowed: false,
          effect: 'CHALLENGE',
          reason,
          ...(grantId ? { grantId } : {}),
          ...(atom ? { atom } : {}),
          challenge: {
            kind: 'APPROVAL',
            details: {
              atom,
              approverKind:
                result.obligations.approval?.by ?? 'SECOND_APPROVER',
              ...details,
            },
          },
        }
      : {
          allowed: false,
          effect: 'DENY',
          reason,
          ...(grantId ? { grantId } : {}),
          ...(atom ? { atom } : {}),
        };
  return { ...result, decision };
}
