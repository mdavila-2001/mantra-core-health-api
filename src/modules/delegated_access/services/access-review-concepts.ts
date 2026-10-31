import type {
  ReviewItemState,
  ReviewKind,
  ReviewerKind,
  UncertifiedAction,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';

/** Código de tipo de campaña → concepto. */
export const REVIEW_KIND_CONCEPT: Readonly<Record<ReviewKind, string>> = {
  PERIODIC: DELEG.REVIEW_KIND_PERIODIC,
  RECERTIFICATION: DELEG.REVIEW_KIND_RECERTIFICATION,
  MOVER: DELEG.REVIEW_KIND_MOVER,
  TARGETED: DELEG.REVIEW_KIND_TARGETED,
  REMEDIATION: DELEG.REVIEW_KIND_REMEDIATION,
};

/** Concepto de tipo de campaña → código. */
export const REVIEW_KIND_BY_CONCEPT: Readonly<Record<string, ReviewKind>> =
  Object.fromEntries(
    Object.entries(REVIEW_KIND_CONCEPT).map(([code, id]) => [
      id,
      code as ReviewKind,
    ]),
  );

/** Estado de la campaña (concepto → código). */
export const CAMPAIGN_STATUS_BY_CONCEPT: Readonly<
  Record<string, 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED'>
> = {
  [DELEG.REVIEW_CAMPAIGN_DRAFT]: 'DRAFT',
  [DELEG.REVIEW_CAMPAIGN_OPEN]: 'OPEN',
  [DELEG.REVIEW_CAMPAIGN_CLOSED]: 'CLOSED',
  [DELEG.REVIEW_CAMPAIGN_CANCELLED]: 'CANCELLED',
};

/** Estado del ítem (código → concepto). */
export const ITEM_STATE_CONCEPT: Readonly<Record<ReviewItemState, string>> = {
  PENDING: DELEG.REVIEW_ITEM_PENDING,
  CERTIFIED: DELEG.REVIEW_ITEM_CERTIFIED,
  REVOKED: DELEG.REVIEW_ITEM_REVOKED,
  ADJUSTED: DELEG.REVIEW_ITEM_ADJUSTED,
  AUTO_REVOKED: DELEG.REVIEW_ITEM_AUTO_REVOKED,
  SKIPPED: DELEG.REVIEW_ITEM_SKIPPED,
};

/** Estado del ítem (concepto → código). */
export const ITEM_STATE_BY_CONCEPT: Readonly<Record<string, ReviewItemState>> =
  Object.fromEntries(
    Object.entries(ITEM_STATE_CONCEPT).map(([code, id]) => [
      id,
      code as ReviewItemState,
    ]),
  );

/** Tipo de revisor (código → concepto). */
export const REVIEWER_KIND_CONCEPT: Readonly<Record<ReviewerKind, string>> = {
  DOCTOR_OWNER: DELEG.REVIEWER_KIND_DOCTOR_OWNER,
  SERVICE_HEAD: DELEG.REVIEWER_KIND_SERVICE_HEAD,
  SUPERVISOR: DELEG.REVIEWER_KIND_SUPERVISOR,
  ADMIN: DELEG.REVIEWER_KIND_ADMIN,
};

/** Tipo de revisor (concepto → código). */
export const REVIEWER_KIND_BY_CONCEPT: Readonly<Record<string, ReviewerKind>> =
  Object.fromEntries(
    Object.entries(REVIEWER_KIND_CONCEPT).map(([code, id]) => [
      id,
      code as ReviewerKind,
    ]),
  );

/** Acción para lo no certificado (código → concepto). */
export const UNCERTIFIED_CONCEPT: Readonly<Record<UncertifiedAction, string>> =
  {
    UNCERTIFIED_REVOKE: DELEG.UNCERTIFIED_REVOKE,
    UNCERTIFIED_ESCALATE: DELEG.UNCERTIFIED_ESCALATE,
  };

/** Acción para lo no certificado (concepto → código); lo desconocido solo escala (nunca revoca a ciegas). */
export function uncertifiedActionOf(conceptId: string): UncertifiedAction {
  return conceptId === DELEG.UNCERTIFIED_REVOKE
    ? 'UNCERTIFIED_REVOKE'
    : 'UNCERTIFIED_ESCALATE';
}
