import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareRelationships } from '../entities';
import { ConsentProvisions, Consents } from '../../consent/entities';
import { CONS } from '../../consent/consent.concepts';
import { Persons, PersonAccountLinks } from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';

/** Cap per circuit: the inbox is a recent history, not an export. */
const INBOX_LIMIT = 200;

/**
 * Reads behind the unified access-request inbox. Read only: it joins the
 * circuits (care relationships and practitioner-access consents) that no single
 * module owns. Every query is bound to the active tenant.
 */
@Injectable()
export class AuthzAccessRequestsRepository {
  /** Every care relationship of a patient in the tenant, newest first. */
  careOfPatient(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<CareRelationships[]> {
    return em.find(
      CareRelationships,
      { patientProfileId, tenantId },
      { orderBy: { createdAt: 'DESC' }, limit: INBOX_LIMIT },
    );
  }

  /** Every care relationship of a practitioner in the tenant, newest first. */
  careOfPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
    tenantId: string,
  ): Promise<CareRelationships[]> {
    return em.find(
      CareRelationships,
      { practitionerProfileId, tenantId },
      { orderBy: { createdAt: 'DESC' }, limit: INBOX_LIMIT },
    );
  }

  /** Practitioner-access consents a patient received in the tenant. */
  accessConsentsOfPatient(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<Consents[]> {
    return em.find(
      Consents,
      {
        patientProfileId,
        tenantId,
        categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
      },
      { orderBy: { createdAt: 'DESC' }, limit: INBOX_LIMIT },
    );
  }

  /** Practitioner-access consents a user asked for in the tenant. */
  accessConsentsCreatedBy(
    em: EntityManager,
    createdByUserId: string,
    tenantId: string,
  ): Promise<Consents[]> {
    return em.find(
      Consents,
      {
        createdByUserId,
        tenantId,
        categoryConceptId: CONS.CATEGORY_PRACTITIONER_ACCESS,
      },
      { orderBy: { createdAt: 'DESC' }, limit: INBOX_LIMIT },
    );
  }

  /** Open provisions (the specialties asked for) of the given consents. */
  provisionsOf(
    em: EntityManager,
    consentIds: readonly string[],
  ): Promise<ConsentProvisions[]> {
    if (consentIds.length === 0) return Promise.resolve([]);
    return em.find(ConsentProvisions, {
      consentId: { $in: [...consentIds] },
      validTo: null,
    });
  }

  /** Display name of each person that has one. */
  async namesByPersonId(
    em: EntityManager,
    personIds: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(personIds)];
    if (unique.length === 0) return new Map();
    const rows = await em.find(Persons, { id: { $in: unique } });
    return new Map(
      rows.flatMap((row) => {
        const name =
          row.displayName ?? [row.name, row.lastName].filter(Boolean).join(' ');
        return name ? [[row.id, name] as const] : [];
      }),
    );
  }

  /** Person linked to each account (active links only). */
  async personIdByUserId(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return new Map();
    const links = await em.find(PersonAccountLinks, {
      userId: { $in: unique },
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return new Map(links.map((link) => [link.userId, link.personId]));
  }
}
