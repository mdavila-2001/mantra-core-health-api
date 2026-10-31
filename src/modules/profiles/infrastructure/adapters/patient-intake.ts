import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS, ConflictException } from '../../../../common';
import type {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import { createGuardianRelatedPersonRecord } from '../../application/services/guardian-related-person';
import {
  isNationalIdUniqueViolation,
  normalizeNationalId,
} from '../../domain/national-id';
import { composeAccountDisplayName } from '../../domain/person-name';
import { PROF } from '../../profiles.concepts';
import type {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../repositories';

/**
 * El 409 de un documento ya registrado: el mismo para la comprobación previa y
 * para el choque con el índice único, sin revelar de quién es. Es una subclase
 * para que quien llama (el alta de apoyo) lo reconozca y le ponga su motivo.
 */
export class PatientDocumentRegisteredException extends ConflictException {}

function documentRegistered(): PatientDocumentRegisteredException {
  return new PatientDocumentRegisteredException(
    'Ya existe un paciente con ese documento de identidad. Búsquelo con ' +
      'GET /profiles/patients?nationalId= en vez de registrarlo de nuevo.',
  );
}

/** Repositorios de `profiles`/`common` que necesita el alta de un paciente con filiación. */
export interface PatientIntakeRepos {
  readonly persons: PersonsRepository;
  readonly personProfiles: PersonProfilesRepository;
  readonly patientProfiles: PatientProfilesRepository;
  readonly identifiers: IdentifiersRepository;
  readonly contactPoints: ContactPointsRepository;
  readonly relatedPersons: RelatedPersonsRepository;
}

/** La filiación que declara quien da de alta al paciente (mostrador, apoyo). */
export interface PatientIntakeData {
  readonly name: string;
  readonly middleName?: string;
  readonly lastName: string;
  readonly motherLastName?: string;
  readonly nationalId: string;
  readonly issuerAdministrativeAreaConceptId?: string;
  readonly birthDate?: string;
  readonly phone: string;
  readonly occupationConceptId?: string;
  readonly occupationFreeText?: string;
  readonly guardianName?: string;
  readonly guardianPhone?: string;
  readonly guardianRelationshipConceptId?: string;
  /** Quién escribe las filas, para la auditoría. */
  readonly actorUserId: string;
}

/** Lo que queda creado: la persona, su perfil de paciente y, si lo hubo, el tutor. */
export interface PatientIntakeResult {
  readonly personId: string;
  readonly patientProfileId: string;
  readonly patientCode: string;
  /** Persona y fila de persona relacionada del tutor declarado. */
  readonly guardian?: { personId: string; relatedPersonId: string };
}

/**
 * Da de alta a un paciente sin cuenta de portal con su filiación: persona →
 * perfil → paciente → documento → teléfono → tutor opcional.
 *
 * Es el alta que comparten el mostrador (`scheduling`, AC-3.3) y el personal de
 * apoyo (`delegated_access`, `POST /me/support-patients`): una sola escritura,
 * para que las dos produzcan exactamente las mismas filas.
 *
 * Mismo tramo persona → perfil → paciente → identificador → contacto que
 * `IamPatientSelfRegistrationService.performRegisterPatient`, **sin** el tramo
 * de cuenta: nada de `iam.users`, credenciales, roles, `person_account_links` ni
 * `tenant_memberships` — el titular no está creando una cuenta, sólo se está
 * registrando para que lo atiendan.
 *
 * El llamador controla la transacción: esta función sólo escribe en el `tx` que
 * recibe y hace los `flush` intermedios que las FK planas exigen entre padre e
 * hijo (persona → perfil → paciente, y paciente → identificador).
 *
 * @param repos - Repositorios de personas, perfiles, paciente, identificador,
 *   contacto y personas relacionadas.
 * @param tx - Contexto transaccional del alta, ya abierto por el llamador.
 * @param data - Filiación declarada.
 * @returns Los ids de la persona, su perfil de paciente y el tutor, si lo hubo.
 * @throws ConflictException si el documento ya tiene un identificador ACTIVO
 *   registrado: hay que retomar al paciente existente, no duplicarlo. Si dos
 *   altas simultáneas pasan la comprobación, el índice único del modelo rechaza la
 *   segunda con `23505` (`uq_identifiers_national_id_normalized`) y sale el mismo
 *   409. Es {@link PatientDocumentRegisteredException}; la transacción del llamador
 *   queda abortada en el segundo caso.
 *
 * ## Identidad sin verificar
 *
 * Nadie comprobó el documento que se escribe en el mostrador. Por eso el
 * perfil nace **sin cuenta, sin vínculo de cuenta y sin aserción de identidad**
 * (`identity_assurance`), sin vincular (`LINKAGE_UNLINKED`), y el documento se
 * guarda como identificador **secundario**, no oficial: el registro propio del
 * titular, que sí se verifica, lo reclama. El documento se guarda y se compara
 * en su forma canónica ({@link normalizeNationalId}).
 */
export async function registerPatientRecords(
  repos: PatientIntakeRepos,
  tx: EntityManager,
  data: PatientIntakeData,
): Promise<PatientIntakeResult> {
  const nationalId = normalizeNationalId(data.nationalId);
  // Se compara en la forma canónica y con los predicados del índice único del
  // modelo (`uq_identifiers_national_id_normalized`): un documento guardado antes
  // de la normalización, con sus puntos y sus ceros, también choca.
  const duplicate = await repos.identifiers.findActiveNationalIdDuplicate(
    tx,
    nationalId,
  );
  if (duplicate) throw documentRegistered();

  const displayName = composeAccountDisplayName(data);

  const person = repos.persons.create(tx, {
    personStatusConceptId: PROF.PERSON_ACTIVE,
    vitalStatusConceptId: PROF.VITAL_ALIVE,
    name: data.name,
    middleName: data.middleName,
    lastName: data.lastName,
    motherLastName: data.motherLastName,
    displayName,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    occupationConceptId: data.occupationConceptId,
    occupationFreeText: data.occupationConceptId
      ? undefined
      : data.occupationFreeText,
    actorUserId: data.actorUserId,
  });
  // FK plana: `person_profiles.person_id` exige que la persona ya exista.
  await tx.flush();

  repos.personProfiles.create(tx, {
    personId: person.id,
    profileTypeConceptId: PROF.PROFILE_TYPE_PATIENT,
    statusConceptId: PROF.PROFILE_ACTIVE,
    actorUserId: data.actorUserId,
  });

  // `patient_profiles.profile_id` ES `persons.id` (mismo criterio que el
  // auto-registro: ver `ProfilesPatientsService`).
  const patientCode = `PAT-${randomUUID()}`;
  const patient = repos.patientProfiles.create(tx, {
    profileId: person.id,
    patientCode,
    recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
    actorUserId: data.actorUserId,
  });
  // FK plana: `identifiers.owner_id` y `contact_points.owner_id` exigen que
  // el perfil de paciente ya exista.
  await tx.flush();

  repos.identifiers.create(tx, {
    ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
    ownerId: patient.profileId,
    typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    value: nationalId,
    // Declarado en el mostrador y sin verificar: secundario hasta que el titular
    // lo reclame con su propio registro.
    useConceptId: CONCEPTS.USE_SECONDARY,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    issuerAdministrativeAreaConceptId: data.issuerAdministrativeAreaConceptId,
    actorUserId: data.actorUserId,
  });
  // Se vuelca aquí y no al final: si dos altas simultáneas pasaron la
  // comprobación de arriba, el índice único del modelo rechaza la segunda con
  // 23505 y se contesta el mismo 409 que la comprobación. Fuera de este punto el
  // error saldría de un flush ajeno (el del tutor o el del llamador).
  try {
    await tx.flush();
  } catch (error) {
    if (isNationalIdUniqueViolation(error)) throw documentRegistered();
    throw error;
  }

  repos.contactPoints.create(tx, {
    ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
    ownerId: patient.profileId,
    systemConceptId: CONCEPTS.CONTACT_PHONE,
    value: data.phone,
    useConceptId: CONCEPTS.CONTACT_USE_HOME,
    actorUserId: data.actorUserId,
  });

  // El tutor o persona autorizada, si lo declaró: `createGuardianRelatedPersonRecord`
  // hace su propio `flush` entre la persona del tutor y su vínculo.
  const guardian = await createGuardianRelatedPersonRecord(
    {
      persons: repos.persons,
      relatedPersons: repos.relatedPersons,
      contactPoints: repos.contactPoints,
    },
    tx,
    {
      patientProfileId: patient.profileId,
      name: data.guardianName,
      phone: data.guardianPhone,
      relationshipConceptId: data.guardianRelationshipConceptId,
      actorUserId: data.actorUserId,
    },
  );

  return {
    personId: person.id,
    patientProfileId: patient.profileId,
    patientCode,
    ...(guardian ? { guardian } : {}),
  };
}
