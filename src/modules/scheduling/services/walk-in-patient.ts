import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS, ConflictException } from '../../../common';
import type {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import { composeAccountDisplayName } from '../../profiles/person-name';
import { PROF } from '../../profiles/profiles.concepts';
import type {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../profiles/repositories';
import { createGuardianRelatedPerson } from '../../profiles/services/guardian-related-person';

/** Repositorios de `profiles`/`common` que necesita el alta de mostrador. */
export interface WalkInPatientRepos {
  readonly persons: PersonsRepository;
  readonly personProfiles: PersonProfilesRepository;
  readonly patientProfiles: PatientProfilesRepository;
  readonly identifiers: IdentifiersRepository;
  readonly contactPoints: ContactPointsRepository;
  readonly relatedPersons: RelatedPersonsRepository;
}

/** El bloque de filiación que declara quien atiende el mostrador. */
export interface WalkInPatientData {
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

/** Lo que queda disponible para el resto del alta de mostrador (la cita). */
export interface WalkInPatientResult {
  readonly personId: string;
  readonly patientProfileId: string;
  readonly patientCode: string;
}

/**
 * Da de alta al paciente que se presenta en el mostrador sin cuenta de
 * portal (AC-3.3).
 *
 * Mismo tramo persona → perfil → paciente → identificador → contacto que
 * `IamPatientSelfRegistrationService.performRegisterPatient`
 * (`iam-patient-self-registration.service.ts:252-345,451-460`), **sin** el
 * tramo de cuenta: nada de `iam.users`, credenciales, roles,
 * `person_account_links` ni `tenant_memberships` — el titular no está
 * creando una cuenta, sólo se está registrando para que lo atiendan ahora.
 *
 * El llamador controla la transacción: esta función sólo escribe en el `tx`
 * que recibe y hace los `flush` intermedios que las FK planas exigen entre
 * padre e hijo (persona → perfil → paciente, y paciente → identificador).
 *
 * @param repos - Repositorios de personas, perfiles, paciente, identificador,
 *   contacto y personas relacionadas.
 * @param tx - Contexto transaccional del alta, ya abierto por el llamador.
 * @param data - Filiación declarada en el mostrador.
 * @returns Los ids de la persona y su perfil de paciente recién creados.
 * @throws ConflictException si el documento ya tiene un identificador ACTIVO
 *   registrado: hay que retomar al paciente existente, no duplicarlo.
 */
export async function createWalkInPatient(
  repos: WalkInPatientRepos,
  tx: EntityManager,
  data: WalkInPatientData,
): Promise<WalkInPatientResult> {
  const duplicado = await repos.identifiers.findActiveDuplicate(tx, {
    typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    value: data.nationalId,
  });
  if (duplicado) {
    throw new ConflictException(
      'Ya existe un paciente con ese documento de identidad. Buscalo con ' +
        'GET /profiles/patients?nationalId= en vez de registrarlo de nuevo.',
    );
  }

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
    value: data.nationalId,
    useConceptId: CONCEPTS.USE_OFFICIAL,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    issuerAdministrativeAreaConceptId: data.issuerAdministrativeAreaConceptId,
    actorUserId: data.actorUserId,
  });

  repos.contactPoints.create(tx, {
    ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
    ownerId: patient.profileId,
    systemConceptId: CONCEPTS.CONTACT_PHONE,
    value: data.phone,
    useConceptId: CONCEPTS.CONTACT_USE_HOME,
    actorUserId: data.actorUserId,
  });

  // El tutor o persona autorizada, si lo declaró: `createGuardianRelatedPerson`
  // hace su propio `flush` entre la persona del tutor y su vínculo.
  await createGuardianRelatedPerson(
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
  };
}
