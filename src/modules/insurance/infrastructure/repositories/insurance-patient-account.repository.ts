import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PersonAccountLinks,
  PatientProfiles,
} from '../../../profiles/entities';
import { PROF } from '../../../profiles/profiles.concepts';

export interface InsurancePatientAccountLink {
  readonly personId: string;
}

export interface InsurancePatientProfile {
  readonly profileId: string;
}

/** Profile identity lookups required by insurance-owned patient workflows. */
@Injectable()
export class InsurancePatientAccountRepository {
  findActiveAccountLink(
    em: EntityManager,
    userId: string,
  ): Promise<InsurancePatientAccountLink | null> {
    return em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  }

  findPatientProfile(
    em: EntityManager,
    personId: string,
  ): Promise<InsurancePatientProfile | null> {
    return em.findOne(PatientProfiles, { profileId: personId });
  }
}
