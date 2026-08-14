import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthPractitionerProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos del perfil de profesional de salud (regla GENERALIST, PK 1:1 con perfil). */
export interface CreatePractitionerProfileData {
  /**
   * Identificador asociado a profile.
   */
  profileId: string;
  /**
   * Valor de practitioner code mantenido por la instancia.
   */
  practitionerCode: string;
  /**
   * Identificador asociado a practitioner category concept.
   */
  practitionerCategoryConceptId: string;
  /**
   * Valor de professional title mantenido por la instancia.
   */
  professionalTitle?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a practice status concept.
   */
  practiceStatusConceptId: string;
  /**
   * Presentación en prosa. La columna existía y ninguna escritura la llenaba.
   */
  professionalBio?: string;
  /**
   * Valor de accepts new patients mantenido por la instancia.
   */
  acceptsNewPatients?: boolean;
  /**
   * Si atiende por telemedicina.
   */
  telehealthAvailable?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.health_practitioner_profiles`. */
@Injectable()
export class HealthPractitionerProfilesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Identificador de profile.
   * @returns Resultado de find by id conforme al contrato `Promise<HealthPractitionerProfiles | null>`.
   */
  findById(
    em: EntityManager,
    profileId: string,
  ): Promise<HealthPractitionerProfiles | null> {
    return em.findOne(HealthPractitionerProfiles, { profileId });
  }

  /** Verifica unicidad de practitioner_code. */
  findByCode(
    em: EntityManager,
    practitionerCode: string,
  ): Promise<HealthPractitionerProfiles | null> {
    return em.findOne(HealthPractitionerProfiles, { practitionerCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `HealthPractitionerProfiles`.
   */
  create(
    em: EntityManager,
    data: CreatePractitionerProfileData,
  ): HealthPractitionerProfiles {
    return em.create(
      HealthPractitionerProfiles,
      {
        profileId: data.profileId,
        practitionerCode: data.practitionerCode,
        practitionerCategoryConceptId: data.practitionerCategoryConceptId,
        professionalTitle: data.professionalTitle,
        professionalBio: data.professionalBio,
        verificationStatusConceptId: data.verificationStatusConceptId,
        practiceStatusConceptId: data.practiceStatusConceptId,
        acceptsNewPatients: data.acceptsNewPatients ?? false,
        telehealthAvailable: data.telehealthAvailable ?? false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
