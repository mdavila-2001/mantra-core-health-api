import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthPractitionerProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos del perfil de profesional de salud (regla GENERALIST, PK 1:1 con perfil). */
export interface CreatePractitionerProfileData {
  profileId: string;
  practitionerCode: string;
  practitionerCategoryConceptId: string;
  professionalTitle?: string;
  verificationStatusConceptId: string;
  practiceStatusConceptId: string;
  acceptsNewPatients?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.health_practitioner_profiles`. */
@Injectable()
export class HealthPractitionerProfilesRepository {
  findById(em: EntityManager, profileId: string): Promise<HealthPractitionerProfiles | null> {
    return em.findOne(HealthPractitionerProfiles, { profileId });
  }

  /** Verifica unicidad de practitioner_code. */
  findByCode(
    em: EntityManager,
    practitionerCode: string,
  ): Promise<HealthPractitionerProfiles | null> {
    return em.findOne(HealthPractitionerProfiles, { practitionerCode });
  }

  create(em: EntityManager, data: CreatePractitionerProfileData): HealthPractitionerProfiles {
    return em.create(
      HealthPractitionerProfiles,
      {
        profileId: data.profileId,
        practitionerCode: data.practitionerCode,
        practitionerCategoryConceptId: data.practitionerCategoryConceptId,
        professionalTitle: data.professionalTitle,
        verificationStatusConceptId: data.verificationStatusConceptId,
        practiceStatusConceptId: data.practiceStatusConceptId,
        acceptsNewPatients: data.acceptsNewPatients ?? false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
