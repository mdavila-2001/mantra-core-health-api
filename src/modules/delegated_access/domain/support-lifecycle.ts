import { adjustmentOnlyReduces } from './support-access-review.decision';
import { canonicalJson } from './support-canonical-json';
import {
  atomsOfGrant,
  effectiveAtoms,
  grantsOverlap,
  targetWithin,
  type AtomHoldingGrant,
} from './support-grant-targets';
import { privilegeDelta, privilegeScore } from './support-privilege-score';
import { TARGET_CONSTRAINTS } from './support-targets';

/**
 * Ciclo de vida de un vínculo de apoyo (CONTRATO-GOBIERNO §6.1): ingreso
 * (joiner), cambio (mover), baja (leaver), suspensión y reactivación. Todo es
 * puro: listas de verificación, compuerta de ingreso, plan del cambio, plan del
 * traspaso, inactividad y elegibilidad del dueño. Los servicios solo escriben.
 */

const DAY_MS = 86_400_000;

/** Tipo de caso (`delegated_access:LIFECYCLE_*` sin el prefijo). */
export type LifecycleKind =
  'JOINER' | 'MOVER' | 'LEAVER' | 'SUSPENSION' | 'REACTIVATION';

/** Cómo se completa un ítem. */
export type ChecklistCompletion = 'AUTOMATIC' | 'MANUAL' | 'EITHER';

/** Estado de un ítem de la lista. */
export type ChecklistStatus = 'PENDING' | 'DONE' | 'NOT_APPLICABLE';

/** Un ítem de `lifecycle_cases.checklist_json`. */
export interface ChecklistItem {
  readonly code: string;
  /** Texto para el usuario. */
  readonly label: string;
  /** ¿Bloquea completar el caso (y, en el ingreso, la compuerta)? */
  readonly required: boolean;
  /** `AUTOMATIC` no se marca a mano (el sistema lo deduce de los hechos). */
  readonly completion: ChecklistCompletion;
  readonly status: ChecklistStatus;
  readonly completedAt?: Date | null;
  /** Solo `DOCTOR_ACCEPTANCES`: cuántos doctores faltan por aceptar. */
  readonly pendingCount?: number;
}

/** Los siete ítems del ingreso, en orden (§6.1). */
export const JOINER_ITEM_CODES = [
  'IDENTITY_VERIFIED',
  'CONFIDENTIALITY_ACK',
  'MFA_ENROLLED',
  'SUPERVISOR_ASSIGNED',
  'SCOPE_REVIEWED',
  'FIRST_REVIEW_SCHEDULED',
  'DOCTOR_ACCEPTANCES',
] as const;

/** Plazo para completar el ingreso, en días. */
export const ONBOARDING_DUE_DAYS = 7;

/** Hechos de los que se deduce la lista de ingreso. */
export interface JoinerFacts {
  readonly now: Date;
  /** ¿La cuenta ya tiene identidad verificada por la plataforma? (automático). */
  readonly platformIdentityVerified?: boolean;
  /** Identidad registrada por un administrador (en persona o con documento). */
  readonly identityVerifiedAt?: Date | null;
  /** Compromiso de confidencialidad aceptado por la persona. */
  readonly confidentialityAckAt?: Date | null;
  readonly mfaEnrolled: boolean;
  /** La organización exige verificación en dos pasos a su personal. */
  readonly requireMfa: boolean;
  readonly supervisorUserId?: string | null;
  /** Hay hallazgo SoD `BLOQUEAR`, o `EXIGIR APROBACIÓN` sin excepción. */
  readonly scopeBlocked: boolean;
  readonly nextRecertificationAt?: Date | null;
  readonly doctorAcceptancesPending: number;
  readonly doctorAcceptancesTotal: number;
}

interface ItemSpec {
  readonly code: string;
  readonly label: string;
  readonly required: boolean;
  readonly completion: ChecklistCompletion;
}

function blank(spec: ItemSpec): ChecklistItem {
  return { ...spec, status: 'PENDING', completedAt: null };
}

const OTHER_CHECKLISTS: Readonly<
  Record<Exclude<LifecycleKind, 'JOINER'>, readonly ItemSpec[]>
> = {
  MOVER: [
    {
      code: 'MOVE_VALIDATED',
      label: 'Cambio validado (condiciones, techos, barandillas y funciones)',
      required: true,
      completion: 'AUTOMATIC',
    },
    {
      code: 'GRANTS_REPLACED',
      label: 'Permisos anteriores vencidos y nuevos creados',
      required: true,
      completion: 'AUTOMATIC',
    },
    {
      code: 'FOUR_EYES_APPROVED',
      label: 'Aprobación de una segunda persona, si el cambio sube privilegios',
      required: false,
      completion: 'AUTOMATIC',
    },
    {
      code: 'REVIEW_CAMPAIGN_OPENED',
      label: 'Revisión de los permisos nuevos abierta',
      required: true,
      completion: 'AUTOMATIC',
    },
  ],
  LEAVER: [
    {
      code: 'ACCESS_REVOKED',
      label: 'Acceso retirado',
      required: true,
      completion: 'AUTOMATIC',
    },
    {
      code: 'HANDOVER_ASSIGNED',
      label: 'Responsable del traspaso elegido',
      required: true,
      completion: 'EITHER',
    },
    {
      code: 'HANDOVER_COMPLETED',
      label: 'Trabajo reasignado',
      required: true,
      completion: 'AUTOMATIC',
    },
  ],
  SUSPENSION: [
    {
      code: 'ACCESS_SUSPENDED',
      label: 'Acceso suspendido',
      required: true,
      completion: 'AUTOMATIC',
    },
    {
      code: 'REASON_RECORDED',
      label: 'Motivo registrado',
      required: true,
      completion: 'AUTOMATIC',
    },
  ],
  REACTIVATION: [
    {
      code: 'FOUR_EYES_APPROVED',
      label: 'Reactivación aprobada por otra persona',
      required: true,
      completion: 'AUTOMATIC',
    },
    {
      code: 'ACCESS_RESTORED',
      label: 'Acceso restituido',
      required: true,
      completion: 'AUTOMATIC',
    },
  ],
};

const JOINER_SPECS: Readonly<
  Record<
    (typeof JOINER_ITEM_CODES)[number],
    Omit<ItemSpec, 'code' | 'required'>
  >
> = {
  IDENTITY_VERIFIED: {
    label: 'Identidad verificada con documento',
    completion: 'EITHER',
  },
  // Solo la propia persona lo acepta (`POST /me/support-engagements/:id/confidentiality-ack`):
  // por la ruta de administración no se marca (un administrador no firma por ella).
  CONFIDENTIALITY_ACK: {
    label: 'Compromiso de confidencialidad aceptado por la persona',
    completion: 'AUTOMATIC',
  },
  MFA_ENROLLED: {
    label: 'Verificación en dos pasos activa',
    completion: 'AUTOMATIC',
  },
  SUPERVISOR_ASSIGNED: {
    label: 'Dueño de la cuenta asignado',
    completion: 'MANUAL',
  },
  SCOPE_REVIEWED: {
    label: 'Alcance revisado sin conflictos de funciones',
    completion: 'AUTOMATIC',
  },
  FIRST_REVIEW_SCHEDULED: {
    label: 'Primera recertificación programada',
    completion: 'AUTOMATIC',
  },
  DOCTOR_ACCEPTANCES: {
    label: 'Doctores cubiertos aceptaron',
    completion: 'AUTOMATIC',
  },
};

/**
 * Lista de verificación en blanco de un tipo de caso (todo pendiente). Para el
 * ingreso, `evaluateJoinerChecklist` la deduce de los hechos.
 */
export function checklistFor(kind: LifecycleKind): ChecklistItem[] {
  if (kind === 'JOINER') {
    return JOINER_ITEM_CODES.map((code) =>
      blank({
        code,
        required: code !== 'DOCTOR_ACCEPTANCES',
        ...JOINER_SPECS[code],
      }),
    );
  }
  return OTHER_CHECKLISTS[kind].map(blank);
}

function done(
  spec: ItemSpec,
  at: Date | null | undefined,
  now: Date,
): ChecklistItem {
  return { ...spec, status: 'DONE', completedAt: at ?? now };
}

/**
 * Lista de ingreso deducida de los hechos (7 ítems, §6.1). Obligatorios: todos
 * menos `DOCTOR_ACCEPTANCES` (informativo) y `MFA_ENROLLED` cuando la
 * organización no exige `require_mfa` (entonces es recomendado).
 */
export function evaluateJoinerChecklist(facts: JoinerFacts): ChecklistItem[] {
  const spec = (
    code: (typeof JOINER_ITEM_CODES)[number],
    required: boolean,
  ): ItemSpec => ({
    code,
    required,
    ...JOINER_SPECS[code],
  });
  const state = (s: ItemSpec, ok: boolean, at?: Date | null): ChecklistItem =>
    ok ? done(s, at, facts.now) : blank(s);
  const supervised = !!facts.supervisorUserId;
  return [
    state(
      spec('IDENTITY_VERIFIED', true),
      !!facts.identityVerifiedAt || facts.platformIdentityVerified === true,
      facts.identityVerifiedAt,
    ),
    state(
      spec('CONFIDENTIALITY_ACK', true),
      !!facts.confidentialityAckAt,
      facts.confidentialityAckAt,
    ),
    state(spec('MFA_ENROLLED', facts.requireMfa), facts.mfaEnrolled),
    state(spec('SUPERVISOR_ASSIGNED', true), supervised),
    state(spec('SCOPE_REVIEWED', true), !facts.scopeBlocked),
    state(spec('FIRST_REVIEW_SCHEDULED', true), !!facts.nextRecertificationAt),
    {
      ...state(
        spec('DOCTOR_ACCEPTANCES', false),
        facts.doctorAcceptancesPending === 0,
      ),
      pendingCount: facts.doctorAcceptancesPending,
    },
  ];
}

/** Códigos de los ítems obligatorios que faltan, en el orden de la lista. */
export function pendingRequired(items: readonly ChecklistItem[]): string[] {
  return items
    .filter((i) => i.required && i.status === 'PENDING')
    .map((i) => i.code);
}

/** ¿Se puede completar el caso? Todos los ítems obligatorios hechos. */
export function canComplete(items: readonly ChecklistItem[]): boolean {
  return pendingRequired(items).length === 0;
}

/**
 * Marca un ítem a mano. Los automáticos no se marcan (409
 * `LIFECYCLE_ITEM_AUTOMATIC`): el sistema los deduce de los hechos.
 */
export function completeChecklistItem(
  items: readonly ChecklistItem[],
  code: string,
  at: Date,
):
  | { readonly ok: true; readonly items: ChecklistItem[] }
  | {
      readonly ok: false;
      readonly reason: 'LIFECYCLE_ITEM_AUTOMATIC' | 'LIFECYCLE_ITEM_UNKNOWN';
    } {
  const item = items.find((i) => i.code === code);
  if (!item) return { ok: false, reason: 'LIFECYCLE_ITEM_UNKNOWN' };
  if (item.completion === 'AUTOMATIC')
    return { ok: false, reason: 'LIFECYCLE_ITEM_AUTOMATIC' };
  return {
    ok: true,
    items: items.map((i) =>
      i.code === code ? { ...i, status: 'DONE', completedAt: at } : i,
    ),
  };
}

/** Ajustes de gobierno que mandan en la compuerta (`practice_settings['support.governance']`). */
export interface OnboardingSettings {
  readonly onboardingRequired: boolean;
  /** Solo rige para vínculos creados desde esta fecha; sin fecha rige para todos los que no estén marcados como completos. */
  readonly onboardingRequiredSince?: Date | null;
}

/** Resultado de la compuerta. */
export interface OnboardingGateResult {
  /** ¿Se bloquea el acceso (`DENY ONBOARDING_INCOMPLETE`)? */
  readonly incomplete: boolean;
  /** ¿La compuerta rige para este vínculo? */
  readonly applies: boolean;
  /** Ítems obligatorios que faltan (para el mensaje). */
  readonly pending: readonly string[];
  readonly reason: 'DISABLED' | 'PREDATES_GATE' | 'COMPLETED' | 'INCOMPLETE';
  readonly dueAt: Date;
  /** Pasó el plazo de 7 días sin completar (aparece en el tablero y se avisa al dueño). */
  readonly overdue: boolean;
}

/** Fin del plazo de ingreso: 7 días desde que nació el vínculo. */
export function onboardingDueAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + ONBOARDING_DUE_DAYS * DAY_MS);
}

/**
 * Compuerta de ingreso (D-03): con `onboardingRequired`, mientras falte un ítem
 * obligatorio la política responde `ONBOARDING_INCOMPLETE`. Solo rige para
 * vínculos creados desde `onboardingRequiredSince`; los anteriores no se cortan.
 * Un vínculo con `onboarding_completed_at` ya está libre.
 */
export function onboardingGate(input: {
  readonly settings: OnboardingSettings;
  readonly engagementCreatedAt: Date;
  readonly onboardingCompletedAt?: Date | null;
  readonly checklist: readonly ChecklistItem[];
  readonly now?: Date;
}): OnboardingGateResult {
  const dueAt = onboardingDueAt(input.engagementCreatedAt);
  const base = { dueAt, overdue: false, pending: [] as string[] };
  const since = input.settings.onboardingRequiredSince;
  if (!input.settings.onboardingRequired) {
    return { ...base, incomplete: false, applies: false, reason: 'DISABLED' };
  }
  if (since && input.engagementCreatedAt.getTime() < since.getTime()) {
    return {
      ...base,
      incomplete: false,
      applies: false,
      reason: 'PREDATES_GATE',
    };
  }
  const pending = input.onboardingCompletedAt
    ? []
    : pendingRequired(input.checklist);
  if (pending.length === 0) {
    return { ...base, incomplete: false, applies: true, reason: 'COMPLETED' };
  }
  return {
    dueAt,
    pending,
    incomplete: true,
    applies: true,
    reason: 'INCOMPLETE',
    overdue: input.now !== undefined && input.now.getTime() >= dueAt.getTime(),
  };
}

/** Umbral de puntos que obliga a cuatro ojos en un cambio de rol (§6.1). */
export const MOVE_FOUR_EYES_SCORE_THRESHOLD = 10;

/** ¿Un cambio de rol pasa por cuatro ojos? */
export interface MoveFourEyesDecision {
  readonly requiresFourEyes: boolean;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  /**
   * `SCORE_INCREASE` (más de 10 puntos), `NEW_HIGH_SENSITIVITY` (átomo ALTA o
   * CRÍTICA que no tenía) y, en un plan completo, los que el puntaje no ve
   * (B-M4): `SCOPE_WIDENED` (ampliar a «todos»), `CONDITIONS_REMOVED`,
   * `VALIDITY_REMOVED` y `DENY_REMOVED`.
   */
  readonly reasons: ReadonlyArray<MoveFourEyesReason>;
  readonly newHighAtoms: readonly string[];
}

/** Por qué un cambio de rol pasa por cuatro ojos. */
export type MoveFourEyesReason =
  | 'SCORE_INCREASE'
  | 'NEW_HIGH_SENSITIVITY'
  | 'SCOPE_WIDENED'
  | 'CONDITIONS_REMOVED'
  | 'VALIDITY_REMOVED'
  | 'DENY_REMOVED';

/**
 * Cuatro ojos del «mover»: el puntaje sube MÁS de 10 puntos, o aparece algún
 * átomo de sensibilidad ALTA o superior que la persona no tenía.
 */
export function moveRequiresFourEyes(
  before: Iterable<string>,
  after: Iterable<string>,
  thresholdPoints: number = MOVE_FOUR_EYES_SCORE_THRESHOLD,
): MoveFourEyesDecision {
  const d = privilegeDelta(before, after);
  const reasons: MoveFourEyesReason[] = [];
  if (d.delta > thresholdPoints) reasons.push('SCORE_INCREASE');
  if (d.newHighAtoms.length > 0) reasons.push('NEW_HIGH_SENSITIVITY');
  return {
    requiresFourEyes: reasons.length > 0,
    before: d.before,
    after: d.after,
    delta: d.delta,
    reasons,
    newHighAtoms: d.newHighAtoms,
  };
}

/** Campaña que abre un cambio de rol: un ítem por concesión nueva; solo escala. */
export const MOVER_REVIEW_POLICY = {
  kind: 'MOVER',
  dueDays: 14,
  uncertifiedAction: 'UNCERTIFIED_ESCALATE',
} as const;

/** Concesión de un conjunto propuesto (o vigente) en un cambio de rol. */
export type MoveGrantInput = Omit<AtomHoldingGrant, 'grantId'> & {
  readonly grantId?: string;
  /** Condición del permiso (se compara tal cual). */
  readonly condition?: unknown;
};

/** Concesión vigente de la persona (con id) en un cambio de rol. */
export type MoveCurrentGrant = MoveGrantInput & { readonly grantId: string };

/** Plan de un cambio de rol. */
export interface MovePlan {
  /** Concesiones vigentes que se conservan tal cual. */
  readonly keep: ReadonlyArray<{ readonly grantId: string }>;
  /** Concesiones vigentes que pasan a `REVOKED` con `valid_to = effectiveAt` (sin período de gracia). */
  readonly revoke: ReadonlyArray<{
    readonly grantId: string;
    readonly validTo: Date;
  }>;
  /** Concesiones nuevas que se crean. */
  readonly create: readonly MoveGrantInput[];
  /** Posición de cada una de `create` dentro del conjunto propuesto. */
  readonly createIndexes: readonly number[];
  readonly scoreBefore: number;
  readonly scoreAfter: number;
  readonly fourEyes: MoveFourEyesDecision;
  /** Campaña `MOVER` que se abre tras ejecutar. */
  readonly review: {
    readonly kind: 'MOVER';
    readonly itemCount: number;
    readonly dueAt: Date;
    readonly uncertifiedAction: 'UNCERTIFIED_ESCALATE';
    /** Posiciones, en el conjunto propuesto, de las concesiones a revisar. */
    readonly newGrantIndexes: readonly number[];
  };
}

/** Un objetivo «FIXED» propuesto no trae foto: se mide como su peor caso (`DYNAMIC`). */
function worstCase(g: MoveGrantInput): MoveGrantInput {
  return g.expansionMode === 'FIXED' && !g.snapshot
    ? { ...g, expansionMode: 'DYNAMIC' }
    : g;
}

/** ¿El tipo de objetivo deja alguna dimensión en «todos»? */
function hasAnyDimension(g: MoveGrantInput): boolean {
  const c = TARGET_CONSTRAINTS[g.targetKind];
  return (
    c.practitioner === 'ANY' || c.service === 'ANY' || c.location === 'ANY'
  );
}

function grantAtoms(g: MoveGrantInput): Set<string> {
  return new Set(atomsOfGrant(g));
}

/**
 * Lo que el puntaje de privilegios NO ve y un cambio de rol puede aflojar
 * (B-M4): ampliar a «todos» con los mismos átomos, quitar o aflojar condiciones
 * o vigencia de un permiso que sigue existiendo y borrar una prohibición `DENY`.
 *
 * @param current - Concesiones vigentes (con efecto).
 * @param proposed - Conjunto COMPLETO propuesto.
 * @param revokedIds - Vigentes que dejan de existir.
 */
function structuralMoveReasons(
  current: readonly MoveCurrentGrant[],
  proposed: readonly MoveGrantInput[],
  revokedIds: ReadonlySet<string>,
): MoveFourEyesReason[] {
  const reasons: MoveFourEyesReason[] = [];
  const liveAllow = current.filter((c) => c.effect !== 'DENY');
  const newAllow = proposed.filter((p) => p.effect !== 'DENY');

  // Ampliar a «todos»: un permiso nuevo con alguna dimensión «ALL» que ninguno
  // de los actuales, con esos mismos átomos, ya cubría por completo.
  const widened = newAllow.some((g) => {
    if (!hasAnyDimension(g)) return false;
    const atoms = grantAtoms(g);
    return !liveAllow.some((c) => {
      const have = grantAtoms(c);
      return (
        [...atoms].every((a) => have.has(a)) && targetWithin(worstCase(g), c)
      );
    });
  });
  if (widened) reasons.push('SCOPE_WIDENED');

  // Condiciones y vigencia: ningún permiso propuesto que comparta átomos y se
  // cruce con uno actual puede ser más flojo que él (la unión de permisos gana).
  let conditions = false;
  let validity = false;
  for (const c of liveAllow) {
    const cAtoms = grantAtoms(c);
    const hasCondition =
      c.condition !== undefined &&
      c.condition !== null &&
      Object.keys(c.condition).some((k) => k !== 'schemaVersion');
    if (!hasCondition && !c.validTo) continue;
    for (const g of newAllow) {
      const shared = [...grantAtoms(g)].some((a) => cAtoms.has(a));
      if (!shared || !grantsOverlap(worstCase(g), c)) continue;
      if (
        hasCondition &&
        !adjustmentOnlyReduces(
          { atoms: [], condition: c.condition },
          { condition: g.condition ?? null },
        ).ok
      ) {
        conditions = true;
      }
      if (
        c.validTo &&
        (!g.validTo || g.validTo.getTime() > c.validTo.getTime())
      ) {
        validity = true;
      }
    }
  }
  if (conditions) reasons.push('CONDITIONS_REMOVED');
  if (validity) reasons.push('VALIDITY_REMOVED');

  if (current.some((c) => c.effect === 'DENY' && revokedIds.has(c.grantId))) {
    reasons.push('DENY_REMOVED');
  }
  return reasons;
}

function signature(g: MoveGrantInput): string {
  const actions = [
    ...new Set([...g.actions, ...(g.atomGrants ?? []).map((a) => a.atom)]),
  ].sort();
  return canonicalJson({
    kind: g.targetKind,
    mode: g.expansionMode ?? 'DYNAMIC',
    practitioner:
      g.practitionerProfileId ?? g.practitionerRoleAssignmentId ?? null,
    service: g.healthcareServiceId ?? null,
    space: g.careSpaceId ?? null,
    site: g.practiceSiteId ?? null,
    snapshot: g.snapshot ?? null,
    effect: g.effect ?? 'ALLOW',
    actions,
    condition: g.condition ?? null,
    validFrom: g.validFrom ?? null,
    validTo: g.validTo ?? null,
  });
}

/**
 * Plan de un cambio de rol o alcance (`POST …/move`). El conjunto propuesto es
 * COMPLETO: las concesiones vigentes que no estén en él vencen en `effectiveAt`
 * («expira lo anterior», mínimo privilegio); las que coinciden en objetivo,
 * efecto, acciones, condición y vigencia se conservan; las demás se crean. Un
 * mismo objetivo con otros átomos o condición cuenta como otro permiso.
 * Calcula el puntaje antes y después y si exige cuatro ojos, y describe la
 * campaña `MOVER` (un ítem por concesión `ALLOW` nueva, 14 días, solo escala).
 */
export function planMove(input: {
  readonly currentGrants: readonly (MoveGrantInput & {
    readonly grantId: string;
  })[];
  readonly newGrants: readonly MoveGrantInput[];
  readonly effectiveAt: Date;
  readonly now: Date;
}): MovePlan {
  const remaining = input.currentGrants.map((g) => ({
    g,
    sig: signature(g),
    taken: false,
  }));
  const keep: Array<{ grantId: string }> = [];
  const create: MoveGrantInput[] = [];
  const createIndexes: number[] = [];
  input.newGrants.forEach((candidate, index) => {
    const sig = signature(candidate);
    const match = remaining.find((r) => !r.taken && r.sig === sig);
    if (match) {
      match.taken = true;
      keep.push({ grantId: match.g.grantId });
    } else {
      create.push(candidate);
      createIndexes.push(index);
    }
  });
  const revoke = remaining
    .filter((r) => !r.taken)
    .map((r) => ({ grantId: r.g.grantId, validTo: input.effectiveAt }));

  const beforeAtoms = effectiveAtoms(
    input.currentGrants.map((g) => ({ ...g, grantId: g.grantId })),
    input.now,
  );
  const afterAtoms = [
    ...new Set(
      input.newGrants
        .filter((g) => g.effect !== 'DENY')
        .flatMap((g) => atomsOfGrant(g)),
    ),
  ];
  const reviewIndexes = createIndexes.filter(
    (i) => input.newGrants[i].effect !== 'DENY',
  );
  const byScore = moveRequiresFourEyes(beforeAtoms, afterAtoms);
  const structural = structuralMoveReasons(
    input.currentGrants,
    input.newGrants,
    new Set(revoke.map((r) => r.grantId)),
  );
  return {
    keep,
    revoke,
    create,
    createIndexes,
    scoreBefore: privilegeScore(beforeAtoms),
    scoreAfter: privilegeScore(afterAtoms),
    fourEyes: {
      ...byScore,
      requiresFourEyes: byScore.requiresFourEyes || structural.length > 0,
      reasons: [...byScore.reasons, ...structural],
    },
    review: {
      kind: MOVER_REVIEW_POLICY.kind,
      itemCount: reviewIndexes.length,
      dueAt: new Date(
        input.now.getTime() + MOVER_REVIEW_POLICY.dueDays * DAY_MS,
      ),
      uncertifiedAction: MOVER_REVIEW_POLICY.uncertifiedAction,
      newGrantIndexes: reviewIndexes,
    },
  };
}

/** Tipo de trabajo que una persona tiene en las manos (`HANDOVER_*`). */
export type HandoverKind =
  | 'CONVERSATION'
  | 'WORKFLOW_TASK'
  | 'SUPERVISED_ENGAGEMENT'
  | 'PENDING_BOOKING';

/** Estado de una fila de traspaso (`HANDOVER_*`). */
export type HandoverStatus =
  'PENDING' | 'REASSIGNED' | 'RETURNED_TO_POOL' | 'CLOSED';

/** Un trabajo por traspasar. */
export interface HandoverCandidate {
  readonly id: string;
  readonly kind: HandoverKind;
  readonly fromUserId: string;
  /** Perfil del doctor de la conversación (para saber quién puede responder por él). */
  readonly practitionerProfileId?: string;
}

/** Lo que pide el administrador al dar de baja. */
export interface HandoverRequest {
  readonly defaultToUserId?: string | null;
  readonly items?: ReadonlyArray<{
    readonly id: string;
    readonly toUserId: string;
  }>;
  /** Nuevo dueño de las cuentas que supervisaba la persona. */
  readonly supervisedTo?: string | null;
}

/** Qué se hace con un trabajo. */
export interface HandoverAssignment {
  readonly itemId: string;
  readonly kind: HandoverKind;
  readonly fromUserId: string;
  readonly toUserId: string | null;
  readonly status: HandoverStatus;
  /**
   * `false` en la cita pendiente: no cambia de dueño; `toUserId` es solo el
   * responsable de seguimiento (D-21).
   */
  readonly changesOwner: boolean;
}

/** Problema que impide el traspaso (se valida ANTES de escribir nada). */
export interface HandoverIssue {
  readonly code: 'HANDOVER_SUPERVISOR_REQUIRED' | 'HANDOVER_TARGET_INELIGIBLE';
  readonly itemId: string;
}

/** Resultado del plan de traspaso. */
export type HandoverPlan =
  | {
      readonly ok: true;
      readonly assignments: readonly HandoverAssignment[];
      readonly pendingCount: number;
      readonly caseStatus: 'OPEN' | 'COMPLETED';
    }
  | { readonly ok: false; readonly issues: readonly HandoverIssue[] };

/** El caso de baja se completa cuando ningún traspaso queda pendiente. */
export function leaverCaseStatus(
  assignments: ReadonlyArray<{ readonly status: HandoverStatus }>,
): 'OPEN' | 'COMPLETED' {
  return assignments.some((a) => a.status === 'PENDING') ? 'OPEN' : 'COMPLETED';
}

/**
 * Plan del traspaso de la baja (§6.1). Reglas:
 * - conversación → a quien se indique (por ítem, o `defaultToUserId`) SOLO si esa
 *   persona puede responder por el doctor de la conversación; si no, vuelve a la
 *   bandeja común (`RETURNED_TO_POOL`);
 * - tarea → a quien se indique; sin destinatario, queda por rol (`RETURNED_TO_POOL`);
 * - cuentas supervisadas → el nuevo dueño es OBLIGATORIO (`supervisedTo` o por
 *   ítem; el destinatario por defecto no vale), validado antes de escribir;
 * - cita pendiente → no cambia de dueño: el destinatario queda como responsable
 *   de seguimiento; sin destinatario solo se lista (`CLOSED`).
 * Con `handover = null` la baja es igual de inmediata y todo queda `PENDING`.
 * Nunca se traspasa a quien se va.
 */
export function planHandover(input: {
  readonly items: readonly HandoverCandidate[];
  readonly handover: HandoverRequest | null | undefined;
  /** Quiénes pueden responder por cada doctor (`replyersOfDoctor`). */
  readonly replyersByDoctor?: Readonly<Record<string, readonly string[]>>;
  /** Si se da, solo estos usuarios son destinatarios válidos. */
  readonly eligibleTargetUserIds?: readonly string[];
}): HandoverPlan {
  const { items, handover } = input;
  if (handover === null) {
    const assignments = items.map<HandoverAssignment>((i) => ({
      itemId: i.id,
      kind: i.kind,
      fromUserId: i.fromUserId,
      toUserId: null,
      status: 'PENDING',
      changesOwner: i.kind !== 'PENDING_BOOKING',
    }));
    return {
      ok: true,
      assignments,
      pendingCount: assignments.length,
      caseStatus: 'OPEN',
    };
  }
  const request = handover ?? {};
  const overrides = new Map(
    (request.items ?? []).map((o) => [o.id, o.toUserId]),
  );
  const eligible = input.eligibleTargetUserIds
    ? new Set(input.eligibleTargetUserIds)
    : undefined;
  const issues: HandoverIssue[] = [];
  const assignments: HandoverAssignment[] = [];
  for (const item of items) {
    const base = {
      itemId: item.id,
      kind: item.kind,
      fromUserId: item.fromUserId,
      changesOwner: item.kind !== 'PENDING_BOOKING',
    };
    const override = overrides.get(item.id);
    const target =
      item.kind === 'SUPERVISED_ENGAGEMENT'
        ? (override ?? request.supervisedTo ?? null)
        : (override ?? request.defaultToUserId ?? null);
    if (item.kind === 'SUPERVISED_ENGAGEMENT' && !target) {
      issues.push({ code: 'HANDOVER_SUPERVISOR_REQUIRED', itemId: item.id });
      continue;
    }
    if (
      target &&
      (target === item.fromUserId || (eligible && !eligible.has(target)))
    ) {
      issues.push({ code: 'HANDOVER_TARGET_INELIGIBLE', itemId: item.id });
      continue;
    }
    if (item.kind === 'PENDING_BOOKING') {
      assignments.push(
        target
          ? { ...base, toUserId: target, status: 'REASSIGNED' }
          : { ...base, toUserId: null, status: 'CLOSED' },
      );
    } else if (item.kind === 'CONVERSATION') {
      const canReply =
        !!target &&
        !!item.practitionerProfileId &&
        (input.replyersByDoctor?.[item.practitionerProfileId] ?? []).includes(
          target,
        );
      assignments.push(
        canReply
          ? { ...base, toUserId: target, status: 'REASSIGNED' }
          : { ...base, toUserId: null, status: 'RETURNED_TO_POOL' },
      );
    } else {
      assignments.push(
        target
          ? { ...base, toUserId: target, status: 'REASSIGNED' }
          : { ...base, toUserId: null, status: 'RETURNED_TO_POOL' },
      );
    }
  }
  if (issues.length > 0) return { ok: false, issues };
  const caseStatus = leaverCaseStatus(assignments);
  return {
    ok: true,
    assignments,
    pendingCount: assignments.filter((a) => a.status === 'PENDING').length,
    caseStatus,
  };
}

/** Fases fijas de la baja: validar lo obligatorio, revocar y confirmar, y solo después reasignar. */
export const OFFBOARD_PHASES = [
  { phase: 'VALIDATE_HANDOVER', transaction: 0 },
  { phase: 'REVOKE_ACCESS', transaction: 1 },
  { phase: 'REASSIGN_WORK', transaction: 2 },
] as const;

/**
 * AC-8: la revocación se confirmó ANTES de cualquier reasignación (por marcas de
 * tiempo). Sin marca de revocación, no se cumple.
 */
export function verifyRevokeBeforeReassign(
  revokedAt: Date | undefined,
  reassignedAts: readonly Date[],
): boolean {
  if (!revokedAt) return false;
  return reassignedAts.every((t) => t.getTime() >= revokedAt.getTime());
}

/** Estado del vínculo para suspender o reactivar. */
export type EngagementLiveState = 'ACTIVE' | 'SUSPENDED' | 'ENDED';

/** ¿Se puede suspender? Solo un vínculo activo. */
export function canSuspend(state: EngagementLiveState):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason:
        'ENGAGEMENT_ALREADY_SUSPENDED' | 'SUPPORT_ENGAGEMENT_NOT_ACTIVE';
    } {
  if (state === 'ACTIVE') return { ok: true };
  return {
    ok: false,
    reason:
      state === 'SUSPENDED'
        ? 'ENGAGEMENT_ALREADY_SUSPENDED'
        : 'SUPPORT_ENGAGEMENT_NOT_ACTIVE',
  };
}

/** ¿Se puede reactivar? Solo un vínculo suspendido. */
export function canReactivate(state: EngagementLiveState):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason:
        'ENGAGEMENT_NOT_SUSPENDED' | 'SUPPORT_ENGAGEMENT_NOT_ACTIVE';
    } {
  if (state === 'SUSPENDED') return { ok: true };
  return {
    ok: false,
    reason:
      state === 'ENDED'
        ? 'SUPPORT_ENGAGEMENT_NOT_ACTIVE'
        : 'ENGAGEMENT_NOT_SUSPENDED',
  };
}

/** Días de suspensión tras los cuales reactivar abre una revisión (ajuste `suspensionReviewAfterDays`). */
export const DEFAULT_SUSPENSION_REVIEW_AFTER_DAYS = 60;

/**
 * Reactivar tras más de 60 días de suspensión abre además un ítem `TARGETED`
 * para el dueño de la cuenta (7 días).
 */
export function reactivationReview(input: {
  readonly suspendedAt: Date;
  readonly reactivatedAt: Date;
  readonly afterDays?: number;
}): {
  readonly opensReview: boolean;
  readonly kind: 'TARGETED';
  readonly dueDays: 7;
  readonly daysSuspended: number;
} {
  const daysSuspended = Math.floor(
    (input.reactivatedAt.getTime() - input.suspendedAt.getTime()) / DAY_MS,
  );
  return {
    opensReview:
      daysSuspended > (input.afterDays ?? DEFAULT_SUSPENSION_REVIEW_AFTER_DAYS),
    kind: 'TARGETED',
    dueDays: 7,
    daysSuspended,
  };
}

/** Días sin actividad tras los cuales se sugiere suspender (`inactivityDays`, D-04). */
export const DEFAULT_INACTIVITY_DAYS = 45;
/** Valor recomendado de `autoSuspendInactiveDays` (D-04); por defecto el ajuste está apagado (`null`). */
export const RECOMMENDED_AUTO_SUSPEND_INACTIVE_DAYS = 90;

/** Resultado de medir la inactividad. */
export interface InactivityAssessment {
  readonly inactive: boolean;
  readonly daysInactive: number;
  readonly lastActivityAt: Date;
  /** Se sugiere suspender (anomalía `ANOMALY_INACTIVE_ACCOUNT`). */
  readonly suggestSuspend: boolean;
  /** Se suspende sola (`SUSPENSION_INACTIVITY`): solo con `autoSuspendInactiveDays` y llegado ese plazo. */
  readonly autoSuspend: boolean;
}

/**
 * Inactividad: sin ningún `PERMIT` ni inicio de sesión en `inactivityDays`
 * (45 por defecto). Sin actividad alguna se cuenta desde que empezó el vínculo,
 * de modo que uno nuevo no nace inactivo.
 */
export function assessInactivity(input: {
  readonly now: Date;
  readonly referenceStart: Date;
  readonly lastPermitAt?: Date | null;
  readonly lastLoginAt?: Date | null;
  readonly inactivityDays?: number;
  readonly autoSuspendInactiveDays?: number | null;
}): InactivityAssessment {
  const times = [input.lastPermitAt, input.lastLoginAt]
    .filter((d): d is Date => !!d)
    .map((d) => d.getTime());
  const last = new Date(
    times.length > 0 ? Math.max(...times) : input.referenceStart.getTime(),
  );
  const daysInactive = Math.max(
    0,
    Math.floor((input.now.getTime() - last.getTime()) / DAY_MS),
  );
  const inactive =
    daysInactive >= (input.inactivityDays ?? DEFAULT_INACTIVITY_DAYS);
  const auto = input.autoSuspendInactiveDays;
  return {
    inactive,
    daysInactive,
    lastActivityAt: last,
    suggestSuspend: inactive,
    autoSuspend: auto !== null && auto !== undefined && daysInactive >= auto,
  };
}

/** Quién es el candidato a dueño de cuenta. */
export interface OwnerCandidate {
  readonly userId: string;
  readonly membershipLive: boolean;
  readonly isSecurityAdmin: boolean;
  readonly isOrgDoctor: boolean;
  readonly isLiveDelegatedAdmin: boolean;
}

/**
 * Elegibilidad del dueño (D-07, GP-8): `SECURITY_ADMIN`, doctor de la
 * organización o administrador delegado vivo, con membresía viva y distinto de
 * la propia persona.
 */
export function ownerEligibility(input: {
  readonly candidate: OwnerCandidate;
  readonly subjectUserId: string;
}):
  | { readonly eligible: true }
  | {
      readonly eligible: false;
      readonly reason: 'OWNER_NOT_ELIGIBLE' | 'GUARDRAIL_SELF_SUPERVISION';
    } {
  const c = input.candidate;
  if (c.userId === input.subjectUserId) {
    return { eligible: false, reason: 'GUARDRAIL_SELF_SUPERVISION' };
  }
  const role = c.isSecurityAdmin || c.isOrgDoctor || c.isLiveDelegatedAdmin;
  return c.membershipLive && role
    ? { eligible: true }
    : { eligible: false, reason: 'OWNER_NOT_ELIGIBLE' };
}

/** Por qué una cuenta cuenta como «sin dueño» (§6.1). */
export type OwnerlessReason =
  'NO_OWNER' | 'OWNER_NOT_ELIGIBLE' | 'DOCTORS_WITHOUT_ASSIGNMENT';

/** Motivos por los que un vínculo vivo está huérfano; vacío si no lo está. */
export function ownerlessReasons(input: {
  readonly supervisorUserId?: string | null;
  /** ¿El dueño actual sigue siendo elegible? (membresía, rol). */
  readonly supervisorStillEligible?: boolean;
  /** Sus concesiones apuntan solo a doctores sin asignación vigente. */
  readonly onlyDoctorsWithoutAssignment?: boolean;
}): OwnerlessReason[] {
  const out: OwnerlessReason[] = [];
  if (!input.supervisorUserId) out.push('NO_OWNER');
  else if (input.supervisorStillEligible === false)
    out.push('OWNER_NOT_ELIGIBLE');
  if (input.onlyDoctorsWithoutAssignment)
    out.push('DOCTORS_WITHOUT_ASSIGNMENT');
  return out;
}
