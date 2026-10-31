import type {
  GovernanceRuleFacts,
  SupportAccessFacts,
} from './support-access-context';
import {
  SupportAccessReason,
  type ConditionSource,
  type EngagementFacts,
  type SupportAccessQuery,
  type SupportGrantFacts,
  type UnmetCondition,
} from './support-access.types';
import {
  DEFAULT_REASON_MIN_LENGTH,
  DEFAULT_STEP_UP_MAX_AGE_MINUTES,
  DEFAULT_APPROVAL_TTL_MINUTES,
  SUPPORT_CONDITION_SCHEMA_VERSION,
  compareUnmet,
  evaluateConditions,
  type ApprovalBy,
  type ConditionEvaluation,
  type ExplicitObligations,
  type SupportCondition,
} from './support-conditions';
import {
  atomMatchesPattern,
  atomMeta,
  atomsOfAction,
  type AtomOrigin,
} from './support-permission-catalog';
import { TARGET_CONSTRAINTS } from './support-targets';

/**
 * Piezas puras del motor de decisión: qué átomos trae un permiso y de dónde,
 * cuándo una condición es ilegible, cómo se combinan las obligaciones y el
 * desempate determinista entre candidatas (CONTRATO-GOBIERNO §3.8).
 */

/** Un átomo dentro de un permiso. */
export interface AtomEntry {
  readonly origin: AtomOrigin;
  readonly condition?: SupportCondition;
}

const atomCache = new WeakMap<
  SupportGrantFacts,
  ReadonlyMap<string, AtomEntry>
>();

/**
 * Átomos de un permiso con su origen y condición propia. Un alias da su
 * paquete (`LEGACY`); un átomo escrito gana al alias (lo explícito); la forma
 * rica `atomGrants` aporta la condición del átomo.
 */
export function atomsOfGrant(
  grant: SupportGrantFacts,
): ReadonlyMap<string, AtomEntry> {
  const cached = atomCache.get(grant);
  if (cached) return cached;
  const map = new Map<string, AtomEntry>();
  for (const action of grant.actions) {
    for (const { atom, origin } of atomsOfAction(action)) {
      const prev = map.get(atom);
      if (!prev || (origin === 'ATOM' && prev.origin === 'LEGACY')) {
        map.set(atom, { origin });
      }
    }
  }
  for (const ag of grant.atomGrants ?? []) {
    const prev = map.get(ag.atom);
    map.set(ag.atom, {
      origin:
        prev?.origin === 'ATOM' || ag.origin === 'ATOM' ? 'ATOM' : 'LEGACY',
      condition: ag.condition ?? prev?.condition,
    });
  }
  atomCache.set(grant, map);
  return map;
}

/** ¿La condición es de una versión del esquema que este motor no lee? */
export function isUnsupportedCondition(
  condition: SupportCondition | null | undefined,
): boolean {
  return (
    !!condition && condition.schemaVersion !== SUPPORT_CONDITION_SCHEMA_VERSION
  );
}

/** ¿El permiso es ilegible para este átomo? (marca explícita o condición de otra versión). */
export function isUnreadableFor(
  grant: SupportGrantFacts,
  atom: string,
): boolean {
  if (grant.unreadable === true) return true;
  if (isUnsupportedCondition(grant.condition)) return true;
  return isUnsupportedCondition(atomsOfGrant(grant).get(atom)?.condition);
}

const APPROVAL_RANK: Readonly<Record<ApprovalBy, number>> = {
  DOCTOR: 1,
  SERVICE_HEAD: 2,
  SECOND_APPROVER: 3,
};

/**
 * Une obligaciones: el motivo más largo, el segundo paso más reciente y, para
 * el aprobador, el de mayor rango (segundo aprobador > jefe de servicio >
 * doctor) con el menor tiempo de vigencia. Determinista y conmutativo.
 */
export function mergeObligations(
  list: readonly ExplicitObligations[],
): ExplicitObligations {
  let reason: number | undefined;
  let stepUp: number | undefined;
  let approval: { by: ApprovalBy; ttlMinutes: number } | undefined;
  for (const o of list) {
    if (o.reason) reason = Math.max(reason ?? 0, o.reason.minLength);
    if (o.stepUp) stepUp = Math.min(stepUp ?? Infinity, o.stepUp.maxAgeMinutes);
    if (o.approval) {
      approval = approval
        ? {
            by:
              APPROVAL_RANK[o.approval.by] > APPROVAL_RANK[approval.by]
                ? o.approval.by
                : approval.by,
            ttlMinutes: Math.min(approval.ttlMinutes, o.approval.ttlMinutes),
          }
        : { ...o.approval };
    }
  }
  return {
    ...(reason !== undefined ? { reason: { minLength: reason } } : {}),
    ...(stepUp !== undefined ? { stepUp: { maxAgeMinutes: stepUp } } : {}),
    ...(approval ? { approval } : {}),
  };
}

/**
 * Obligaciones efectivas de un átomo: las del catálogo (solo si se escribió
 * como átomo; un alias no las trae) más las que piden las condiciones.
 */
export function effectiveObligations(
  atom: string,
  origin: AtomOrigin,
  explicit: ExplicitObligations,
): ExplicitObligations {
  const meta = atomMeta(atom);
  const catalog: ExplicitObligations =
    origin === 'ATOM' && meta
      ? {
          ...(meta.requiresReason
            ? { reason: { minLength: DEFAULT_REASON_MIN_LENGTH } }
            : {}),
          ...(meta.requiresStepUp
            ? { stepUp: { maxAgeMinutes: DEFAULT_STEP_UP_MAX_AGE_MINUTES } }
            : {}),
          ...(meta.approvalMode
            ? {
                approval: {
                  by: meta.approvalMode,
                  ttlMinutes: DEFAULT_APPROVAL_TTL_MINUTES,
                },
              }
            : {}),
        }
      : {};
  return mergeObligations([catalog, explicit]);
}

/** Cantidad de obligaciones distintas (0 a 3): el criterio «la de menos obligaciones». */
export function obligationCount(o: ExplicitObligations): number {
  return Number(!!o.reason) + Number(!!o.stepUp) + Number(!!o.approval);
}

/** Estrechez del objetivo: 0 = cruce, 1 = único, 2 = «todos». */
export function narrowness(grant: SupportGrantFacts): number {
  const constraints = TARGET_CONSTRAINTS[grant.targetKind];
  const specific = Object.values(constraints).filter(
    (c) => c === 'SPECIFIC',
  ).length;
  return specific >= 2 ? 0 : specific === 1 ? 1 : 2;
}

/** ¿La regla de la organización alcanza a este átomo y a alguno de estos vínculos? */
export function ruleApplies(
  rule: GovernanceRuleFacts,
  atom: string | undefined,
  engagements: readonly EngagementFacts[],
): boolean {
  if (!atom || !atomMatchesPattern(atom, rule.permissionPattern)) return false;
  if (!rule.roleTemplateCode) return true;
  return engagements.some((e) => e.templateCode === rule.roleTemplateCode);
}

const R = SupportAccessReason;

/** Un permiso vivo junto al vínculo al que pertenece. */
export interface Pair {
  readonly e: EngagementFacts;
  readonly g: SupportGrantFacts;
}

export interface Run {
  readonly source: ConditionSource;
  readonly prefix: string;
  readonly ruleId?: string;
  readonly result: ConditionEvaluation;
}

export interface CandidateEval {
  readonly pair: Pair;
  readonly origin: AtomOrigin;
  readonly unmet: readonly UnmetCondition[];
  readonly explicit: ExplicitObligations;
  readonly runs: readonly Run[];
}

export const byPair = (a: Pair, b: Pair): number =>
  narrowness(a.g) - narrowness(b.g) || a.g.grantId.localeCompare(b.g.grantId);

export const unmetKeys = (unmet: readonly UnmetCondition[]): string[] => [
  ...new Set(unmet.map((u) => u.key)),
];

/** Las condiciones de una candidata: permiso, átomo y reglas obligatorias de la organización. */
export function evaluateCandidate(
  pair: Pair,
  atom: string,
  query: SupportAccessQuery,
  facts: SupportAccessFacts | undefined,
  rules: readonly GovernanceRuleFacts[],
  now: Date,
  tz: string | undefined,
  all: boolean,
): CandidateEval {
  const entry = atomsOfGrant(pair.g).get(atom);
  const origin = entry?.origin ?? 'LEGACY';
  const sources: {
    cond: SupportCondition;
    source: ConditionSource;
    prefix: string;
    ruleId?: string;
  }[] = [];
  // Un alias no trae obligaciones nuevas del catálogo (no regresión), pero SÍ se
  // evalúan sus condiciones si la fila las trae (SEG A-A2): al guardar se
  // rechazan (422), así que una fila alias con condición solo llega por SQL
  // directo o de datos antiguos, y ignorarla en silencio era abrir (PERMIT) lo
  // que quien la escribió quiso restringir. Sin condición, nada cambia.
  if (pair.g.condition)
    sources.push({
      cond: pair.g.condition,
      source: 'GRANT',
      prefix: 'condition',
    });
  if (entry?.condition)
    sources.push({
      cond: entry.condition,
      source: 'ATOM',
      prefix: `actionConditions.${atom}`,
    });
  const unreadableRules: UnmetCondition[] = [];
  for (const rule of [...rules].sort((a, b) => a.id.localeCompare(b.id))) {
    if (rule.kind !== 'REQUIRE_CONDITION' || !rule.condition) continue;
    if (!ruleApplies(rule, atom, [pair.e])) continue;
    if (isUnsupportedCondition(rule.condition)) {
      unreadableRules.push({
        key: 'condition',
        code: R.CONDITION_UNREADABLE,
        status: 'I',
        source: 'ORG_RULE',
        ruleId: rule.id,
        path: `governanceRules.${rule.id}.condition`,
        approvable: false,
      });
      continue;
    }
    sources.push({
      cond: rule.condition,
      source: 'ORG_RULE',
      prefix: `governanceRules.${rule.id}.condition`,
      ruleId: rule.id,
    });
  }
  const runs: Run[] = sources.map((s) => ({
    source: s.source,
    prefix: s.prefix,
    ...(s.ruleId ? { ruleId: s.ruleId } : {}),
    result: evaluateConditions(s.cond, atom, query.context, facts, now, {
      source: s.source,
      pathPrefix: s.prefix,
      ruleId: s.ruleId,
      timeZone: tz,
      grantId: pair.g.grantId,
      subjectId: pair.e.userId ?? pair.e.engagementId,
      coveredPractitionerProfileId:
        pair.g.practitionerProfileId ?? query.practitionerProfileId,
      evaluateAll: all,
    }),
  }));
  return {
    pair,
    origin,
    unmet: [...runs.flatMap((r) => r.result.unmet), ...unreadableRules].sort(
      compareUnmet,
    ),
    explicit: mergeObligations(runs.map((r) => r.result.obligations)),
    runs,
  };
}

/** ¿Una fila `DENY` aplica? Verdadero si su predicado es T o I (ante la duda, niega). */
export function denyApplies(
  pair: Pair,
  atom: string,
  query: SupportAccessQuery,
  facts: SupportAccessFacts | undefined,
  now: Date,
  tz: string | undefined,
): boolean {
  if (isUnreadableFor(pair.g, atom)) return true;
  const entry = atomsOfGrant(pair.g).get(atom);
  const conds = [pair.g.condition, entry?.condition].filter(
    (c): c is SupportCondition => !!c,
  );
  return conds.every((cond) => {
    const result = evaluateConditions(cond, atom, query.context, facts, now, {
      timeZone: tz,
      grantId: pair.g.grantId,
      coveredPractitionerProfileId:
        pair.g.practitionerProfileId ?? query.practitionerProfileId,
    });
    return !result.unmet.some((u) => u.status === 'F');
  });
}
