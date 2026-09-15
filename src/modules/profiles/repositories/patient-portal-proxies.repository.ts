import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientPortalProxies } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de un proxy de portal delegado a un representante. */
export interface CreatePortalProxyData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a proxy user.
   */
  proxyUserId: string;
  /**
   * Identificador asociado a related person.
   */
  relatedPersonId?: string;
  /**
   * Identificador asociado a scope value set.
   */
  scopeValueSetId: string;
  /**
   * Identificador asociado a legal basis record.
   */
  legalBasisRecordId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Una fila de {@link PatientPortalProxiesRepository.listActiveDependentsOfUser}.
 *
 * Los nombres vienen en `snake_case` porque es SQL cruda y no pasa por el
 * mapeo del ORM; el servicio los traduce al contrato de cara al cliente.
 */
export interface DependentRow {
  /** Identificador del apoderamiento que sostiene la representación. */
  readonly proxy_id: string;
  /** Perfil de paciente del dependiente. */
  readonly patient_profile_id: string;
  /** Persona del dependiente. */
  readonly person_id: string;
  /** Nombre de pila. */
  readonly name: string | null;
  /** Segundo nombre. */
  readonly middle_name: string | null;
  /** Apellido paterno. */
  readonly last_name: string | null;
  /** Apellido materno. */
  readonly mother_last_name: string | null;
  /** Nombre visible ya compuesto. */
  readonly display_name: string | null;
  /** Fecha de nacimiento, ya en `YYYY-MM-DD`. */
  readonly birth_date: string | null;
  /** Lo que el titular declaró ser para el dependiente. */
  readonly relationship_concept_id: string | null;
  /** Si la fila de parentesco afirma la tutela. */
  readonly is_legal_guardian: boolean | null;
  /** Documento de identidad vigente del dependiente, si lo declaró. */
  readonly national_id: string | null;
}

/** Acceso a datos de `profiles.patient_portal_proxies`. */
@Injectable()
export class PatientPortalProxiesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientPortalProxies`.
   */
  create(em: EntityManager, data: CreatePortalProxyData): PatientPortalProxies {
    return em.create(
      PatientPortalProxies,
      {
        patientProfileId: data.patientProfileId,
        proxyUserId: data.proxyUserId,
        relatedPersonId: data.relatedPersonId,
        scopeValueSetId: data.scopeValueSetId,
        legalBasisRecordId: data.legalBasisRecordId,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Los apoderamientos vigentes de una cuenta, en cualquier paciente.
   *
   * «Vigente» es el estado activo **más** la ventana de validez: el modelo
   * declara `valid_from`/`valid_to` y nada los hace cumplir, así que filtrar
   * sólo por estado dejaría pasar un apoderamiento que ya venció. Un
   * `valid_to` nulo es el caso normal —el de un padre sobre su hijo no tiene
   * fecha de fin— y también pasa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param proxyUserId - La cuenta que representa.
   * @param now - Instante contra el que se mide la vigencia.
   * @returns Los apoderamientos vigentes de esa cuenta.
   */
  findActiveByProxyUser(
    em: EntityManager,
    proxyUserId: string,
    now: Date,
  ): Promise<PatientPortalProxies[]> {
    return em.find(PatientPortalProxies, {
      proxyUserId,
      statusConceptId: PROF.PROXY_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gt: now } }] },
      ],
    });
  }

  /**
   * El apoderamiento vigente de una cuenta sobre UN paciente concreto.
   *
   * Es la pregunta que hace toda comprobación de permiso —«¿puede este usuario
   * actuar por este paciente?»—, y se responde con una consulta acotada en vez
   * de traer la lista entera: quien tiene tres dependientes pide turno para uno.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param proxyUserId - La cuenta que dice representar.
   * @param patientProfileId - El paciente sobre el que quiere actuar.
   * @param now - Instante contra el que se mide la vigencia.
   * @returns El apoderamiento vigente, o `null` si no lo hay.
   */
  findActiveByProxyUserAndPatient(
    em: EntityManager,
    proxyUserId: string,
    patientProfileId: string,
    now: Date,
  ): Promise<PatientPortalProxies | null> {
    return em.findOne(PatientPortalProxies, {
      proxyUserId,
      patientProfileId,
      statusConceptId: PROF.PROXY_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gt: now } }] },
      ],
    });
  }

  /**
   * Los dependientes de una cuenta, con lo que hace falta para nombrarlos.
   *
   * Va en SQL cruda —igual que la lectura de tutores del perfil propio— porque
   * cruza cuatro tablas de dos agregados distintos y las FK del modelo son
   * columnas uuid planas sin relación declarada en el ORM: pedirlo con el
   * `EntityManager` serían cuatro consultas por dependiente.
   *
   * El parentesco sale de `related_persons`, y la fila que se busca es la que
   * el propio apoderamiento nombra (`related_person_id`): un paciente puede
   * tener varios contactos, y elegir cualquiera diría un parentesco que no es
   * el de quien lo representa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param proxyUserId - La cuenta que representa.
   * @param now - Instante contra el que se mide la vigencia.
   * @returns Una fila por dependiente vigente, de la más reciente a la más vieja.
   */
  listActiveDependentsOfUser(
    em: EntityManager,
    proxyUserId: string,
    now: Date,
  ): Promise<DependentRow[]> {
    return em.getConnection().execute<DependentRow[]>(
      `select pr.id                     as proxy_id,
              pr.patient_profile_id     as patient_profile_id,
              p.id                      as person_id,
              p.name                    as name,
              p.middle_name             as middle_name,
              p.last_name               as last_name,
              p.mother_last_name        as mother_last_name,
              p.display_name            as display_name,
              to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
              rp.relationship_concept_id as relationship_concept_id,
              rp.is_legal_guardian      as is_legal_guardian,
              (select i.value from common.identifiers i
                where i.owner_id = p.id
                  and i.type_concept_id = ?
                  and i.state_concept_id = ?
                order by i.created_at limit 1) as national_id
         from profiles.patient_portal_proxies pr
         join profiles.patient_profiles pp on pp.profile_id = pr.patient_profile_id
         join profiles.persons p on p.id = pp.profile_id
         left join profiles.related_persons rp on rp.id = pr.related_person_id
        where pr.proxy_user_id = ?
          and pr.status_concept_id = ?
          and (pr.valid_from is null or pr.valid_from <= ?)
          and (pr.valid_to is null or pr.valid_to > ?)
        order by pr.created_at desc`,
      [
        CONCEPTS.ID_TYPE_NATIONAL,
        CONCEPTS.STATE_ACTIVE,
        proxyUserId,
        PROF.PROXY_ACTIVE,
        now,
        now,
      ],
    );
  }

  /** Revoca el proxy activo previo del mismo representante para el paciente. */
  revokeActiveForProxyUser(
    em: EntityManager,
    patientProfileId: string,
    proxyUserId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId, proxyUserId, statusConceptId: PROF.PROXY_ACTIVE },
      { statusConceptId: PROF.PROXY_REVOKED, validTo: now, updatedAt: now },
    );
  }

  /** Revoca todos los proxies activos de un paciente (defunción). */
  revokeActiveForPatient(
    em: EntityManager,
    patientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId, statusConceptId: PROF.PROXY_ACTIVE },
      { statusConceptId: PROF.PROXY_REVOKED, validTo: now, updatedAt: now },
    );
  }

  /** Reasigna los proxies de un paciente al sobreviviente durante una fusión. */
  reassignPatientProfile(
    em: EntityManager,
    fromPatientProfileId: string,
    toPatientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId: fromPatientProfileId },
      { patientProfileId: toPatientProfileId, updatedAt: now },
    );
  }
}
