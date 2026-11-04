import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import type { Consents } from '../../consent/entities';
import type { AccessRequestCounterpartDto, AccessRequestItemDto } from '../dto';
import type { CareRelationships } from '../entities';
import { AuthzAccessRequestsRepository } from '../repositories';
import { AUTHZ } from '../authz.concepts';
import { AuthzClinicalScopeService } from './authz-clinical-scope.service';
import {
  careItem,
  careKind,
  careStatus,
  consentItem,
  consentStatus,
} from './authz-access-requests.mapper';

/**
 * Unified inbox of access requests, one read per role. It joins the care
 * relationships (circuit B) and the practitioner-access consents (circuit A)
 * under a single shape, so the screen does not need to know which table a row
 * comes from.
 *
 * The subject always comes from the session. Reads run on a fork that keeps the
 * request transaction, so the active tenant applies to them; the inbox shows
 * only that tenant.
 */
@Injectable()
export class AuthzAccessRequestsReadService {
  /**
   * @param em - Persistence context.
   * @param scope - Active-tenant policy.
   * @param repo - Reads of both circuits.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: AuthzClinicalScopeService,
    private readonly repo: AuthzAccessRequestsRepository,
  ) {}

  /**
   * Requests the patient received (care relations a professional started and
   * every granular request) and sent (their own primary-care requests).
   *
   * @param actor - The patient. Without a patient profile the list is empty.
   */
  async listForPatient(
    actor: AuthenticatedUser,
  ): Promise<AccessRequestItemDto[]> {
    if (!actor.patientProfileId) return [];
    const tenantId = this.scope.resolveTenant();
    const em = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const [relations, consents] = await Promise.all([
      this.repo.careOfPatient(em, actor.patientProfileId, tenantId),
      this.repo.accessConsentsOfPatient(em, actor.patientProfileId, tenantId),
    ]);
    const visible = relations.filter(isAccessRequest);

    const doctorByUser = await this.repo.personIdByUserId(
      em,
      consents.map((c) => c.createdByUserId ?? ''),
    );
    const names = await this.repo.namesByPersonId(em, [
      ...visible.map((r) => r.practitionerProfileId),
      ...doctorByUser.values(),
    ]);
    const specialties = await this.specialtiesOf(em, consents);

    const items: AccessRequestItemDto[] = [];
    for (const rel of visible) {
      const status = careStatus(rel, now);
      if (!status) continue;
      const own = rel.establishedByUserId === actor.id;
      items.push(
        careItem(
          rel,
          status,
          own ? 'SENT' : 'RECEIVED',
          counterpart(rel.practitionerProfileId, names),
        ),
      );
    }
    for (const consent of consents) {
      const status = consentStatus(consent, now);
      if (!status) continue;
      const doctorId = doctorByUser.get(consent.createdByUserId ?? '');
      items.push(
        consentItem(
          consent,
          status,
          'RECEIVED',
          counterpart(doctorId, names),
          specialties.get(consent.id) ?? { requested: [], authorized: [] },
        ),
      );
    }
    return newestFirst(items);
  }

  /**
   * Requests the practitioner received (primary-care requests a patient made)
   * and sent (their own relation requests and granular requests).
   *
   * @param actor - The practitioner. Without a practitioner profile the list is empty.
   */
  async listForPractitioner(
    actor: AuthenticatedUser,
  ): Promise<AccessRequestItemDto[]> {
    if (!actor.practitionerProfileId) return [];
    const tenantId = this.scope.resolveTenant();
    const em = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const [relations, consents] = await Promise.all([
      this.repo.careOfPractitioner(em, actor.practitionerProfileId, tenantId),
      this.repo.accessConsentsCreatedBy(em, actor.id, tenantId),
    ]);
    const mine = relations.filter(
      (rel) => rel.establishedByUserId === actor.id,
    );
    const fromPatients = relations.filter(
      (rel) =>
        rel.establishedByUserId !== actor.id && careKind(rel) === 'CABECERA',
    );

    const names = await this.repo.namesByPersonId(em, [
      ...relations.map((r) => r.patientProfileId),
      ...consents.map((c) => c.patientProfileId),
    ]);
    const specialties = await this.specialtiesOf(em, consents);

    const items: AccessRequestItemDto[] = [];
    const rows = [
      ...fromPatients.map((rel) => ({ rel, direction: 'RECEIVED' as const })),
      ...mine.map((rel) => ({ rel, direction: 'SENT' as const })),
    ];
    for (const { rel, direction } of rows) {
      const status = careStatus(rel, now);
      if (!status) continue;
      items.push(
        careItem(
          rel,
          status,
          direction,
          counterpart(rel.patientProfileId, names),
        ),
      );
    }
    for (const consent of consents) {
      const status = consentStatus(consent, now);
      if (!status) continue;
      items.push(
        consentItem(
          consent,
          status,
          'SENT',
          counterpart(consent.patientProfileId, names),
          specialties.get(consent.id) ?? { requested: [], authorized: [] },
        ),
      );
    }
    return newestFirst(items);
  }

  /** Specialties asked for and authorized, per consent. */
  private async specialtiesOf(
    em: EntityManager,
    consents: readonly Consents[],
  ): Promise<Map<string, { requested: string[]; authorized: string[] }>> {
    const provisions = await this.repo.provisionsOf(
      em,
      consents.map((c) => c.id),
    );
    const byConsent = new Map<
      string,
      { requested: string[]; authorized: string[] }
    >();
    for (const provision of provisions) {
      if (!provision.dataClassConceptId) continue;
      const entry = byConsent.get(provision.consentId) ?? {
        requested: [],
        authorized: [],
      };
      entry.requested.push(provision.dataClassConceptId);
      if (provision.actionConceptId === CONS.ACTION_PERMIT) {
        entry.authorized.push(provision.dataClassConceptId);
      }
      byConsent.set(provision.consentId, entry);
    }
    return byConsent;
  }
}

/**
 * Care relations that are an access request or an access it produced. Those
 * scoped to a purpose other than treatment (the billing one a check-in leaves)
 * do not open the history and are not shown as access.
 */
function isAccessRequest(rel: CareRelationships): boolean {
  return (
    !rel.purposeConceptId || rel.purposeConceptId === AUTHZ.PURPOSE_TREATMENT
  );
}

/** The other party; `profileId` is absent when no person could be resolved. */
function counterpart(
  profileId: string | undefined,
  names: Map<string, string>,
): AccessRequestCounterpartDto {
  return {
    ...(profileId ? { profileId } : {}),
    ...(profileId && names.has(profileId)
      ? { displayName: names.get(profileId) }
      : {}),
  };
}

/** Newest request first. */
function newestFirst(items: AccessRequestItemDto[]): AccessRequestItemDto[] {
  return items.sort(
    (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime(),
  );
}
