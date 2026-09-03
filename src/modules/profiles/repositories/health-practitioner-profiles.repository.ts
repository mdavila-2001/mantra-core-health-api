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
   * Página de profesionales para la guía (carril R2-1).
   *
   * Keyset por `practitioner_code` —el mismo patrón que el listado de
   * pacientes—: es único, estable y no exige unir `persons` para paginar. El
   * orden humano (por nombre, agrupado por especialidad) lo arma la pantalla,
   * que de todos modos junta las páginas para dibujar la guía entera.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Continuación, filtro opcional por perfiles y filtro
   *   opcional por estado de verificación (corrección #12/#13: fuera del
   *   bypass DEV/TEST, la guía solo lista profesionales verificados).
   * @param limit - Filas a traer (el servicio pide una de más).
   * @returns La página, en orden estable de código.
   */
  listPage(
    em: EntityManager,
    filters: {
      afterCode?: string;
      profileIds?: readonly string[];
      verificationStatusConceptId?: string;
    },
    limit: number,
  ): Promise<HealthPractitionerProfiles[]> {
    const where: Record<string, unknown> = {};
    if (filters.afterCode !== undefined) {
      where.practitionerCode = { $gt: filters.afterCode };
    }
    if (filters.profileIds !== undefined) {
      // `$in` vacío se corta antes en el servicio: MikroORM lo traduce a
      // `in (null)` y la página saldría vacía sin decir por qué.
      where.profileId = { $in: [...filters.profileIds] };
    }
    if (filters.verificationStatusConceptId !== undefined) {
      where.verificationStatusConceptId = filters.verificationStatusConceptId;
    }
    return em.find(HealthPractitionerProfiles, where, {
      orderBy: { practitionerCode: 'ASC' },
      limit,
    });
  }

  /**
   * Los perfiles que la guía muestra, sólo sus ids.
   *
   * Mismo filtro que {@link listPage} —de ahí que reciba el mismo
   * `verificationStatusConceptId`, `undefined` cuando el bypass está activo—:
   * es lo que hace que un recuento por especialidad no pueda discrepar de la
   * lista que abre esa especialidad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param verificationStatusConceptId - Estado exigido, o `undefined` para no exigir ninguno.
   * @returns Los ids de perfil visibles.
   */
  async findVisibleProfileIds(
    em: EntityManager,
    verificationStatusConceptId?: string,
  ): Promise<string[]> {
    const where: Record<string, unknown> = {};
    if (verificationStatusConceptId !== undefined) {
      where.verificationStatusConceptId = verificationStatusConceptId;
    }
    const rows = await em.find(HealthPractitionerProfiles, where, {
      fields: ['profileId'],
    });
    return rows.map((row) => row.profileId);
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
