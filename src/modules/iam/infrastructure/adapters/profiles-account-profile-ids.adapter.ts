import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../../profiles/infrastructure/repositories';
import type { AccountProfileIdsPort } from '../../application/ports/account-profile-ids.port';

/**
 * Perfiles del titular de la cuenta para los claims `pid` y `hpid`: el vínculo
 * activo cuenta-persona y de ahí el perfil, porque `profile_id` ES `persons.id`.
 */
@Injectable()
export class ProfilesAccountProfileIdsAdapter implements AccountProfileIdsPort {
  constructor(
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
  ) {}

  async findPatientProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined> {
    const link = await this.accountLinksRepo.findActiveByUser(em, userId);
    if (!link) return undefined;
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    return patient?.profileId;
  }

  async findPractitionerProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined> {
    const link = await this.accountLinksRepo.findActiveByUser(em, userId);
    if (!link) return undefined;
    const practitioner = await this.practitionerProfilesRepo.findById(
      em,
      link.personId,
    );
    return practitioner?.profileId;
  }
}
