import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerLanguages } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un idioma clínico del profesional. */
export interface CreatePractitionerLanguageData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a language concept.
   */
  languageConceptId: string;
  /**
   * Identificador asociado a proficiency concept.
   */
  proficiencyConceptId?: string;
  /**
   * Valor de clinical interpretation allowed mantenido por la instancia.
   */
  clinicalInterpretationAllowed?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.practitioner_languages`. */
@Injectable()
export class PractitionerLanguagesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerLanguages`.
   */
  create(
    em: EntityManager,
    data: CreatePractitionerLanguageData,
  ): PractitionerLanguages {
    return em.create(
      PractitionerLanguages,
      {
        practitionerProfileId: data.practitionerProfileId,
        languageConceptId: data.languageConceptId,
        proficiencyConceptId: data.proficiencyConceptId,
        clinicalInterpretationAllowed:
          data.clinicalInterpretationAllowed ?? false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
