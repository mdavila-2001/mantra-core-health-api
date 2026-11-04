import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  CareRelationshipsRepository,
  ClinicalAccessGrantsRepository,
} from '../../authz/repositories';
import { CONS } from '../../consent/consent.concepts';
import {
  ConsentProvisionsRepository,
  ConsentsRepository,
} from '../../consent/repositories';
import { PatientRepresentationService } from '../../profiles/application/services/patient-representation.service';
import {
  FULL_READ_SCOPE,
  specialtiesScope,
  type ClinicalReadScope,
} from '../domain/clinical-read-scope';

const WRITE_LEVELS: readonly string[] = [
  AUTHZ.ACCESS_LEVEL_WRITE,
  AUTHZ.ACCESS_LEVEL_FULL,
  AUTHZ.ACCESS_LEVEL_ELEVATED,
];

/**
 * Narrows a read that the PDP already permitted to the specialties the patient
 * authorised, when (and only when) the practitioner's access rests entirely on
 * granular practitioner-access consents.
 *
 * Any other base that also opens the record (manual grant without consent,
 * grant of another purpose or consent category, a care relationship of any
 * kind, a legal representation) keeps the full record, as before: this service
 * never decides access, it only narrows it.
 */
@Injectable()
export class ClinicalGranularScopeService {
  constructor(
    private readonly grantsRepo: ClinicalAccessGrantsRepository,
    private readonly consentsRepo: ConsentsRepository,
    private readonly provisionsRepo: ConsentProvisionsRepository,
    private readonly careRelationshipsRepo: CareRelationshipsRepository,
    private readonly representation: PatientRepresentationService,
  ) {}

  /**
   * @param em - Persistence context of the read.
   * @param patientProfileId - Patient whose history is read.
   * @param actor - Practitioner already permitted by the PDP.
   * @returns `SPECIALTIES` when every open base is a granular consent;
   *          `FULL` otherwise.
   */
  async resolve(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<ClinicalReadScope> {
    const now = Date.now();
    const grants = (
      await this.grantsRepo.findActiveForUserPatient(
        em,
        actor.id,
        patientProfileId,
      )
    ).filter(
      (grant) =>
        grant.validFrom.getTime() <= now && grant.validTo.getTime() > now,
    );
    if (grants.length === 0) return FULL_READ_SCOPE;

    const authorized = new Set<string>();
    for (const grant of grants) {
      const permitted =
        grant.reasonConceptId === AUTHZ.PURPOSE_TREATMENT && grant.consentId
          ? await this.permittedBy(em, grant.consentId, now)
          : null;
      if (permitted === null) return FULL_READ_SCOPE;
      permitted.forEach((id) => authorized.add(id));
    }

    if (await this.hasOtherBasis(em, patientProfileId, actor)) {
      return FULL_READ_SCOPE;
    }
    return specialtiesScope(authorized);
  }

  /**
   * Does the actor hold a current grant of write level or above on this
   * patient? Separates a real write grant from a PDP permit that only a care
   * relation explains (which must not open writing by itself).
   */
  async hasWriteLevelGrant(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const now = Date.now();
    const grants = await this.grantsRepo.findActiveForUserPatient(
      em,
      actor.id,
      patientProfileId,
    );
    return grants.some(
      (grant) =>
        WRITE_LEVELS.includes(grant.accessLevelConceptId) &&
        grant.validFrom.getTime() <= now &&
        grant.validTo.getTime() > now,
    );
  }

  /**
   * Specialties a practitioner-access consent permits, or `null` when the
   * consent is not a granular one (so its grant keeps meaning full access).
   */
  private async permittedBy(
    em: EntityManager,
    consentId: string,
    now: number,
  ): Promise<string[] | null> {
    const consent = await this.consentsRepo.findById(em, consentId);
    if (consent?.categoryConceptId !== CONS.CATEGORY_PRACTITIONER_ACCESS) {
      return null;
    }
    const alive =
      consent.statusConceptId === CONS.CONSENT_ACTIVE &&
      (!consent.validTo || consent.validTo.getTime() > now);
    if (!alive) return [];
    const provisions = await this.provisionsRepo.findOpenByConsent(
      em,
      consentId,
    );
    return provisions
      .filter((p) => p.actionConceptId === CONS.ACTION_PERMIT)
      .map((p) => p.dataClassConceptId)
      .filter((id): id is string => id !== undefined);
  }

  private async hasOtherBasis(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (actor.practitionerProfileId) {
      const relations =
        await this.careRelationshipsRepo.findActiveForPractitionerPatient(
          em,
          actor.practitionerProfileId,
          patientProfileId,
        );
      if (relations.length > 0) return true;
    }
    return this.representation.representsPatient(patientProfileId, actor, em);
  }
}
