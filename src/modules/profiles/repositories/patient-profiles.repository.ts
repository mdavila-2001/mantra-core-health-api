import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientProfiles, Persons } from '../entities';
import { createdBy } from '../../../common';

/** Filtros del listado de pacientes (UC-05-13). */
export interface SearchPatientsFilters {
  /** Texto libre sobre `patient_code` y el nombre de la persona. */
  query?: string;
  /** Continuación keyset: último `patientCode` devuelto. */
  afterPatientCode?: string;
}

/** Datos del perfil de paciente (PK = person_profiles.id, 1:1). */
export interface CreatePatientProfileData {
  /**
   * Identificador asociado a profile.
   */
  profileId: string;
  /**
   * Valor de patient code mantenido por la instancia.
   */
  patientCode: string;
  /**
   * Valor de master patient index code mantenido por la instancia.
   */
  masterPatientIndexCode?: string;
  /**
   * Identificador asociado a record linkage status concept.
   */
  recordLinkageStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_profiles`. */
@Injectable()
export class PatientProfilesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Identificador de profile.
   * @returns Resultado de find by id conforme al contrato `Promise<PatientProfiles | null>`.
   */
  findById(
    em: EntityManager,
    profileId: string,
  ): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { profileId });
  }

  /**
   * Página del listado de pacientes, ordenada por `patient_code`.
   *
   * La paginación es keyset y no `offset` a propósito: el listado se recorre
   * mientras se dan de alta pacientes nuevos, y con `offset` una alta
   * intercalada desplaza la ventana y hace que una fila se repita o se salte
   * entre páginas.
   *
   * El texto libre busca sobre el código del paciente y sobre el nombre de la
   * persona. El nombre vive en `profiles.persons`, así que se resuelve primero
   * a una lista de ids: son dos consultas en vez de un join, pero mantiene el
   * repositorio sobre su propia tabla y evita que el filtro dependa del mapeo
   * de una entidad ajena.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Texto a buscar y cursor de continuación.
   * @param limit - Tope de filas a devolver.
   * @returns Perfiles de paciente ordenados por código.
   */
  async searchPage(
    em: EntityManager,
    filters: SearchPatientsFilters,
    limit: number,
  ): Promise<PatientProfiles[]> {
    const where: Record<string, unknown> = {};

    if (filters.afterPatientCode !== undefined) {
      where.patientCode = { $gt: filters.afterPatientCode };
    }

    if (filters.query) {
      const pattern = `%${filters.query}%`;
      const persons = await em.find(
        Persons,
        { displayName: { $ilike: pattern } },
        { fields: ['id'], limit: 1000 },
      );
      const codeMatch = { patientCode: { $ilike: pattern } };
      // Sin coincidencias por nombre no se añade un `$in` vacío: MikroORM lo
      // traduce a `in (null)` y el listado devolvería cero incluso cuando el
      // texto sí casa con un código.
      where.$or =
        persons.length > 0
          ? [codeMatch, { profileId: { $in: persons.map((p) => p.id) } }]
          : [codeMatch];
    }

    return em.find(PatientProfiles, where, {
      orderBy: { patientCode: 'ASC' },
      limit,
    });
  }

  /** Verifica unicidad de patient_code (uq_patient_profiles_patient_code). */
  findByPatientCode(
    em: EntityManager,
    patientCode: string,
  ): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { patientCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientProfiles`.
   */
  create(em: EntityManager, data: CreatePatientProfileData): PatientProfiles {
    return em.create(
      PatientProfiles,
      {
        profileId: data.profileId,
        patientCode: data.patientCode,
        masterPatientIndexCode: data.masterPatientIndexCode,
        recordLinkageStatusConceptId: data.recordLinkageStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
