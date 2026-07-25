import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerLanguages } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un idioma clínico del profesional. */
export interface CreatePractitionerLanguageData {
  practitionerProfileId: string;
  languageConceptId: string;
  proficiencyConceptId?: string;
  clinicalInterpretationAllowed?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.practitioner_languages`. */
@Injectable()
export class PractitionerLanguagesRepository {
  create(em: EntityManager, data: CreatePractitionerLanguageData): PractitionerLanguages {
    return em.create(
      PractitionerLanguages,
      {
        practitionerProfileId: data.practitionerProfileId,
        languageConceptId: data.languageConceptId,
        proficiencyConceptId: data.proficiencyConceptId,
        clinicalInterpretationAllowed: data.clinicalInterpretationAllowed ?? false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
