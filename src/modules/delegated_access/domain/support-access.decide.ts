import type {
  GovernanceRuleFacts,
  SupportAccessFacts,
} from './support-access-context';
import {
  atomsOfGrant,
  byPair,
  denyApplies,
  effectiveObligations,
  evaluateCandidate,
  isUnreadableFor,
  obligationCount,
  ruleApplies,
  unmetKeys,
  type CandidateEval,
  type Pair,
} from './support-access.candidates';
import { grantCovers, withinWindow } from './support-access.coverage';
import { visibleFieldsOf } from './support-access.fields';
import { TraceBuilder, addConditionSteps } from './support-access.trace';
import {
  SupportAccessReason,
  type EngagementFacts,
  type FieldVisibility,
  type SupportAccessDecision,
  type SupportAccessQuery,
  type SupportChallengeKind,
  type SupportDecisionEffect,
  type UnmetCondition,
} from './support-access.types';
import type {
  ExplicitObligations,
  UsageRequest,
  UsageSnapshot,
} from './support-conditions';
import { describeTraceStep } from './support-describe';
import { atomMeta, primaryAtomOf } from './support-permission-catalog';
import type {
  PolicyTrace,
  PolicyTraceCandidate,
  PolicyTraceLayer,
  PolicyTraceStep,
} from './support-policy-trace';

const R = SupportAccessReason;

/** Lo que la función pura necesita además de los vínculos y la pregunta. */
export interface SupportEvaluationEnv {
  /** Hechos resueltos por el servicio (PIP). */
  readonly facts?: SupportAccessFacts;
  /** Reglas de la organización (L1) vigentes. */
  readonly rules?: readonly GovernanceRuleFacts[];
  /** Zona de la organización; por defecto la de `facts` o La Paz. */
  readonly timeZone?: string;
}

/** Resultado del motor: decisión, traza y lo que habría que consumir. */
export interface SupportEvaluationResult {
  readonly decision: SupportAccessDecision;
  readonly trace: PolicyTrace;
  /** Obligaciones efectivas del permiso que decidió (vacío si no hay). */
  readonly obligations: ExplicitObligations;
  readonly usage: {
    /** Contadores a consumir si se permite (vacío en `peek`). */
    readonly consume: readonly UsageRequest[];
    /** Lecturas de contadores, para explicar «3 de 20». */
    readonly readings: readonly UsageSnapshot[];
  };
}

/**
 * Motor de decisión de acceso del personal de apoyo (CONTRATO-GOBIERNO §3.8).
 * Función PURA y determinista: con los mismos datos, hora y contadores la
 * decisión es siempre la misma, sin importar el orden de los vínculos, los
 * permisos ni los átomos (los empates se resuelven por reglas fijas).
 *
 * Orden: vínculo vivo → aceptación del doctor → (si responde) permiso del
 * doctor → ingreso completo → barandilla L0 → regla L1 `DENY_PERMISSION` →
 * concesión `DENY` → candidatas `ALLOW` con sus condiciones y las reglas
 * `REQUIRE_CONDITION` → obligaciones (motivo, paso extra, aprobación).
 * Un `ALLOW` jamás vence a una capa superior; lo indeterminado cierra.
 *
 * @param engagements - Vínculos de la persona en la organización.
 * @param query - Acción (átomo o código antiguo), objetivo y contexto.
 * @param now - Instante de la decisión.
 * @param env - Hechos del servicio, reglas de la organización y zona horaria.
 * @returns La decisión con su traza, obligaciones y consumos pendientes.
 */
export function evaluateSupportAccessV2(
  engagements: readonly EngagementFacts[],
  query: SupportAccessQuery,
  now: Date,
  env: SupportEvaluationEnv = {},
): SupportEvaluationResult {
  const facts = env.facts;
  const rules = env.rules ?? [];
  const ctx = query.context;
  const tz = env.timeZone ?? facts?.orgTimeZone;
  const atom = primaryAtomOf(query.action) ?? undefined;
  const trace = new TraceBuilder();
  const peek = ctx?.peek === true;

  const finish = (
    effect: SupportDecisionEffect,
    reason: SupportAccessReason,
    decidedByStep: number,
    extra: {
      grantId?: string;
      unmet?: readonly UnmetCondition[];
      challenge?: SupportAccessDecision['challenge'];
      visibleFields?: Readonly<Record<string, FieldVisibility>>;
      obligations?: ExplicitObligations;
      consume?: readonly UsageRequest[];
      readings?: readonly UsageSnapshot[];
      candidates?: readonly PolicyTraceCandidate[];
    } = {},
  ): SupportEvaluationResult => ({
    decision: {
      allowed: effect === 'PERMIT',
      reason,
      ...(extra.grantId ? { grantId: extra.grantId } : {}),
      effect,
      ...(atom ? { atom } : {}),
      ...(extra.unmet && extra.unmet.length > 0 ? { unmet: extra.unmet } : {}),
      ...(extra.challenge ? { challenge: extra.challenge } : {}),
      ...(extra.visibleFields ? { visibleFields: extra.visibleFields } : {}),
    },
    trace: trace.build(extra.candidates ?? [], decidedByStep),
    obligations: extra.obligations ?? {},
    usage: {
      consume: peek ? [] : (extra.consume ?? []),
      readings: extra.readings ?? [],
    },
  });
  const stop = (
    layer: PolicyTraceLayer,
    reason: SupportAccessReason,
    vars: Record<string, string | number | undefined> = {},
    extra: Partial<PolicyTraceStep> = {},
    result: Parameters<typeof finish>[3] = {},
  ): SupportEvaluationResult => {
    const order = trace.add(
      layer,
      false,
      reason,
      describeTraceStep(reason, false, vars),
      extra,
    );
    return finish('DENY', reason, order, result);
  };

  // ── Paso 0: vínculo vivo, aceptación del doctor, responder, ingreso ──
  if (engagements.length === 0) return stop('ENGAGEMENT', R.NO_ENGAGEMENT);
  const live = engagements.filter(
    (e) => e.active && withinWindow(now, e.validFrom, e.validTo),
  );
  if (live.length === 0) return stop('ENGAGEMENT', R.ENGAGEMENT_INACTIVE);
  trace.add('ENGAGEMENT', true, 'ENGAGEMENT_ACTIVE', undefined);
  const accepting = live.filter((e) =>
    e.acceptances.some(
      (a) =>
        !!query.practitionerProfileId &&
        a.practitionerProfileId === query.practitionerProfileId,
    ),
  );
  if (accepting.length === 0) return stop('ENGAGEMENT', R.DOCTOR_NOT_ACCEPTED);
  trace.add('ENGAGEMENT', true, 'DOCTOR_ACCEPTED', undefined);
  let ready = accepting;
  if (atom === 'messages.conversation.reply_on_behalf') {
    ready = ready.filter((e) =>
      e.acceptances.some(
        (a) =>
          a.practitionerProfileId === query.practitionerProfileId &&
          a.mayReplyOnBehalf,
      ),
    );
    if (ready.length === 0)
      return stop('ENGAGEMENT', R.REPLY_NOT_ALLOWED_BY_DOCTOR);
  }
  ready = ready.filter((e) => !e.onboardingIncomplete);
  if (ready.length === 0) {
    const pending = accepting.flatMap((e) => e.onboardingPending ?? []);
    return stop('ENGAGEMENT', R.ONBOARDING_INCOMPLETE, {
      pendientes: [...new Set(pending)].join(', ') || undefined,
    });
  }

  // ── Paso 1: barandilla de plataforma (L0) ────────────────────────────
  if (atom && atomMeta(atom)?.supportAssignable === false) {
    return stop('GUARDRAIL', R.NOT_DELEGABLE, {}, { atom });
  }
  trace.add('GUARDRAIL', true, 'DELEGABLE', undefined);

  // ── Paso 2: regla de la organización (L1) DENY_PERMISSION ────────────
  const denyRule = rules
    .filter((r) => r.kind === 'DENY_PERMISSION' && ruleApplies(r, atom, ready))
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (denyRule) {
    return stop(
      'ORG_RULE',
      R.ORG_RULE_DENY,
      { mensaje: denyRule.message },
      {
        ruleId: denyRule.id,
        ...(atom ? { atom } : {}),
        details: { message: denyRule.message },
      },
    );
  }
  trace.add('ORG_RULE', true, 'NO_ORG_RULE_DENY', undefined);

  // ── Paso 3: denegación explícita ─────────────────────────────────────
  const liveGrants: Pair[] = ready.flatMap((e) =>
    e.grants
      .filter(
        (g) =>
          g.active &&
          withinWindow(now, g.validFrom, g.validTo) &&
          grantCovers(g, query),
      )
      .map((g) => ({ e, g })),
  );
  const denyHit = liveGrants
    .filter(
      (p) => p.g.effect === 'DENY' && !!atom && atomsOfGrant(p.g).has(atom),
    )
    .filter((p) => denyApplies(p, atom as string, query, facts, now, tz))
    .sort((a, b) => a.g.grantId.localeCompare(b.g.grantId))[0];
  if (denyHit) {
    return stop(
      'EXPLICIT_DENY',
      R.EXPLICIT_DENY,
      { permiso: 'prohibición del permiso' },
      { grantId: denyHit.g.grantId, ...(atom ? { atom } : {}) },
      { grantId: denyHit.g.grantId },
    );
  }
  trace.add('EXPLICIT_DENY', true, 'NO_EXPLICIT_DENY', undefined);

  // ── Paso 4: candidatas ALLOW que cubren y contienen el átomo ─────────
  const allowRows = liveGrants.filter((p) => p.g.effect !== 'DENY');
  const containing = allowRows.filter(
    (p) => !!atom && atomsOfGrant(p.g).has(atom),
  );
  const readable = containing.filter(
    (p) => !isUnreadableFor(p.g, atom as string),
  );
  if (readable.length === 0) {
    if (containing.length > 0) {
      return stop(
        'CONDITION',
        R.CONDITION_UNREADABLE,
        {},
        { ...(atom ? { atom } : {}) },
      );
    }
    return stop(
      'GRANT_COVERAGE',
      allowRows.length > 0 ? R.ACTION_NOT_GRANTED : R.NO_COVERING_GRANT,
      { acción: atom ?? String(query.action) },
    );
  }

  // ── Paso 5: condiciones de cada candidata ────────────────────────────
  const evalOne = (pair: Pair, all: boolean): CandidateEval =>
    evaluateCandidate(pair, atom as string, query, facts, rules, now, tz, all);
  const candidates: CandidateEval[] = readable.map((p) => {
    const first = evalOne(p, false);
    // Si solo una aprobación puede salvarla, se evalúa TODO: no se pide
    // aprobar algo que otra condición igual va a negar.
    return first.unmet.length > 0 && first.unmet.every((u) => u.approvable)
      ? evalOne(p, true)
      : first;
  });
  const candidateTrace: PolicyTraceCandidate[] = candidates.map((c) => ({
    grantId: c.pair.g.grantId,
    applicable: c.unmet.length === 0,
    unmet: unmetKeys(c.unmet),
  }));

  // ── Paso 6: elegir ───────────────────────────────────────────────────
  const orderOf = (c: CandidateEval): ExplicitObligations =>
    effectiveObligations(atom as string, c.origin, c.explicit);
  const applicable = candidates.filter((c) => c.unmet.length === 0);
  const pick = (
    list: readonly CandidateEval[],
    rank: (c: CandidateEval) => number,
  ): CandidateEval =>
    [...list].sort((a, b) => rank(a) - rank(b) || byPair(a.pair, b.pair))[0];
  const chosen =
    applicable.length > 0
      ? pick(applicable, (c) => obligationCount(orderOf(c)))
      : pick(candidates, (c) => c.unmet.length);
  const grantId = chosen.pair.g.grantId;
  const obligations = orderOf(chosen);
  const readings = chosen.runs.flatMap((r) => r.result.readings);
  const consume = chosen.runs.flatMap((r) => r.result.usage);
  const base = { grantId, obligations, readings, candidates: candidateTrace };

  const coveredStep = trace.add(
    'GRANT_COVERAGE',
    true,
    'COVERED',
    describeTraceStep('COVERED', true, {}),
    { grantId, ...(atom ? { atom } : {}) },
  );
  void coveredStep;
  const conditionSteps = addConditionSteps(
    trace,
    chosen,
    grantId,
    atom as string,
  );

  if (applicable.length === 0) {
    const allApprovable = chosen.unmet.every((u) => u.approvable);
    if (!allApprovable) {
      const first = chosen.unmet[0];
      return finish('DENY', first.code, conditionSteps.firstFail, {
        ...base,
        unmet: chosen.unmet,
      });
    }
  }

  // ── Obligaciones: motivo → paso extra → aprobación ───────────────────
  const approvalSatisfied = !!ctx?.proof?.approvalId;
  const challenge = (
    kind: SupportChallengeKind,
    reason: SupportAccessReason,
    details: Record<string, unknown>,
    vars: Record<string, string | number | undefined>,
    decidedBy?: number,
  ): SupportEvaluationResult => {
    // Si decide una condición incumplida (la aprobación la salva), esa condición
    // ya figura en la traza como el paso que decide: no se agrega otro paso.
    const order =
      decidedBy ??
      trace.add(
        'OBLIGATION',
        false,
        reason,
        describeTraceStep(reason, false, vars),
        {
          grantId,
          ...(atom ? { atom } : {}),
          details,
        },
      );
    return finish('CHALLENGE', reason, order, {
      ...base,
      unmet: chosen.unmet,
      challenge: { kind, details },
      visibleFields: visibleFieldsOf(
        liveGrants,
        ready,
        query,
        facts,
        rules,
        now,
        tz,
      ),
    });
  };
  const approver = (): { by: string; ttl: number } => {
    if (obligations.approval)
      return {
        by: obligations.approval.by,
        ttl: obligations.approval.ttlMinutes,
      };
    const byAmount = chosen.unmet.some((u) => u.key === 'amount');
    return {
      by:
        !byAmount && query.practitionerProfileId ? 'DOCTOR' : 'SECOND_APPROVER',
      ttl: 60,
    };
  };

  if (chosen.unmet.length > 0 && !approvalSatisfied) {
    const { by, ttl } = approver();
    const phrase =
      by === 'DOCTOR'
        ? 'el doctor'
        : by === 'SERVICE_HEAD'
          ? 'la jefatura del servicio'
          : 'un segundo aprobador';
    return challenge(
      'APPROVAL',
      R.APPROVAL_REQUIRED,
      { approverKind: by, atom, ttlMinutes: ttl },
      { aprobador: phrase },
      conditionSteps.firstFail,
    );
  }
  if (obligations.reason) {
    const text = ctx?.proof?.reasonText?.trim();
    if (!text || text.length < obligations.reason.minLength) {
      return challenge(
        'REASON',
        R.REASON_REQUIRED,
        { minLength: obligations.reason.minLength },
        { n: obligations.reason.minLength },
      );
    }
    trace.add('OBLIGATION', true, 'REASON_OK', undefined);
  }
  if (obligations.stepUp) {
    const age = facts?.stepUpAgeMinutes;
    if (age === undefined) {
      const order = trace.add(
        'OBLIGATION',
        false,
        R.STEP_UP_UNAVAILABLE,
        describeTraceStep(R.STEP_UP_UNAVAILABLE, false, {}),
        { grantId },
      );
      return finish('DENY', R.STEP_UP_UNAVAILABLE, order, { ...base });
    }
    if (age === null || age > obligations.stepUp.maxAgeMinutes) {
      const enrolled = facts?.stepUpEnrolled !== false;
      return challenge(
        enrolled ? 'STEP_UP' : 'STEP_UP_ENROLL',
        R.STEP_UP_REQUIRED,
        { maxAgeMinutes: obligations.stepUp.maxAgeMinutes, enrolled },
        {},
      );
    }
    trace.add(
      'OBLIGATION',
      true,
      'STEP_UP_OK',
      describeTraceStep('STEP_UP_OK', true, { minutos: age }),
    );
  }
  if (obligations.approval && !approvalSatisfied) {
    const by = obligations.approval.by;
    return challenge(
      'APPROVAL',
      R.APPROVAL_REQUIRED,
      { approverKind: by, atom, ttlMinutes: obligations.approval.ttlMinutes },
      {
        aprobador:
          by === 'DOCTOR'
            ? 'el doctor'
            : by === 'SERVICE_HEAD'
              ? 'la jefatura del servicio'
              : 'un segundo aprobador',
      },
    );
  }
  if (approvalSatisfied && (obligations.approval || chosen.unmet.length > 0)) {
    trace.add('OBLIGATION', true, 'APPROVAL_OK', undefined);
  }

  const allowed = trace.add(
    'OBLIGATION',
    true,
    'ALLOWED',
    describeTraceStep('ALLOWED', true, {}),
    { grantId, ...(atom ? { atom } : {}) },
  );
  return finish('PERMIT', R.ALLOWED, allowed, {
    ...base,
    visibleFields: visibleFieldsOf(
      liveGrants,
      ready,
      query,
      facts,
      rules,
      now,
      tz,
    ),
    consume,
  });
}
