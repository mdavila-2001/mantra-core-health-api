import type { FilterQuery } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import {
  isRlsEnforced,
  readWithSystemRls,
  withTenantRls,
} from '../../../common/tenant/rls-transaction';
import { PublicProfiles } from '../entities';
import { ORGANIZATION_PROFILE_TARGET_TYPES } from '../services/community-organization-staff.service';

/** The subjects a profile can be held under, as `CommunityVisibilityService` reads them. */
const subjectsOf = (user: AuthenticatedUser): string[] =>
  user.practitionerProfileId
    ? [user.practitionerProfileId, user.id]
    : [user.id];

/**
 * Runs `work` (a profile-ownership check) with the RLS context its reads need.
 *
 * A socket handshake carries no tenant and never passes the HTTP tenant
 * interceptor, so the profile and membership reads of the messaging gateway
 * would see nothing under RLS. The profile is first probed in a read-only
 * system transaction with the actor's own predicate inside the query (it is
 * held by one of his subjects, created by him, or is the showcase of a tenant
 * of his token); an id the actor has no claim on is never opened.
 *
 * Then:
 * - the showcase of an organization in his token: `work` runs under that tenant,
 *   which is where its membership lives (revalidated on every call);
 * - a personal profile: `work` runs read-only in system context, but only for
 *   the one row the probe already matched;
 * - anything else (global platform roles, no claim): `work` runs on a plain
 *   fork, exactly as before, so nothing is widened.
 *
 * @param em - Entity manager to fork from.
 * @param user - Authenticated socket user.
 * @param profileId - Profile the client declared.
 * @param work - Ownership check, given the manager to read with.
 */
export async function withMessagingProfileScope<T>(
  em: EntityManager,
  user: AuthenticatedUser,
  profileId: string,
  work: (scoped: EntityManager) => Promise<T>,
): Promise<T> {
  // Without RLS there is nothing to scope: the check reads as it always did.
  if (!isRlsEnforced()) return work(em.fork());
  const tenantIds = user.tenantIds ?? [];
  const claims: FilterQuery<PublicProfiles>[] = [
    { targetId: { $in: subjectsOf(user) } },
    { createdByUserId: user.id },
  ];
  if (tenantIds.length > 0) claims.push({ targetId: { $in: tenantIds } });
  const claim = await readWithSystemRls(em, (tx) =>
    tx.findOne(PublicProfiles, { id: profileId, $or: claims }),
  );
  if (!claim) return work(em.fork({ keepTransactionContext: false }));
  const organization = ORGANIZATION_PROFILE_TARGET_TYPES.includes(
    claim.targetTypeConceptId,
  );
  if (organization) {
    return tenantIds.includes(claim.targetId)
      ? withTenantRls(em, claim.targetId, work, { readOnly: true })
      : work(em.fork({ keepTransactionContext: false }));
  }
  return readWithSystemRls(em, work);
}
