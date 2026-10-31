import { canonicalJson } from './support-canonical-json';
import {
  REVIEW_DEFAULTS,
  isGrantUnused,
  maxSensitivityOf,
  sensitivityRank,
  type ReviewDecision,
  type ReviewItemState,
} from './support-access-review.shared';
import { atomsOfAction } from './support-permission-catalog';
import { checkSodTransaction } from './support-sod';

/**
 * Decisiones sobre los ítems de una campaña (§6.2): quién puede decidir, qué
 * comentario se exige, que un ajuste solo reduce y el «todo o nada» del lote.
 */

/** Lo que se sabe de un ítem al decidirlo. */
export interface ReviewItemFacts {
  readonly itemId: string;
  readonly state: ReviewItemState;
  /** ¿La campaña está abierta? */
  readonly campaignOpen: boolean;
  /** La persona revisada. */
  readonly subjectUserId: string;
  /** Quienes pueden decidirlo: los revisores resueltos más a quien se escaló. */
  readonly reviewerUserIds: readonly string[];
  readonly grantedByUserId?: string | null;
  readonly approvedByUserIds?: ReadonlyArray<string | null | undefined>;
  /** Átomos o alias de la concesión (o de todas las del vínculo, en un ítem de vínculo). */
  readonly atoms: readonly string[];
  readonly lastUsedAt?: Date | null;
  readonly createdAt?: Date | null;
  /** `true` en los ítems de vínculo (recertificación). */
  readonly isEngagementItem: boolean;
}

/** Código de error de una decisión (los internos los traduce el llamador a 422). */
export type ReviewDecisionErrorCode =
  | 'REVIEW_NOT_REVIEWER'
  | 'REVIEW_CAMPAIGN_NOT_OPEN'
  | 'REVIEW_ALREADY_DECIDED'
  | 'REVIEW_COMMENT_REQUIRED'
  | 'REVIEW_ADJUST_CANNOT_BROADEN'
  /** Interna: `ADJUST` sin ajuste, sin la concesión actual o sobre un ítem de vínculo (422). */
  | 'REVIEW_ADJUST_NOT_APPLICABLE'
  | 'REVIEW_BULK_NOT_ALLOWED';

/** Resultado de validar una decisión. */
export type ReviewDecisionCheck =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: ReviewDecisionErrorCode;
      readonly httpStatus: 403 | 409 | 422;
    };

const fail = (
  code: ReviewDecisionErrorCode,
  httpStatus: 403 | 409 | 422,
): ReviewDecisionCheck => ({
  ok: false,
  code,
  httpStatus,
});

/**
 * ¿Puede esta persona decidir el ítem? Debe estar entre los revisores, no ser
 * la persona revisada y no ser quien otorgó o aprobó la concesión (`SOD-GOV-02`).
 */
export function canDecideReviewItem(
  item: ReviewItemFacts,
  deciderUserId: string,
): boolean {
  if (!item.reviewerUserIds.includes(deciderUserId)) return false;
  if (deciderUserId === item.subjectUserId) return false;
  return (
    checkSodTransaction({
      ruleCode: 'SOD-GOV-02',
      actorsA: [item.grantedByUserId, ...(item.approvedByUserIds ?? [])],
      actorB: deciderUserId,
    }) === undefined
  );
}

/** Forma de lo que se puede ajustar de una concesión. */
export interface GrantAdjustmentShape {
  readonly atoms?: readonly string[];
  readonly validTo?: Date | null;
  readonly condition?: unknown;
}

/** Concesión tal como está hoy (para comparar con el ajuste). */
export interface CurrentGrantShape {
  readonly atoms: readonly string[];
  readonly validTo?: Date | null;
  readonly condition?: unknown;
}

/** Claves de condición que, al agregarse, AMPLÍAN lo que puede hacer la persona. */
const BROADENING_CONDITION_KEYS: readonly string[] = ['delegationCeiling'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function conditionTightens(current: unknown, adjusted: unknown): boolean {
  if (adjusted === null) return current === undefined || current === null;
  if (!isObject(adjusted)) return false;
  const base = isObject(current) ? current : {};
  for (const key of Object.keys(base)) {
    if (
      canonicalJson(adjusted[key] ?? null) !== canonicalJson(base[key] ?? null)
    )
      return false;
  }
  return BROADENING_CONDITION_KEYS.every(
    (k) =>
      canonicalJson(adjusted[k] ?? null) === canonicalJson(base[k] ?? null),
  );
}

/**
 * Un ajuste de campaña SOLO reduce: quita átomos, acorta la vigencia, agrega o
 * endurece condiciones. Es conservador: una condición existente debe
 * conservarse igual (agregar claves restringe; cambiar una clave existente se
 * trata como ampliar porque no se puede probar que reduzca). Un código que no
 * es átomo ni alias cuenta como ampliación.
 *
 * @returns `ok` y las partes que amplían (`ATOMS`, `VALID_TO`, `CONDITION`).
 */
export function adjustmentOnlyReduces(
  current: CurrentGrantShape,
  adjusted: GrantAdjustmentShape,
): {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<'ATOMS' | 'VALID_TO' | 'CONDITION'>;
} {
  const violations: Array<'ATOMS' | 'VALID_TO' | 'CONDITION'> = [];
  if (adjusted.atoms !== undefined) {
    const have = new Set(
      current.atoms.flatMap((a) => atomsOfAction(a).map((x) => x.atom)),
    );
    const widens = adjusted.atoms.some((code) => {
      const expanded = atomsOfAction(code);
      return expanded.length === 0 || expanded.some((x) => !have.has(x.atom));
    });
    if (widens) violations.push('ATOMS');
  }
  if (adjusted.validTo !== undefined && current.validTo) {
    if (
      adjusted.validTo === null ||
      adjusted.validTo.getTime() > current.validTo.getTime()
    ) {
      violations.push('VALID_TO');
    }
  }
  if (
    adjusted.condition !== undefined &&
    !conditionTightens(current.condition, adjusted.condition)
  ) {
    violations.push('CONDITION');
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Valida la decisión de UN ítem. Orden: quién decide (403) → campaña abierta y
 * ítem pendiente (409) → comentario (422) → ajuste (422).
 * El comentario de al menos 10 caracteres es obligatorio para revocar y ajustar,
 * y para certificar una concesión con átomo ALTA o CRÍTICA o sin uso en
 * `unusedDays`.
 */
export function validateReviewDecision(input: {
  readonly item: ReviewItemFacts;
  readonly decision: ReviewDecision;
  readonly deciderUserId: string;
  readonly comment?: string;
  readonly now: Date;
  readonly unusedDays?: number;
  readonly current?: CurrentGrantShape;
  readonly adjustment?: GrantAdjustmentShape;
}): ReviewDecisionCheck {
  const { item } = input;
  if (!canDecideReviewItem(item, input.deciderUserId))
    return fail('REVIEW_NOT_REVIEWER', 403);
  if (!item.campaignOpen) return fail('REVIEW_CAMPAIGN_NOT_OPEN', 409);
  if (item.state !== 'PENDING') return fail('REVIEW_ALREADY_DECIDED', 409);
  const longEnough =
    (input.comment ?? '').trim().length >= REVIEW_DEFAULTS.commentMinLength;
  if (input.decision === 'CERTIFY') {
    const top = maxSensitivityOf(item.atoms);
    const important =
      top !== null && sensitivityRank(top) >= sensitivityRank('HIGH');
    const unused = isGrantUnused({
      lastUsedAt: item.lastUsedAt,
      createdAt: item.createdAt,
      now: input.now,
      unusedDays: input.unusedDays,
    });
    if ((important || unused) && !longEnough)
      return fail('REVIEW_COMMENT_REQUIRED', 422);
    return { ok: true };
  }
  if (!longEnough) return fail('REVIEW_COMMENT_REQUIRED', 422);
  if (input.decision === 'REVOKE') return { ok: true };
  if (item.isEngagementItem || !input.adjustment || !input.current) {
    return fail('REVIEW_ADJUST_NOT_APPLICABLE', 422);
  }
  return adjustmentOnlyReduces(input.current, input.adjustment).ok
    ? { ok: true }
    : fail('REVIEW_ADJUST_CANNOT_BROADEN', 422);
}

/** Resultado de una decisión en lote. */
export type BulkDecisionCheck =
  | { readonly ok: true; readonly itemIds: readonly string[] }
  | {
      readonly ok: false;
      readonly code: ReviewDecisionErrorCode;
      readonly httpStatus: 403 | 409 | 422;
      /** Los ítems que impiden el lote. */
      readonly itemIds: readonly string[];
    };

/**
 * Decisión en lote, TODO O NADA: solo `CERTIFY`, de ítems de sensibilidad máxima
 * ≤ MEDIA y con uso reciente (fricción deliberada contra certificar a ciegas lo
 * importante). Si algún ítem no cumple, no se aplica ninguno y se devuelven los
 * que lo impiden. Precedencia: no ser revisor (403) → campaña cerrada o ítem ya
 * decidido (409) → no apto para lote (422).
 */
export function evaluateBulkDecision(input: {
  readonly decision: ReviewDecision;
  readonly items: readonly ReviewItemFacts[];
  readonly deciderUserId: string;
  readonly now: Date;
  readonly unusedDays?: number;
}): BulkDecisionCheck {
  const ids = (list: readonly ReviewItemFacts[]): string[] =>
    list.map((i) => i.itemId);
  const blocked = (
    code: ReviewDecisionErrorCode,
    status: 403 | 409 | 422,
    list: readonly ReviewItemFacts[],
  ): BulkDecisionCheck => ({
    ok: false,
    code,
    httpStatus: status,
    itemIds: ids(list),
  });
  if (input.decision !== 'CERTIFY' || input.items.length === 0) {
    return blocked(
      'REVIEW_BULK_NOT_ALLOWED',
      422,
      input.decision !== 'CERTIFY' ? input.items : [],
    );
  }
  const notReviewer = input.items.filter(
    (i) => !canDecideReviewItem(i, input.deciderUserId),
  );
  if (notReviewer.length > 0)
    return blocked('REVIEW_NOT_REVIEWER', 403, notReviewer);
  const closed = input.items.filter((i) => !i.campaignOpen);
  if (closed.length > 0)
    return blocked('REVIEW_CAMPAIGN_NOT_OPEN', 409, closed);
  const decided = input.items.filter((i) => i.state !== 'PENDING');
  if (decided.length > 0)
    return blocked('REVIEW_ALREADY_DECIDED', 409, decided);
  const unfit = input.items.filter((i) => {
    const top = maxSensitivityOf(i.atoms);
    const high =
      top !== null && sensitivityRank(top) > sensitivityRank('MEDIUM');
    const unused = isGrantUnused({
      lastUsedAt: i.lastUsedAt,
      createdAt: i.createdAt,
      now: input.now,
      unusedDays: input.unusedDays,
    });
    return high || unused;
  });
  if (unfit.length > 0) return blocked('REVIEW_BULK_NOT_ALLOWED', 422, unfit);
  return { ok: true, itemIds: ids(input.items) };
}
