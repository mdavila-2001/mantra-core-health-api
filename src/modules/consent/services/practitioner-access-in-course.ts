import { touch, type AuthenticatedUser } from '../../../common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { ClinicalAccessGrantsRepository } from '../../authz/repositories';
import { CONS } from '../consent.concepts';
import type { Consents } from '../entities';
import type { ConsentEventsRepository } from '../repositories';

/**
 * Finds the request that is still "in course" among the ones a practitioner
 * already made to a patient: a pending one, or an active one that still has an
 * active clinical access grant behind it.
 *
 * An active consent without any active grant (the patient revoked it from "who
 * sees my history") no longer gives access, so it stops counting. It is
 * withdrawn on the caller's transaction, which lets the practitioner ask again
 * instead of waiting for its validity to run out.
 *
 * @param tx - Caller's transaction; the withdrawal is flushed by the caller.
 * @param consents - Requests of the practitioner to this patient, any status.
 * @param deps - Repositories to read the grants and record the withdrawal.
 * @param actor - Practitioner who is asking again.
 * @returns The request in course, if any.
 */
export async function findRequestInCourse(
  tx: EntityManager,
  consents: readonly Consents[],
  deps: {
    grants: Pick<ClinicalAccessGrantsRepository, 'findActiveByConsent'>;
    events: Pick<ConsentEventsRepository, 'record'>;
  },
  actor: AuthenticatedUser,
): Promise<Consents | undefined> {
  for (const consent of consents) {
    if (consent.statusConceptId === CONS.ACCESS_REQUEST_PENDING) return consent;
    if (consent.statusConceptId !== CONS.CONSENT_ACTIVE) continue;
    const grants = await deps.grants.findActiveByConsent(tx, consent.id);
    if (grants.length > 0) return consent;

    const now = new Date();
    consent.statusConceptId = CONS.CONSENT_WITHDRAWN;
    consent.withdrawnAt = now;
    consent.validTo = now;
    touch(consent, actor.id, now);
    deps.events.record(tx, {
      subjectTypeConceptId: CONS.SUBJECT_CONSENT,
      subjectId: consent.id,
      eventTypeConceptId: CONS.EVENT_WITHDRAWN,
      previousStatusConceptId: CONS.CONSENT_ACTIVE,
      newStatusConceptId: CONS.CONSENT_WITHDRAWN,
      recordedByUserId: actor.id,
    });
  }
  return undefined;
}
