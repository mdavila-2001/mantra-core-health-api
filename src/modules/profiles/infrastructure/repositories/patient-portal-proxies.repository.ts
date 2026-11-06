import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientPortalProxies } from '../../entities';
import { CONCEPTS, createdBy } from '../../../../common';
import { PROF } from '../../profiles.concepts';
import {
  containsPattern,
  sqlSearchKey,
  sqlSortKey,
} from '../../../terminology/repositories/glossary-search.sql';
import type {
  DependentRow,
  GuardianRow,
  PendingRequestRow,
  RepresentableCandidateRow,
  RepresentableSearch,
} from './patient-portal-proxies.rows';
export type * from './patient-portal-proxies.rows';

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
              p.sex_at_birth_concept_id as sex_at_birth_concept_id,
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

  /** Personas que hoy pueden actuar por el paciente. */
  listActiveGuardiansOfPatient(
    em: EntityManager,
    patientProfileId: string,
    now: Date,
  ): Promise<GuardianRow[]> {
    return em.getConnection().execute<GuardianRow[]>(
      `select p.display_name,
              rp.relationship_concept_id,
              rp.is_legal_guardian,
              (select cp.value from common.contact_points cp
                where cp.owner_id = p.id
                  and cp.system_concept_id = ?
                  and cp.valid_to is null
                order by cp.rank nulls last limit 1) as phone
         from profiles.patient_portal_proxies pr
         join profiles.person_account_links pal
           on pal.user_id = pr.proxy_user_id
          and pal.status_concept_id = ?
         join profiles.persons p on p.id = pal.person_id
         left join profiles.related_persons rp
           on rp.id = pr.related_person_id
          and rp.status_concept_id = ?
        where pr.patient_profile_id = ?
          and pr.status_concept_id = ?
          and (pr.valid_from is null or pr.valid_from <= ?)
          and (pr.valid_to is null or pr.valid_to > ?)
        order by pr.created_at asc`,
      [
        CONCEPTS.CONTACT_PHONE,
        PROF.ACCOUNT_LINK_ACTIVE,
        PROF.RELATED_ACTIVE,
        patientProfileId,
        PROF.PROXY_ACTIVE,
        now,
        now,
      ],
    );
  }

  /**
   * Un apoderamiento por su id, en cualquier estado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del apoderamiento.
   * @returns La fila, o `null` si no existe.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PatientPortalProxies | null> {
    return em.findOne(PatientPortalProxies, { id });
  }

  /**
   * La solicitud pendiente de una cuenta para representar a UN paciente.
   *
   * Es el freno contra el pedido repetido: mientras haya una sin responder, la
   * segunda no suma nada salvo otra notificación a quien ya la tiene.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param proxyUserId - La cuenta que pide representar.
   * @param patientProfileId - El paciente al que se lo pide.
   * @returns La solicitud pendiente, o `null` si no la hay.
   */
  findPendingByProxyUserAndPatient(
    em: EntityManager,
    proxyUserId: string,
    patientProfileId: string,
  ): Promise<PatientPortalProxies | null> {
    return em.findOne(PatientPortalProxies, {
      proxyUserId,
      patientProfileId,
      statusConceptId: PROF.PROXY_PENDING,
    });
  }

  /**
   * Las solicitudes que esperan respuesta de un paciente, con el nombre de
   * quien pide.
   *
   * SQL cruda por lo mismo que {@link listActiveDependentsOfUser}: el nombre
   * sale de cruzar la cuenta que pide (`proxy_user_id`) con su persona, y las
   * FK son columnas uuid planas sin relación en el ORM.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - El paciente al que se lo pidieron.
   * @returns Una fila por solicitud pendiente, de la más reciente a la más vieja.
   */
  listPendingForPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PendingRequestRow[]> {
    return em.getConnection().execute<PendingRequestRow[]>(
      `select pr.id               as id,
              pr.created_at       as created_at,
              p.name              as name,
              p.middle_name       as middle_name,
              p.last_name         as last_name,
              p.mother_last_name  as mother_last_name,
              p.display_name      as display_name
         from profiles.patient_portal_proxies pr
         left join profiles.person_account_links pal
                on pal.user_id = pr.proxy_user_id
               and pal.status_concept_id = ?
         left join profiles.persons p on p.id = pal.person_id
        where pr.patient_profile_id = ?
          and pr.status_concept_id = ?
        order by pr.created_at desc`,
      [PROF.ACCOUNT_LINK_ACTIVE, patientProfileId, PROF.PROXY_PENDING],
    );
  }

  /**
   * Las cuentas de paciente cuyo nombre coincide con lo escrito y a las que el
   * titular todavía puede pedirles que lo dejen representarlas.
   *
   * Una candidata es una **persona con cuenta activa y perfil de paciente**: un
   * dependiente sin cuenta no puede aceptar nada, y ofrecerlo sería prometer un
   * vínculo imposible. Quedan fuera el propio titular y quien ya lo tiene como
   * representante vigente o ya tiene una solicitud suya pendiente.
   *
   * Todas las palabras escritas deben abrir alguna palabra del nombre (en
   * cualquier orden): «ana per» encuentra a «Ana María Pérez». La comparación
   * pliega mayúsculas y tildes con `translate` —no hay `unaccent`— igual que el
   * glosario. Las palabras llegan ya limpias a letras y dígitos, así que ningún
   * comodín de `LIKE` pasa de la entrada a la consulta.
   *
   * SQL cruda por lo mismo que {@link listActiveDependentsOfUser}: cruza tablas
   * de dos agregados con FK que son columnas uuid planas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param search - Quién pregunta, qué palabras y hasta cuántas filas.
   * @returns Las candidatas, por nombre y con desempate estable por id.
   */
  searchRepresentableByName(
    em: EntityManager,
    search: RepresentableSearch,
  ): Promise<RepresentableCandidateRow[]> {
    // Sin palabras no hay criterio: devolver todo el padrón sería enumerarlo.
    if (search.tokens.length === 0) return Promise.resolve([]);
    const nameKey = sqlSearchKey(`coalesce(p.display_name, '')`);
    const wordPrefix = search.tokens.map(
      () => `(' ' || ${nameKey}) like ? escape '\\'`,
    );
    return em.getConnection().execute<RepresentableCandidateRow[]>(
      `select p.id                as patient_profile_id,
              p.display_name      as display_name,
              p.name              as name,
              p.middle_name       as middle_name,
              p.last_name         as last_name,
              p.mother_last_name  as mother_last_name,
              (select i.value from common.identifiers i
                where i.owner_id = p.id
                  and i.type_concept_id = ?
                  and i.state_concept_id = ?
                order by i.created_at limit 1) as national_id
         from profiles.persons p
         join profiles.patient_profiles pp on pp.profile_id = p.id
        where p.id <> ?
          and exists (select 1 from profiles.person_account_links pal
                       where pal.person_id = p.id
                         and pal.status_concept_id = ?)
          and not exists (select 1 from profiles.patient_portal_proxies pr
                           where pr.patient_profile_id = p.id
                             and pr.proxy_user_id = ?
                             and (pr.status_concept_id = ?
                                  or (pr.status_concept_id = ?
                                      and (pr.valid_from is null or pr.valid_from <= ?)
                                      and (pr.valid_to is null or pr.valid_to > ?))))
          and ${wordPrefix.join(' and ')}
        order by ${sqlSortKey(`coalesce(p.display_name, '')`)}, p.id
        limit ?`,
      [
        CONCEPTS.ID_TYPE_NATIONAL,
        CONCEPTS.STATE_ACTIVE,
        search.ownerPersonId,
        PROF.ACCOUNT_LINK_ACTIVE,
        search.proxyUserId,
        PROF.PROXY_PENDING,
        PROF.PROXY_ACTIVE,
        search.now,
        search.now,
        ...search.tokens.map(
          (token) => `% ${containsPattern(token).slice(1, -1)}%`,
        ),
        search.limit,
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
