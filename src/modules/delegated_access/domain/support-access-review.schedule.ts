import {
  DAY_MS,
  REVIEW_DEFAULTS,
  maxSensitivityOf,
  sensitivityRank,
  type ReviewItemState,
  type UncertifiedAction,
} from './support-access-review.shared';
import type { ReviewKind } from './support-reviewer-resolver';
import { zonedParts } from './support-time';

/**
 * Tiempos de una campaña (§6.2): recordatorios, escalamiento, cierre con
 * auto-revocación (D-09), recertificación mensual y cadencia (D-08). Todo es
 * función del reloj que se le pasa: un barrido repetido da el mismo resultado.
 */

/**
 * ¿Toca un recordatorio? Se envían en `due − 7/−3/−1` días y a diario desde el
 * vencimiento. Toca si el último punto alcanzado todavía no se avisó
 * (`lastRemindedAt` es anterior a él). Los puntos previos al lanzamiento no se
 * reenvían de golpe.
 */
export function reminderDue(input: {
  readonly dueAt: Date;
  readonly now: Date;
  readonly lastRemindedAt?: Date | null;
  readonly reminderDaysBefore?: readonly number[];
  readonly launchedAt?: Date | null;
}): {
  readonly due: boolean;
  readonly pointAt?: Date;
  readonly overdue: boolean;
} {
  const due = input.dueAt.getTime();
  const now = input.now.getTime();
  const points = (
    input.reminderDaysBefore ?? REVIEW_DEFAULTS.reminderDaysBefore
  ).map((d) => due - d * DAY_MS);
  if (now >= due) points.push(due + Math.floor((now - due) / DAY_MS) * DAY_MS);
  const launched = input.launchedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const reached = points.filter((p) => p <= now && p >= launched);
  const overdue = now >= due;
  if (reached.length === 0) return { due: false, overdue };
  const latest = Math.max(...reached);
  const last = input.lastRemindedAt?.getTime();
  if (last !== undefined && last >= latest) return { due: false, overdue };
  return { due: true, pointAt: new Date(latest), overdue };
}

/** ¿Toca escalar el ítem? A los `escalate_after_days` (3) del vencimiento, una sola vez. */
export function escalationDue(input: {
  readonly dueAt: Date;
  readonly now: Date;
  readonly escalateAfterDays?: number;
  readonly escalatedAt?: Date | null;
}): boolean {
  if (input.escalatedAt) return false;
  const days = input.escalateAfterDays ?? REVIEW_DEFAULTS.escalateAfterDays;
  return input.now.getTime() >= input.dueAt.getTime() + days * DAY_MS;
}

/** Cuándo cierra sola una campaña: vencimiento + días de gracia. */
export function campaignCloseAt(dueAt: Date, graceDays: number): Date {
  return new Date(dueAt.getTime() + graceDays * DAY_MS);
}

/** Un ítem pendiente visto desde el cierre. */
export interface ClosureItem {
  readonly itemId: string;
  readonly state: ReviewItemState;
  /** Ítem de vínculo (recertificación). */
  readonly isEngagementItem: boolean;
  readonly engagementState: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
  /** La concesión ya está revocada o vencida. */
  readonly grantRevoked?: boolean;
  readonly subjectUserId: string;
  readonly supervisorUserId?: string | null;
  /** Doctores de la concesión (se les avisa). */
  readonly doctorUserIds?: readonly string[];
}

/** Qué se hace con un ítem al cerrar. */
export interface ClosureAction {
  readonly itemId: string;
  readonly to: 'AUTO_REVOKED' | 'SKIPPED';
  /** `ended_reason` de la concesión revocada. */
  readonly endedReason?: string;
  /** Por qué se omite. */
  readonly reason?:
    'ENGAGEMENT_NOT_ACTIVE' | 'GRANT_ALREADY_REVOKED' | 'RECERTIFICATION_SWEEP';
  /** A quién avisar (la persona, su dueño y el doctor). */
  readonly notifyUserIds: readonly string[];
}

/** Plan de cierre de una campaña. */
export interface ClosurePlan {
  readonly closes: boolean;
  readonly reason?: 'NOT_OPEN' | 'NOT_DUE' | 'MANUAL_CLOSE_ONLY';
  readonly actions: readonly ClosureAction[];
}

/**
 * Cierre de campaña. Cierra sola a `due + gracia` si su acción es
 * `UNCERTIFIED_REVOKE`; con `UNCERTIFIED_ESCALATE` solo se cierra a mano y no
 * cambia nada. A cada ítem pendiente: `AUTO_REVOKED` (la concesión se revoca; el
 * vínculo no) con `ended_reason` «No certificada en la campaña X» y aviso a la
 * persona, su dueño y el doctor; se omiten (`SKIPPED`) los de vínculos
 * terminados o suspendidos, las concesiones ya revocadas y los ítems de vínculo
 * (los suspende el barrido de recertificación, que no cambia).
 */
export function planCampaignClosure(input: {
  readonly campaign: {
    readonly name: string;
    readonly kind: ReviewKind;
    readonly status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
    readonly dueAt: Date;
    readonly graceDays: number;
    readonly uncertifiedAction: UncertifiedAction;
  };
  readonly items: readonly ClosureItem[];
  readonly now: Date;
  /** Cierre pedido a mano (`POST …/close`). */
  readonly manual?: boolean;
}): ClosurePlan {
  const { campaign } = input;
  if (campaign.status !== 'OPEN')
    return { closes: false, reason: 'NOT_OPEN', actions: [] };
  if (!input.manual) {
    if (campaign.uncertifiedAction === 'UNCERTIFIED_ESCALATE') {
      return { closes: false, reason: 'MANUAL_CLOSE_ONLY', actions: [] };
    }
    if (
      input.now.getTime() <
      campaignCloseAt(campaign.dueAt, campaign.graceDays).getTime()
    ) {
      return { closes: false, reason: 'NOT_DUE', actions: [] };
    }
  }
  if (campaign.uncertifiedAction === 'UNCERTIFIED_ESCALATE')
    return { closes: true, actions: [] };
  const actions = input.items
    .filter((i) => i.state === 'PENDING')
    .map<ClosureAction>((i) => {
      if (i.engagementState !== 'ACTIVE') {
        return {
          itemId: i.itemId,
          to: 'SKIPPED',
          reason: 'ENGAGEMENT_NOT_ACTIVE',
          notifyUserIds: [],
        };
      }
      if (i.grantRevoked) {
        return {
          itemId: i.itemId,
          to: 'SKIPPED',
          reason: 'GRANT_ALREADY_REVOKED',
          notifyUserIds: [],
        };
      }
      if (i.isEngagementItem) {
        return {
          itemId: i.itemId,
          to: 'SKIPPED',
          reason: 'RECERTIFICATION_SWEEP',
          notifyUserIds: [],
        };
      }
      return {
        itemId: i.itemId,
        to: 'AUTO_REVOKED',
        endedReason: `No certificada en la campaña ${campaign.name}`,
        notifyUserIds: [
          ...new Set(
            [
              i.subjectUserId,
              i.supervisorUserId,
              ...(i.doctorUserIds ?? []),
            ].filter((u): u is string => !!u),
          ),
        ].sort(),
      };
    })
    .sort((a, b) => a.itemId.localeCompare(b.itemId));
  return { closes: true, actions };
}

/** Un vínculo candidato a la recertificación mensual. */
export interface RecertificationCandidate {
  readonly engagementId: string;
  readonly state: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
  readonly nextRecertificationAt?: Date | null;
  /** Ya tiene un ítem abierto. */
  readonly hasOpenItem: boolean;
}

/** Campaña mensual «Recertificación AAAA-MM» con sus ítems de vínculo. */
export interface RecertificationCampaignPlan {
  readonly name: string;
  /** `AAAA-MM` del mes del vencimiento, en la zona de la organización. */
  readonly month: string;
  readonly kind: 'RECERTIFICATION';
  /** Vence cuando vence su último ítem. */
  readonly campaignDueAt: Date;
  readonly items: ReadonlyArray<{
    readonly engagementId: string;
    readonly dueAt: Date;
  }>;
}

function monthKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  const year = p?.year ?? date.getUTCFullYear();
  const month = p?.month ?? date.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Ítems de recertificación que abre el barrido (K-04): todo vínculo ACTIVO con
 * `next_recertification_at ≤ hoy + 30 días` (incluidos los ya vencidos) y sin
 * ítem abierto, agrupado por el mes de su vencimiento. El ítem vence en
 * `next_recertification_at`.
 */
export function planRecertificationItems(input: {
  readonly engagements: readonly RecertificationCandidate[];
  readonly now: Date;
  readonly timeZone: string;
  readonly horizonDays?: number;
}): RecertificationCampaignPlan[] {
  const limit =
    input.now.getTime() +
    (input.horizonDays ?? REVIEW_DEFAULTS.recertificationHorizonDays) * DAY_MS;
  const groups = new Map<
    string,
    Array<{ engagementId: string; dueAt: Date }>
  >();
  for (const e of input.engagements) {
    if (e.state !== 'ACTIVE' || e.hasOpenItem || !e.nextRecertificationAt)
      continue;
    if (e.nextRecertificationAt.getTime() > limit) continue;
    const key = monthKey(e.nextRecertificationAt, input.timeZone);
    const list = groups.get(key) ?? [];
    list.push({ engagementId: e.engagementId, dueAt: e.nextRecertificationAt });
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, list]) => {
      const items = list.sort(
        (a, b) =>
          a.dueAt.getTime() - b.dueAt.getTime() ||
          a.engagementId.localeCompare(b.engagementId),
      );
      return {
        name: `Recertificación ${month}`,
        month,
        kind: 'RECERTIFICATION' as const,
        campaignDueAt: new Date(
          Math.max(...items.map((i) => i.dueAt.getTime())),
        ),
        items,
      };
    });
}

/** Cadencia de certificación (D-08): 6 meses con algún átomo ALTA o CRÍTICA, 12 para el resto. */
export function reviewCadenceMonthsFor(atoms: Iterable<string>): number {
  const top = maxSensitivityOf(atoms);
  return top !== null && sensitivityRank(top) >= sensitivityRank('HIGH')
    ? REVIEW_DEFAULTS.highRiskCadenceMonths
    : REVIEW_DEFAULTS.lowRiskCadenceMonths;
}

/** Suma meses de calendario (UTC); un fin de mes cae en el último día del mes de llegada. */
export function nextPeriodicReviewDue(from: Date, months: number): Date {
  const total = from.getUTCMonth() + months;
  const year = from.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(from.getUTCDate(), lastDay),
      from.getUTCHours(),
      from.getUTCMinutes(),
      from.getUTCSeconds(),
      from.getUTCMilliseconds(),
    ),
  );
}
