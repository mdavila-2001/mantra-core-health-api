import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientProfiles } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/**
 * Hasta dónde llega una búsqueda de pacientes.
 *
 * `unrestricted` es el padrón completo (lo que hace hoy el personal
 * administrativo); `tenant-activity` acota a las personas que tienen actividad
 * en esa organización. Quién recibe cuál lo decide
 * `resolvePatientSearchScope()`, que es donde vive la regla y su porqué.
 */
export type PatientSearchScope =
  | { readonly kind: 'unrestricted' }
  | { readonly kind: 'tenant-activity'; readonly tenantId: string };

/**
 * Criterios del listado de pacientes (UC-05-13), como objeto de consulta.
 *
 * Es un *query object*: los criterios viajan juntos en un valor con nombre en
 * vez de como una fila de parámetros posicionales que crece con cada filtro
 * nuevo. Agregar un criterio es agregar un campo opcional y su fragmento en
 * `searchPage`, sin tocar la firma ni a quien ya la llama.
 */
export interface PatientSearchCriteria {
  /** Texto libre sobre `patient_code` y el nombre de la persona. */
  query?: string;
  /** Documento de identidad EXACTO (`common.identifiers.value`). */
  nationalId?: string;
  /**
   * Departamento que expidió el documento. Sólo tiene sentido junto a
   * {@link PatientSearchCriteria.nationalId}: un carnet no es único en Bolivia
   * sin decir dónde se expidió.
   */
  issuerAdministrativeAreaConceptId?: string;
  /** Alcance de quien pregunta. */
  scope: PatientSearchScope;
  /** Continuación keyset: último `patientCode` devuelto. */
  afterPatientCode?: string;
}

/**
 * Fila de la página: lo justo para continuar el keyset e hidratar la persona.
 *
 * No son entidades `PatientProfiles` porque la consulta ya no es un `find`
 * sobre una tabla: cruza `persons`, `identifiers` y las dos tablas de actividad,
 * y devolver entidades obligaría a que el ORM materializara filas que nadie usa
 * —el servicio sólo lee estos dos campos y resuelve el nombre aparte—.
 */
export interface PatientSearchRow {
  /** PK compartida de la cadena CTI: `persons.id` = `patient_profiles.profile_id`. */
  profileId: string;
  /** Código único de paciente; es también la clave del cursor. */
  patientCode: string;
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
   * ## Una sola sentencia, y por qué importa
   *
   * Hasta la TAREA-07 el filtro por nombre se resolvía en DOS consultas: una
   * traía hasta **mil** ids de `profiles.persons` y la otra los usaba como
   * `IN (...)`. Ese tope era invisible desde afuera y mentía: con más de mil
   * homónimos la página decía «no hay más» cuando sí había. Ahora cada criterio
   * es un `EXISTS` correlacionado dentro de la misma sentencia, así que **el
   * único corte es el `LIMIT` de la página** y el cursor dice la verdad.
   *
   * ## Cómo se compone
   *
   * Cada criterio del {@link PatientSearchCriteria} aporta un fragmento `WHERE`
   * y sus parámetros; los fragmentos se conjugan con `AND`. Sumar un filtro es
   * sumar un `if`, no reescribir la consulta. Los valores viajan **siempre**
   * como parámetros (`?`), nunca interpolados.
   *
   * ## El documento usa el índice, no lo escanea
   *
   * El `EXISTS` sobre `common.identifiers` filtra por `type_concept_id` y
   * `value` en igualdad, que es exactamente
   * `ix_identifiers_type_concept_id_value` (v4.2.4, TAREA-07). El departamento
   * emisor se suma como igualdad opcional y no participa del índice: acota
   * después, que es lo que corresponde a una columna *nullable*.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param criteria - Criterios de búsqueda, alcance y cursor de continuación.
   * @param limit - Tope de filas a devolver.
   * @returns Perfiles de paciente ordenados por código.
   */
  async searchPage(
    em: EntityManager,
    criteria: PatientSearchCriteria,
    limit: number,
  ): Promise<PatientSearchRow[]> {
    const condiciones: string[] = [];
    const params: unknown[] = [];

    if (criteria.afterPatientCode !== undefined) {
      condiciones.push('pp.patient_code > ?');
      params.push(criteria.afterPatientCode);
    }

    if (criteria.query) {
      const patron = `%${criteria.query}%`;
      condiciones.push(
        `(pp.patient_code ilike ?
          or exists (select 1
                       from profiles.persons p
                      where p.id = pp.profile_id
                        and p.display_name ilike ?))`,
      );
      params.push(patron, patron);
    }

    if (criteria.nationalId) {
      // Igualdad y no `ilike`: un carnet se busca entero. El `ilike` con
      // comodines no usaría el índice y además haría que «123» trajera a todos
      // los que lo contienen, que no es buscar a una persona.
      let documento = `exists (select 1
                                 from common.identifiers i
                                where i.owner_id = pp.profile_id
                                  and i.type_concept_id = ?
                                  and i.value = ?`;
      params.push(CONCEPTS.ID_TYPE_NATIONAL, criteria.nationalId);
      if (criteria.issuerAdministrativeAreaConceptId) {
        documento += `
                                  and i.issuer_administrative_area_concept_id = ?`;
        params.push(criteria.issuerAdministrativeAreaConceptId);
      }
      condiciones.push(`${documento})`);
    }

    if (criteria.scope.kind === 'tenant-activity') {
      // «Paciente de mi organización» no es una columna —la identidad no tiene
      // tenant— sino haber sido atendido ahí: una reserva de agenda o una
      // relación asistencial. El porqué está en `resolvePatientSearchScope()`.
      condiciones.push(
        `(exists (select 1
                    from scheduling.appointment_bookings b
                   where b.patient_profile_id = pp.profile_id
                     and b.tenant_id = ?)
          or exists (select 1
                       from authz.care_relationships cr
                      where cr.patient_profile_id = pp.profile_id
                        and cr.tenant_id = ?))`,
      );
      params.push(criteria.scope.tenantId, criteria.scope.tenantId);
    }

    // El separador es un salto real dentro de un template: las condiciones
    // quedan una por línea en el SQL, que es lo que hace legible el EXPLAIN.
    const separador = `
      and `;
    const where =
      condiciones.length > 0 ? `where ${condiciones.join(separador)}` : '';

    const filas = await em
      .getConnection()
      .execute<{ profile_id: string; patient_code: string }[]>(
        `select pp.profile_id, pp.patient_code
         from profiles.patient_profiles pp
        ${where}
        order by pp.patient_code asc
        limit ?`,
        [...params, limit],
      );

    return filas.map((f) => ({
      profileId: f.profile_id,
      patientCode: f.patient_code,
    }));
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
