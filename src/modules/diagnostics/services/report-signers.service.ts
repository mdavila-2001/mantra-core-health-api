import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { nationalLicenseOf } from '../../clinical/services/prescriber-identity.reader';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import {
  HealthPractitionerProfiles,
  JurisdictionAuthorizations,
  PersonAccountLinks,
  Persons,
} from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';
import type { ReportSignerDto } from '../dto/report-signers.dto';
import { personDisplayName } from '../repositories/lab-reception.repository';

/** A signer with the image file ids the PDF needs (never sent to clients). */
export interface ReportSignerIdentity extends ReportSignerDto {
  readonly signatureFileId: string | null;
  readonly sealFileId: string | null;
}

/**
 * Who may sign the reports of the active tenant (A1): the active members of
 * the tenant whose account is linked (`profiles.person_account_links`,
 * ACTIVE) to a person with a `health_practitioner_profiles` row — the profile
 * id IS the person id — plus the actor when the token carries `hpid`.
 */
@Injectable()
export class ReportSignersService {
  async list(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<ReportSignerIdentity[]> {
    const members = await em.find(TenantMemberships, {
      tenantId,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });
    const userIds = [...new Set(members.map((m) => m.userId))];
    const links = userIds.length
      ? await em.find(PersonAccountLinks, {
          userId: { $in: userIds },
          statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        })
      : [];
    const personIds = new Set(links.map((link) => link.personId));
    if (actor.practitionerProfileId) personIds.add(actor.practitionerProfileId);
    const identities = await this.identities(em, [...personIds]);
    return identities.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /**
   * The signer, only when it is in {@link list} for this tenant and actor.
   *
   * @throws PreconditionFailedException (422) otherwise.
   */
  async assertSigner(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    profileId: string,
  ): Promise<ReportSignerIdentity> {
    const signer = (await this.list(em, tenantId, actor)).find(
      (s) => s.profileId === profileId,
    );
    if (!signer) {
      throw new PreconditionFailedException(
        'El firmante elegido no está entre los profesionales de la organización',
      );
    }
    return signer;
  }

  /** Name, registration and signature/seal of the given practitioner profiles. */
  async identities(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<ReportSignerIdentity[]> {
    if (profileIds.length === 0) return [];
    const ids = [...new Set(profileIds)];
    const [profiles, persons, authorizations] = await Promise.all([
      em.find(HealthPractitionerProfiles, { profileId: { $in: ids } }),
      em.find(Persons, { id: { $in: ids } }),
      em.find(JurisdictionAuthorizations, {
        practitionerProfileId: { $in: ids },
      }),
    ]);
    const personById = new Map(persons.map((p) => [p.id, p]));
    return profiles.map((profile) => {
      const person = personById.get(profile.profileId);
      const license = nationalLicenseOf(
        authorizations.filter(
          (a) => a.practitionerProfileId === profile.profileId,
        ),
      );
      return {
        profileId: profile.profileId,
        name: (person ? personDisplayName(person) : null) ?? 'Profesional',
        registration: license?.number ?? null,
        hasSignature: Boolean(profile.signatureFileId),
        hasSeal: Boolean(profile.sealFileId),
        signatureFileId: profile.signatureFileId ?? null,
        sealFileId: profile.sealFileId ?? null,
      };
    });
  }
}
