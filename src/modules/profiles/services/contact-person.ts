import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import type {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import type { PersonsRepository } from '../repositories';
import { PROF } from '../profiles.concepts';

/** Los repositorios que hacen falta para registrar a una persona de contacto. */
export interface ContactPersonRepos {
  readonly persons: PersonsRepository;
  readonly identifiers: IdentifiersRepository;
  readonly contactPoints: ContactPointsRepository;
}

/** Lo que el formulario declara de una persona de contacto. */
export interface ContactPersonData {
  /** Nombre completo, tal como lo escribieron. */
  readonly displayName: string;
  /** Correo de contacto; siempre se pide. */
  readonly email: string;
  /** Celular, para las gerencias. */
  readonly mobile?: string;
  /** Teléfono fijo o de contacto, para el representante legal. */
  readonly phone?: string;
  /** Documento de identidad, si el formulario lo pide (el representante legal). */
  readonly nationalId?: string;
  /** Quién escribe las filas, para la auditoría. */
  readonly actorUserId: string;
}

/** Lo que quedó creado, para que el llamador lo referencie. */
export interface CreatedContactPerson {
  readonly personId: string;
  /** Id del documento, si se declaró uno. */
  readonly identifierId?: string;
}

/**
 * Registra a una persona que la organización declara como contacto: su
 * representante legal o una de sus gerencias (subtarea 1.4).
 *
 * ## Por qué una persona y no un usuario
 *
 * Mismo argumento que {@link createGuardianRelatedPerson}: el registro de
 * procesos pide de un gerente comercial su nombre, su celular y su correo —no
 * una cuenta—, y exigir un `iam.users` obligaría a crear tres cuentas fantasma
 * por organización. `profiles.persons` sí admite a alguien que sólo existe
 * como persona.
 *
 * ## Por qué `OWNER_PERSON` y no `OWNER_PATIENT`
 *
 * Los dos autorregistros existentes (paciente y profesional) escriben los
 * identificadores y contactos del titular con `OWNER_PATIENT`, porque ahí el
 * titular ES un paciente. Un representante legal no lo es: copiar ese patrón
 * envenenaría toda consulta que asuma «`OWNER_PATIENT` ⇒ alguien con perfil de
 * paciente», que es exactamente lo que el JSDoc de `guardian-related-person`
 * explica para el tutor.
 *
 * ## Por qué `display_name` y no las cuatro partes del nombre
 *
 * El formulario pide «nombre completo» en un solo campo. Partirlo en nombre,
 * segundo nombre, apellido y apellido materno sería adivinar dónde corta —y
 * «Lic. Mariana Siles Justiniano» no se parte igual que «María de los
 * Ángeles»—. `PersonsRepository.create` ya compone el display a partir de las
 * partes cuando existen; acá se le da directo el único dato real.
 *
 * ## Por qué no se busca un duplicado del documento
 *
 * `IdentifiersRepository.findActiveDuplicate` existe, pero ningún alta del
 * repo lo llama: resolver «este CI ya es de alguien» es identidad maestra
 * (`patient_identity_links`), no una decisión que pueda tomar un formulario de
 * registro. Un representante que además sea paciente queda, por ahora, como
 * dos personas.
 *
 * ## Sin `flush`
 *
 * Ni `common.identifiers` ni `common.contact_points` tienen FK hacia
 * `profiles.persons` (`owner_id` es polimórfico, sin constraint), así que las
 * tres filas se pueden construir en la misma unidad de trabajo y persistirse
 * juntas. El llamador flushea una sola vez para las cuatro personas.
 *
 * @param repos - Repositorios de personas, identificadores y contactos.
 * @param tx - Transacción activa del alta.
 * @param data - Lo que el formulario declaró de esta persona.
 * @returns Los ids de la persona y de su documento, si lo hay.
 */
export function createContactPerson(
  repos: ContactPersonRepos,
  tx: EntityManager,
  data: ContactPersonData,
): CreatedContactPerson {
  const persona = repos.persons.create(tx, {
    displayName: data.displayName,
    personStatusConceptId: PROF.PERSON_ACTIVE,
    vitalStatusConceptId: PROF.VITAL_ALIVE,
    actorUserId: data.actorUserId,
  });

  let identifierId: string | undefined;
  if (data.nationalId) {
    const identificador = repos.identifiers.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: persona.id,
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: data.nationalId,
      useConceptId: CONCEPTS.USE_OFFICIAL,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: data.actorUserId,
    });
    identifierId = identificador.id;
  }

  // Todos los contactos son de uso `WORK`: se los declara por su cargo en la
  // organización, no por su vida privada.
  repos.contactPoints.create(tx, {
    ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
    ownerId: persona.id,
    systemConceptId: CONCEPTS.CONTACT_EMAIL,
    value: data.email,
    useConceptId: CONCEPTS.CONTACT_USE_WORK,
    actorUserId: data.actorUserId,
  });

  // `CONTACT_MOBILE` no figura hoy en la enumeración dinámica
  // `contact-point-system` (que sólo lista EMAIL y PHONE), pero el concepto
  // existe y el autorregistro de profesional ya lo escribe: la columna es una
  // FK plana al catálogo y nadie valida pertenencia al conjunto. Si algún día
  // se valida, esto y el alta de profesional son lo primero que hay que
  // arreglar — no inventar otro concepto acá.
  if (data.mobile) {
    repos.contactPoints.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: persona.id,
      systemConceptId: CONCEPTS.CONTACT_MOBILE,
      value: data.mobile,
      useConceptId: CONCEPTS.CONTACT_USE_WORK,
      actorUserId: data.actorUserId,
    });
  }

  if (data.phone) {
    repos.contactPoints.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: persona.id,
      systemConceptId: CONCEPTS.CONTACT_PHONE,
      value: data.phone,
      useConceptId: CONCEPTS.CONTACT_USE_WORK,
      actorUserId: data.actorUserId,
    });
  }

  return { personId: persona.id, identifierId };
}
