import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PersonProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear el perfil 1:1 (paciente o profesional) de una persona. */
export interface CreatePersonProfileData {
  personId: string;
  profileTypeConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.person_profiles` (respeta uq_person_profiles_person_type). */
@Injectable()
export class PersonProfilesRepository {
  findById(em: EntityManager, id: string): Promise<PersonProfiles | null> {
    return em.findOne(PersonProfiles, { id });
  }

  /** Perfil de un tipo concreto para una persona (p. ej. el perfil de paciente). */
  findByPersonAndType(
    em: EntityManager,
    personId: string,
    profileTypeConceptId: string,
  ): Promise<PersonProfiles | null> {
    return em.findOne(PersonProfiles, { personId, profileTypeConceptId });
  }

  create(em: EntityManager, data: CreatePersonProfileData): PersonProfiles {
    return em.create(
      PersonProfiles,
      {
        personId: data.personId,
        profileTypeConceptId: data.profileTypeConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
