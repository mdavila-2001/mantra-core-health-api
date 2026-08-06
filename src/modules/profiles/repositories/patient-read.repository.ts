import { Injectable } from '@nestjs/common';
import type { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  PatientIdentityLinks,
  PatientProfiles,
  Persons,
  RelatedPersons,
} from '../entities';

/** Criterios de `GET /profiles/patients`. */
export interface SearchPatientsFilter {
  /**
   * Texto parcial sobre el nombre visible.
   */
  query?: string;
  /**
   * Código de paciente exacto.
   */
  patientCode?: string;
}

/**
 * Lecturas de filiación.
 *
 * Aparte de los repositorios de escritura por la misma razón que en agenda:
 * aquéllos sirven al alta y toman filas para modificarlas; esto sólo proyecta.
 */
@Injectable()
export class PatientReadRepository {
  /**
   * Perfiles de paciente que cumplen el filtro, con su persona.
   *
   * El nombre vive en `profiles.persons` y el código en
   * `profiles.patient_profiles`, así que la búsqueda resuelve primero el lado
   * que discrimina y luego completa el otro: son dos consultas indexadas en vez
   * de un producto cartesiano.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Criterios de la consulta.
   * @param limit - Tope de resultados.
   * @param offset - Desplazamiento de la página.
   * @returns Pares de perfil y persona.
   */
  async searchPatients(
    em: EntityManager,
    filter: SearchPatientsFilter,
    limit: number,
    offset: number,
  ): Promise<Array<{ profile: PatientProfiles; person: Persons | null }>> {
    // Con `query` manda el nombre: se filtran las personas y de ahí salen los
    // perfiles. Sin `query`, manda el perfil.
    if (filter.query) {
      const persons = await em.find(
        Persons,
        { displayName: { $ilike: `%${filter.query}%` } },
        { orderBy: { displayName: 'asc' }, limit: limit + 1, offset },
      );
      if (persons.length === 0) return [];

      const profileWhere: FilterQuery<PatientProfiles> = {
        profileId: { $in: persons.map((person) => person.id) },
      };
      if (filter.patientCode) profileWhere.patientCode = filter.patientCode;
      const profiles = await em.find(PatientProfiles, profileWhere);
      const byId = new Map(
        profiles.map((profile) => [profile.profileId, profile]),
      );

      return persons
        .filter((person) => byId.has(person.id))
        .map((person) => ({ profile: byId.get(person.id)!, person }));
    }

    const where: FilterQuery<PatientProfiles> = {};
    if (filter.patientCode) where.patientCode = filter.patientCode;
    const profiles = await em.find(PatientProfiles, where, {
      orderBy: { patientCode: 'asc' },
      limit: limit + 1,
      offset,
    });
    if (profiles.length === 0) return [];

    const persons = await em.find(Persons, {
      id: { $in: profiles.map((profile) => profile.profileId) },
    });
    const byId = new Map(persons.map((person) => [person.id, person]));

    return profiles.map((profile) => ({
      profile,
      person: byId.get(profile.profileId) ?? null,
    }));
  }

  /**
   * Vínculos de identidad del paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil.
   * @returns Resultado conforme al contrato `Promise<PatientIdentityLinks[]>`.
   */
  findIdentityLinks(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientIdentityLinks[]> {
    return em.find(
      PatientIdentityLinks,
      { patientProfileId },
      { orderBy: { createdAt: 'asc' } },
    );
  }

  /**
   * Personas relacionadas con el paciente, con su nombre ya resuelto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil.
   * @returns Pares de vínculo y persona.
   */
  async findRelatedPersons(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<Array<{ link: RelatedPersons; person: Persons | null }>> {
    const links = await em.find(
      RelatedPersons,
      { patientProfileId },
      { orderBy: { createdAt: 'asc' } },
    );
    if (links.length === 0) return [];

    const persons = await em.find(Persons, {
      id: { $in: links.map((link) => link.personId) },
    });
    const byId = new Map(persons.map((person) => [person.id, person]));

    return links.map((link) => ({
      link,
      person: byId.get(link.personId) ?? null,
    }));
  }
}
