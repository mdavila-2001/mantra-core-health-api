import { CONCEPTS } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import type { Consents } from '../../consent/entities';
import { AUTHZ } from '../authz.concepts';
import type {
  AccessRequestCounterpartDto,
  AccessRequestDirection,
  AccessRequestItemDto,
  AccessRequestKind,
  AccessRequestStatus,
} from '../dto';
import type { CareRelationships } from '../entities';

/** An active row whose validity already ended reads as expired. */
function activeOrExpired(
  validTo: Date | null | undefined,
  now: Date,
): AccessRequestStatus {
  // `valid_to` comes back as `null` when there is no end: it is not "already expired".
  return validTo != null && validTo <= now ? 'EXPIRED' : 'ACTIVE';
}

/**
 * Status of a care relationship (circuit B), or `undefined` for a concept the
 * inbox does not know (the row is left out instead of guessing a status).
 */
export function careStatus(
  rel: Pick<CareRelationships, 'statusConceptId' | 'validTo'>,
  now: Date,
): AccessRequestStatus | undefined {
  switch (rel.statusConceptId) {
    case CONCEPTS.STATE_PENDING:
      return 'PENDING';
    case CONCEPTS.STATE_ACTIVE:
      return activeOrExpired(rel.validTo, now);
    case AUTHZ.CARE_REL_STATUS_DECLINED:
      return 'REJECTED';
    case CONCEPTS.STATE_REVOKED:
      return 'REVOKED';
    case CONCEPTS.STATE_EXPIRED:
      return 'EXPIRED';
    default:
      return undefined;
  }
}

/** Status of a practitioner-access consent (circuit A); `undefined` if unknown. */
export function consentStatus(
  consent: Pick<Consents, 'statusConceptId' | 'validTo'>,
  now: Date,
): AccessRequestStatus | undefined {
  switch (consent.statusConceptId) {
    case CONS.ACCESS_REQUEST_PENDING:
      return 'PENDING';
    case CONS.CONSENT_ACTIVE:
      return activeOrExpired(consent.validTo, now);
    case CONS.ACCESS_REQUEST_DECLINED:
      return 'REJECTED';
    case CONS.CONSENT_WITHDRAWN:
      return 'REVOKED';
    case CONS.CONSENT_EXPIRED:
      return 'EXPIRED';
    default:
      return undefined;
  }
}

/** Primary care is the cabecera; every other relation is care of a visit. */
export function careKind(
  rel: Pick<CareRelationships, 'relationshipTypeConceptId'>,
): AccessRequestKind {
  return rel.relationshipTypeConceptId === AUTHZ.CARE_REL_PRIMARY
    ? 'CABECERA'
    : 'ATENCION';
}

/**
 * When the other side answered: the start of validity once accepted (kept after
 * a revocation) and the end of validity when rejected. Nothing while pending.
 */
function decidedAt(
  status: AccessRequestStatus,
  validFrom: Date | null | undefined,
  validTo: Date | null | undefined,
): Date | null {
  if (status === 'PENDING') return null;
  return (status === 'REJECTED' ? validTo : validFrom) ?? null;
}

/** An inbox entry for a care relationship. */
export function careItem(
  rel: CareRelationships,
  status: AccessRequestStatus,
  direction: AccessRequestDirection,
  counterpart: AccessRequestCounterpartDto,
): AccessRequestItemDto {
  return {
    id: rel.id,
    kind: careKind(rel),
    direction,
    counterpart,
    requestedAt: rel.createdAt,
    decidedAt: decidedAt(status, rel.validFrom, rel.validTo),
    status,
    // Circuit B does not model specialties: they only travel in the outbox.
    requestedSpecialtyConceptIds: [],
    authorizedSpecialtyConceptIds: [],
  };
}

/** An inbox entry for a practitioner-access consent (always granular). */
export function consentItem(
  consent: Consents,
  status: AccessRequestStatus,
  direction: AccessRequestDirection,
  counterpart: AccessRequestCounterpartDto,
  specialties: { requested: string[]; authorized: string[] },
): AccessRequestItemDto {
  return {
    id: consent.id,
    kind: 'GRANULAR',
    direction,
    counterpart,
    requestedAt: consent.createdAt,
    decidedAt: decidedAt(status, consent.validFrom, consent.validTo),
    status,
    requestedSpecialtyConceptIds: specialties.requested,
    authorizedSpecialtyConceptIds: specialties.authorized,
  };
}
