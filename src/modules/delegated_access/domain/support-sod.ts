import {
  atomsOfGrant,
  grantsOverlap,
  isGrantLive,
  targetWithin,
  type AtomHoldingGrant,
} from './support-grant-targets';
import {
  atomMatchesPattern,
  type SupportAtomCode,
} from './support-permission-catalog';

/**
 * Segregación de funciones (SoD, CONTRATO-GOBIERNO §6.3). Un conflicto es una
 * persona que POSEE a la vez un átomo del conjunto A y uno del B de una regla.
 * Todo es puro: el catálogo de plataforma, la evaluación, las excepciones y el
 * orden «endurece, nunca afloja» de las reglas de la organización.
 */

export { grantsOverlap, targetWithin };

/** Alcance de la regla (`delegated_access:SOD_SCOPE_*`). */
export type SodScope = 'PERSON' | 'PERSON_OVERLAP' | 'TRANSACTION';

/** Acción de la regla (`delegated_access:SOD_ACTION_*`). */
export type SodAction = 'BLOCK' | 'REQUIRE_APPROVAL' | 'WARN';

/** Una regla SoD (fila de `delegated_access.sod_rules`). */
export interface SodRule {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  /** Átomos o patrones (`billing.*`) del lado A; `@…` marca un hecho de una regla `TRANSACTION`. */
  readonly atomsA: readonly string[];
  /** Átomos o patrones del lado B. */
  readonly atomsB: readonly string[];
  readonly scope: SodScope;
  readonly action: SodAction;
  /** `true` = sin excepción posible. */
  readonly isHard: boolean;
  /** Días máximos de una excepción; `null` o ausente = lo fija el ajuste. */
  readonly maxExceptionDays?: number | null;
  readonly rationale?: string;
  /** Código de la regla de plataforma que esta endurece. */
  readonly baseRuleCode?: string;
}

/**
 * Catálogo de plataforma (filas `sod_rules` con `tenant_id NULL`): las 11 reglas
 * de §6.3. Los marcadores `@…` de las reglas `TRANSACTION` sin átomo los impone
 * el servicio al ejecutar (`checkSodTransaction`), no el otorgamiento.
 */
export const SOD_PLATFORM_RULES: readonly SodRule[] = [
  {
    code: 'SOD-BILL-01',
    name: 'Cobrar y anular',
    atomsA: ['billing.payment.collect'],
    atomsB: ['billing.receipt.void'],
    scope: 'PERSON',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale:
      'Quien cobra no debe poder anular el comprobante de lo que cobró.',
  },
  {
    code: 'SOD-BILL-02',
    name: 'Cobrar y devolver',
    atomsA: ['billing.payment.collect'],
    atomsB: ['billing.payment.refund'],
    scope: 'PERSON',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale: 'Quien cobra no debe poder devolver el dinero que cobró.',
  },
  {
    code: 'SOD-BILL-03',
    name: 'Crear citas y emitir comprobantes',
    atomsA: ['agenda.appointment.create', 'agenda.appointment.walk_in'],
    atomsB: ['billing.receipt.issue'],
    scope: 'PERSON',
    action: 'REQUIRE_APPROVAL',
    isHard: false,
    maxExceptionDays: 90,
    rationale:
      'Crear una atención y facturarla en una sola persona permite cobros ficticios; en consultorios pequeños se admite con excepción (D-05).',
  },
  {
    code: 'SOD-BILL-04',
    name: 'Descontar y cobrar',
    atomsA: ['billing.discount.apply'],
    atomsB: ['billing.payment.collect'],
    scope: 'PERSON',
    action: 'WARN',
    isHard: false,
    maxExceptionDays: null,
    rationale:
      'Quien aplica descuentos y también cobra puede quedarse con la diferencia: se advierte y aparece en el tablero.',
  },
  {
    code: 'SOD-BILL-05',
    name: 'Emitir y anular el mismo comprobante',
    atomsA: ['billing.receipt.issue'],
    atomsB: ['billing.receipt.void'],
    scope: 'TRANSACTION',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale:
      'Una misma persona no puede emitir y anular un mismo comprobante (lo impone el servicio al ejecutar).',
  },
  {
    code: 'SOD-PAT-01',
    name: 'Registrar pacientes y corregir datos verificados',
    atomsA: ['patients.profile.register', 'patients.guardian.record'],
    atomsB: ['patients.profile.edit_verified'],
    scope: 'PERSON',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale:
      'Quien registra una identidad no debe poder corregirla después de verificada.',
  },
  {
    code: 'SOD-PAT-02',
    name: 'Registrar y fusionar fichas',
    atomsA: ['patients.profile.register'],
    atomsB: ['patients.profile.merge_request'],
    scope: 'PERSON',
    action: 'REQUIRE_APPROVAL',
    isHard: false,
    maxExceptionDays: 90,
    rationale:
      'Registrar y fusionar fichas en una sola persona facilita ocultar duplicados.',
  },
  {
    code: 'SOD-GOV-01',
    name: 'Solicitar y aprobar (acceso)',
    atomsA: ['@request'],
    atomsB: ['@decide'],
    scope: 'TRANSACTION',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale:
      'Nadie aprueba su propia solicitud de acceso (generaliza SUPPORT_DECISION_SELF).',
  },
  {
    code: 'SOD-GOV-02',
    name: 'Otorgar y certificar',
    atomsA: ['team.grants.assign'],
    atomsB: ['team.campaigns.review'],
    scope: 'TRANSACTION',
    action: 'BLOCK',
    isHard: true,
    maxExceptionDays: null,
    rationale:
      'Quien otorgó o aprobó una concesión no la certifica en la campaña.',
  },
  {
    code: 'SOD-GOV-03',
    name: 'Administrar el equipo y manejar caja',
    atomsA: ['team.grants.assign', 'team.requests.decide'],
    atomsB: ['billing.payment.collect', 'billing.receipt.issue'],
    scope: 'PERSON',
    action: 'REQUIRE_APPROVAL',
    isHard: false,
    maxExceptionDays: 90,
    rationale:
      'Quien reparte permisos no debería manejar dinero con los suyos.',
  },
  {
    code: 'SOD-AUD-01',
    name: 'Auditar y operar',
    atomsA: [
      'audit.activity.view_org',
      'audit.activity.export',
      'audit.reports.governance.view',
    ],
    atomsB: [
      'billing.payment.collect',
      'billing.receipt.void',
      'agenda.appointment.cancel',
      'patients.profile.edit_verified',
    ],
    scope: 'PERSON',
    action: 'REQUIRE_APPROVAL',
    isHard: false,
    maxExceptionDays: 90,
    rationale: 'Quien audita la actividad no debe ser quien la produce.',
  },
];

/** Tope duro de una excepción, en días. */
export const SOD_EXCEPTION_HARD_MAX_DAYS = 180;
/** Tope por ajuste (`maxSodExceptionDays`) cuando la organización no lo cambia. */
export const SOD_EXCEPTION_DEFAULT_MAX_DAYS = 90;
/** Largo mínimo de la justificación de una excepción. */
export const SOD_EXCEPTION_MIN_JUSTIFICATION = 30;
/** Plazo del ítem de remediación que abre el vencimiento de una excepción. */
export const SOD_REMEDIATION_ITEM_DAYS = 7;
/** Plazo de la campaña de remediación de conflictos heredados. */
export const SOD_REMEDIATION_CAMPAIGN_DAYS = 14;

const ACTION_RANK: Readonly<Record<SodAction, number>> = {
  WARN: 1,
  REQUIRE_APPROVAL: 2,
  BLOCK: 3,
};

/** Rigor de una acción: BLOQUEAR (3) > EXIGIR APROBACIÓN (2) > ADVERTIR (1). */
export function sodActionRank(action: SodAction): number {
  return ACTION_RANK[action];
}

/**
 * ¿La regla admite una excepción? Solo `EXIGIR APROBACIÓN` y no dura: una regla
 * `BLOQUEAR` nunca (AC-7) y `ADVERTIR` no la necesita.
 */
export function ruleAdmitsException(rule: SodRule): boolean {
  return !rule.isHard && rule.action === 'REQUIRE_APPROVAL';
}

/** Una excepción justificada y con vencimiento (fila de `sod_exceptions`) de UNA persona. */
export interface SodException {
  readonly id: string;
  readonly ruleCode: string;
  readonly validFrom?: Date;
  /** Obligatorio: una excepción sin fin no existe. */
  readonly validTo: Date;
  /** Por defecto `ACTIVE`. */
  readonly status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

function exceptionIsActive(e: SodException, now: Date): boolean {
  if ((e.status ?? 'ACTIVE') !== 'ACTIVE') return false;
  if (e.validFrom && e.validFrom.getTime() > now.getTime()) return false;
  return e.validTo.getTime() > now.getTime();
}

/** Excepciones `ACTIVE` cuyo `valid_to` ya pasó: las que el barrido pasa a `EXPIRED`. */
export function expiredSodExceptions(
  exceptions: readonly SodException[],
  now: Date,
): SodException[] {
  return exceptions.filter(
    (e) =>
      (e.status ?? 'ACTIVE') === 'ACTIVE' &&
      e.validTo.getTime() <= now.getTime(),
  );
}

/** Permiso de una persona tal como lo evalúa la SoD (`SupportGrantFacts` lo satisface). */
export type SodGrantInput = AtomHoldingGrant;

/** Resultado de un hallazgo. */
export type SodOutcome =
  'BLOCKED' | 'EXCEPTION_REQUIRED' | 'WARNING' | 'EXCEPTED';

/** Un conflicto hallado en lo que una persona posee. */
export interface SodFinding {
  readonly ruleCode: string;
  readonly ruleId?: string;
  readonly ruleName: string;
  readonly scope: SodScope;
  readonly action: SodAction;
  readonly isHard: boolean;
  readonly outcome: SodOutcome;
  /** Átomos que la persona tiene del lado A. */
  readonly atomsA: readonly SupportAtomCode[];
  /** Átomos que la persona tiene del lado B. */
  readonly atomsB: readonly SupportAtomCode[];
  /** Permisos que dan el lado A. */
  readonly grantIdsA: readonly string[];
  /** Permisos que dan el lado B. */
  readonly grantIdsB: readonly string[];
  /** Excepción vigente que lo exceptúa. */
  readonly exceptionId?: string;
  readonly exceptionValidTo?: Date;
  /** ¿Admite excepción la regla? (para guiar la pantalla). */
  readonly admitsException: boolean;
  readonly maxExceptionDays?: number | null;
}

function matchesAny(atom: string, patterns: readonly string[]): boolean {
  return patterns.some((p) => atomMatchesPattern(atom, p));
}

function outcomeOf(
  rule: SodRule,
  exception: SodException | undefined,
): SodOutcome {
  if (rule.action === 'WARN') return 'WARNING';
  if (rule.isHard || rule.action === 'BLOCK') return 'BLOCKED';
  return exception ? 'EXCEPTED' : 'EXCEPTION_REQUIRED';
}

interface Side {
  readonly grant: SodGrantInput;
  readonly atoms: SupportAtomCode[];
}

function sidesOf(
  grants: readonly SodGrantInput[],
  patterns: readonly string[],
): Side[] {
  return grants
    .map((grant) => ({
      grant,
      atoms: atomsOfGrant(grant).filter((a) => matchesAny(a, patterns)),
    }))
    .filter((s) => s.atoms.length > 0);
}

function hasDistinctPair(a: readonly string[], b: readonly string[]): boolean {
  return a.some((x) => b.some((y) => x !== y));
}

const uniqSorted = <T extends string>(values: readonly T[]): T[] =>
  [...new Set(values)].sort();

/** Pares de lados que chocan según el alcance de la regla (`TRANSACTION` no choca al otorgar). */
function conflictingSides(
  rule: SodRule,
  sidesA: readonly Side[],
  sidesB: readonly Side[],
): { a: Side[]; b: Side[] } | undefined {
  if (rule.scope === 'PERSON') {
    const atomsA = sidesA.flatMap((s) => s.atoms);
    const atomsB = sidesB.flatMap((s) => s.atoms);
    return hasDistinctPair(atomsA, atomsB)
      ? { a: [...sidesA], b: [...sidesB] }
      : undefined;
  }
  const a = new Set<Side>();
  const b = new Set<Side>();
  for (const sa of sidesA) {
    for (const sb of sidesB) {
      if (!hasDistinctPair(sa.atoms, sb.atoms)) continue;
      if (!grantsOverlap(sa.grant, sb.grant)) continue;
      a.add(sa);
      b.add(sb);
    }
  }
  return a.size > 0 ? { a: [...a], b: [...b] } : undefined;
}

/**
 * Evalúa lo que una persona posee contra las reglas. El conjunto efectivo es la
 * unión de sus permisos `ALLOW` vivos con los alias expandidos (las `DENY` no
 * restan: el conflicto es de capacidad). Las reglas `TRANSACTION` no dan
 * hallazgos aquí. Una excepción vigente exceptúa solo las reglas que admiten
 * excepción. El resultado no depende del orden de entrada: sale ordenado por
 * código de regla.
 *
 * @param grants - Permisos de UNA persona.
 * @param rules - Reglas efectivas (plataforma y organización).
 * @param exceptions - Excepciones de esa persona.
 * @param now - Reloj de la decisión.
 * @returns Los hallazgos.
 */
export function evaluateSod(
  grants: readonly SodGrantInput[],
  rules: readonly SodRule[],
  exceptions: readonly SodException[],
  now: Date,
): SodFinding[] {
  const live = grants.filter((g) => g.effect !== 'DENY' && isGrantLive(g, now));
  const findings: SodFinding[] = [];
  for (const rule of rules) {
    if (rule.scope === 'TRANSACTION') continue;
    const sidesA = sidesOf(live, rule.atomsA);
    const sidesB = sidesOf(live, rule.atomsB);
    if (sidesA.length === 0 || sidesB.length === 0) continue;
    const hit = conflictingSides(rule, sidesA, sidesB);
    if (!hit) continue;
    const admits = ruleAdmitsException(rule);
    const exception = admits
      ? exceptions.find(
          (e) => e.ruleCode === rule.code && exceptionIsActive(e, now),
        )
      : undefined;
    findings.push({
      ruleCode: rule.code,
      ...(rule.id ? { ruleId: rule.id } : {}),
      ruleName: rule.name,
      scope: rule.scope,
      action: rule.action,
      isHard: rule.isHard,
      outcome: outcomeOf(rule, exception),
      atomsA: uniqSorted(hit.a.flatMap((s) => s.atoms)),
      atomsB: uniqSorted(hit.b.flatMap((s) => s.atoms)),
      grantIdsA: uniqSorted(hit.a.map((s) => s.grant.grantId)),
      grantIdsB: uniqSorted(hit.b.map((s) => s.grant.grantId)),
      ...(exception
        ? { exceptionId: exception.id, exceptionValidTo: exception.validTo }
        : {}),
      admitsException: admits,
      maxExceptionDays: rule.maxExceptionDays ?? null,
    });
  }
  return findings.sort((x, y) => x.ruleCode.localeCompare(y.ruleCode));
}

/** Veredicto del otorgamiento. */
export type SodVerdict = 'BLOCKED' | 'EXCEPTION_REQUIRED' | 'WARN' | 'CLEAR';

/** Lo que se responde al otorgar. */
export interface SodSummary {
  readonly verdict: SodVerdict;
  readonly httpStatus: 200 | 409 | 422;
  /** `SOD_CONFLICT_BLOCKED` (422) o `SOD_EXCEPTION_REQUIRED` (409); ausente si pasa. */
  readonly reason?: 'SOD_CONFLICT_BLOCKED' | 'SOD_EXCEPTION_REQUIRED';
  readonly blocked: readonly SodFinding[];
  readonly exceptionRequired: readonly SodFinding[];
  readonly warnings: readonly SodFinding[];
  readonly excepted: readonly SodFinding[];
}

/**
 * Resume los hallazgos para la respuesta de «otorgar»: BLOQUEAR gana (422),
 * luego EXIGIR APROBACIÓN (409); advertir y lo exceptuado pasan.
 */
export function summarizeSod(findings: readonly SodFinding[]): SodSummary {
  const pick = (o: SodOutcome): SodFinding[] =>
    findings.filter((f) => f.outcome === o);
  const blocked = pick('BLOCKED');
  const exceptionRequired = pick('EXCEPTION_REQUIRED');
  const warnings = pick('WARNING');
  const excepted = pick('EXCEPTED');
  const base = { blocked, exceptionRequired, warnings, excepted };
  if (blocked.length > 0) {
    return {
      verdict: 'BLOCKED',
      httpStatus: 422,
      reason: 'SOD_CONFLICT_BLOCKED',
      ...base,
    };
  }
  if (exceptionRequired.length > 0) {
    return {
      verdict: 'EXCEPTION_REQUIRED',
      httpStatus: 409,
      reason: 'SOD_EXCEPTION_REQUIRED',
      ...base,
    };
  }
  return {
    verdict: warnings.length > 0 ? 'WARN' : 'CLEAR',
    httpStatus: 200,
    ...base,
  };
}

/** Violación de una regla `TRANSACTION` al ejecutar. */
export interface SodTransactionViolation {
  readonly ruleCode: string;
  readonly ruleName: string;
  readonly action: SodAction;
  readonly isHard: boolean;
  readonly outcome: SodOutcome;
  /** La persona que estaría en las dos puntas del hecho. */
  readonly conflictingUserId: string;
}

/**
 * Impone una regla `TRANSACTION` (`SodTransactionGuard`): la misma persona no
 * puede actuar en las dos puntas de un mismo hecho (quien decide ≠ quien pidió;
 * quien certifica ≠ quien otorgó o aprobó; quien anula ≠ quien emitió).
 *
 * @param input.ruleCode - Código de la regla.
 * @param input.actorsA - Quienes actuaron en la primera punta (se ignoran los vacíos).
 * @param input.actorB - Quien actúa ahora en la segunda punta.
 * @param input.rules - Reglas efectivas; por defecto las de plataforma.
 * @returns La violación, o `undefined` si no hay conflicto o la regla no es `TRANSACTION`.
 */
export function checkSodTransaction(input: {
  readonly ruleCode: string;
  readonly actorsA: ReadonlyArray<string | null | undefined>;
  readonly actorB: string;
  readonly rules?: readonly SodRule[];
}): SodTransactionViolation | undefined {
  const rule = (input.rules ?? SOD_PLATFORM_RULES).find(
    (r) => r.code === input.ruleCode,
  );
  if (!rule || rule.scope !== 'TRANSACTION') return undefined;
  if (!input.actorsA.some((a) => !!a && a === input.actorB)) return undefined;
  return {
    ruleCode: rule.code,
    ruleName: rule.name,
    action: rule.action,
    isHard: rule.isHard,
    outcome: outcomeOf(rule, undefined),
    conflictingUserId: input.actorB,
  };
}

/** Problema al derivar una regla de la organización de una de plataforma. */
export interface SodRuleDerivationIssue {
  readonly code: 'SOD_RULE_LOOSENS_BASE';
  readonly field:
    'action' | 'isHard' | 'atomsA' | 'atomsB' | 'scope' | 'maxExceptionDays';
}

const SCOPE_RANK: Readonly<Record<SodScope, number>> = {
  PERSON_OVERLAP: 1,
  PERSON: 2,
  TRANSACTION: 3,
};

function coversAll(
  derived: readonly string[],
  base: readonly string[],
): boolean {
  return base.every((e) =>
    derived.some(
      (d) => d === e || (d.includes('*') && atomMatchesPattern(e, d)),
    ),
  );
}

function exceptionDays(rule: SodRule): number {
  if (!ruleAdmitsException(rule)) return 0;
  return rule.maxExceptionDays ?? Number.POSITIVE_INFINITY;
}

/**
 * Una regla de la organización puede ENDURECER una de plataforma, nunca
 * aflojarla: no baja la acción, no quita `is_hard`, no quita átomos de los
 * conjuntos, no estrecha el alcance (`PERSON` ≥ `PERSON_OVERLAP`; `TRANSACTION`
 * no cambia) y no alarga la excepción.
 *
 * @param base - Regla de plataforma.
 * @param derived - Regla de la organización.
 * @returns Los campos que aflojan; vacío si solo endurece o iguala.
 */
export function validateSodRuleDerivation(
  base: SodRule,
  derived: SodRule,
): SodRuleDerivationIssue[] {
  const issues: SodRuleDerivationIssue['field'][] = [];
  if (sodActionRank(derived.action) < sodActionRank(base.action))
    issues.push('action');
  if (base.isHard && !derived.isHard) issues.push('isHard');
  if (!coversAll(derived.atomsA, base.atomsA)) issues.push('atomsA');
  if (!coversAll(derived.atomsB, base.atomsB)) issues.push('atomsB');
  const scopeLoosens =
    base.scope === 'TRANSACTION'
      ? derived.scope !== 'TRANSACTION'
      : SCOPE_RANK[derived.scope] < SCOPE_RANK[base.scope];
  if (scopeLoosens) issues.push('scope');
  if (exceptionDays(derived) > exceptionDays(base))
    issues.push('maxExceptionDays');
  return issues.map((field) => ({ code: 'SOD_RULE_LOOSENS_BASE', field }));
}

/**
 * Reglas efectivas de una organización: las de plataforma, con cada una
 * reemplazada por su derivada (`baseRuleCode`) si esta solo endurece, más las
 * propias. Una derivada que afloja se ignora (queda la de plataforma); una
 * propia que repite un código de plataforma sin ser su derivada, también.
 */
export function mergeSodRules(
  platform: readonly SodRule[],
  organization: readonly SodRule[],
): SodRule[] {
  const platformByCode = new Map(platform.map((r) => [r.code, r]));
  const replaced = new Map<string, SodRule>();
  const extras: SodRule[] = [];
  for (const rule of organization) {
    const base = rule.baseRuleCode
      ? platformByCode.get(rule.baseRuleCode)
      : undefined;
    if (base) {
      if (validateSodRuleDerivation(base, rule).length === 0) {
        replaced.set(base.code, rule);
      }
    } else if (!platformByCode.has(rule.code)) {
      extras.push(rule);
    }
  }
  return [...platform.map((r) => replaced.get(r.code) ?? r), ...extras];
}

/** Problema de una petición de excepción. */
export interface SodExceptionIssue {
  readonly code:
    | 'SOD_RULE_HARD'
    | 'SOD_EXCEPTION_NOT_NEEDED'
    | 'JUSTIFICATION_TOO_SHORT'
    | 'VALID_TO_REQUIRED'
    | 'VALID_TO_NOT_IN_FUTURE'
    | 'VALID_TO_EXCEEDS_LIMIT';
  /** Para `VALID_TO_EXCEEDS_LIMIT`: el tope aplicable, en días. */
  readonly limitDays?: number;
}

/**
 * Valida la petición de una excepción: la regla debe admitirla; justificación
 * de al menos 30 caracteres; `valid_to` obligatorio, futuro y dentro del tope
 * (el menor entre el ajuste `maxSodExceptionDays`, el de la regla y el duro de
 * 180 días).
 */
export function validateSodExceptionRequest(input: {
  readonly rule: SodRule;
  readonly justification: string;
  readonly validTo?: Date;
  readonly now: Date;
  /** Ajuste `maxSodExceptionDays`; por defecto 90. */
  readonly settingMaxDays?: number;
}): SodExceptionIssue[] {
  const { rule, now } = input;
  if (rule.isHard || rule.action === 'BLOCK')
    return [{ code: 'SOD_RULE_HARD' }];
  if (rule.action === 'WARN') return [{ code: 'SOD_EXCEPTION_NOT_NEEDED' }];
  const issues: SodExceptionIssue[] = [];
  if (input.justification.trim().length < SOD_EXCEPTION_MIN_JUSTIFICATION) {
    issues.push({ code: 'JUSTIFICATION_TOO_SHORT' });
  }
  const to = input.validTo;
  if (!to || Number.isNaN(to.getTime())) {
    issues.push({ code: 'VALID_TO_REQUIRED' });
    return issues;
  }
  if (to.getTime() <= now.getTime()) {
    issues.push({ code: 'VALID_TO_NOT_IN_FUTURE' });
    return issues;
  }
  const limitDays = Math.min(
    input.settingMaxDays ?? SOD_EXCEPTION_DEFAULT_MAX_DAYS,
    rule.maxExceptionDays ?? Number.POSITIVE_INFINITY,
    SOD_EXCEPTION_HARD_MAX_DAYS,
  );
  if (to.getTime() > now.getTime() + limitDays * 86_400_000) {
    issues.push({ code: 'VALID_TO_EXCEEDS_LIMIT', limitDays });
  }
  return issues;
}

/**
 * Concesión que se revoca cuando una excepción vencida no se renueva: la de
 * menor antigüedad (la más reciente) entre las que causan el conflicto. El
 * empate de fecha se resuelve por id.
 *
 * @param finding - Hallazgo que reapareció.
 * @param grants - Fecha de creación de las concesiones de la persona.
 * @returns El id a revocar; `undefined` si ninguna de las que causan el conflicto está en `grants`.
 */
export function selectRemediationGrant(
  finding: Pick<SodFinding, 'grantIdsA' | 'grantIdsB'>,
  grants: ReadonlyArray<{ readonly grantId: string; readonly createdAt: Date }>,
): string | undefined {
  const involved = new Set([...finding.grantIdsA, ...finding.grantIdsB]);
  const candidates = grants.filter((g) => involved.has(g.grantId));
  candidates.sort(
    (x, y) =>
      y.createdAt.getTime() - x.createdAt.getTime() ||
      x.grantId.localeCompare(y.grantId),
  );
  return candidates[0]?.grantId;
}
