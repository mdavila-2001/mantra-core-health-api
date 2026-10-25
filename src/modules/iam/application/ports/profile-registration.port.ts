import type { EntityManager } from '@mikro-orm/postgresql';
import type { DeclaredPersonName } from '../../../../common/text/person-name';

/** Una persona de contacto de una organización (representante o gerencia). */
export interface ContactPersonInput extends DeclaredPersonName {
  readonly email: string;
  readonly mobile?: string;
  readonly phone?: string;
  readonly nationalId?: string;
  readonly actorUserId: string;
}

export interface CreatedContactPerson {
  readonly personId: string;
  readonly identifierId?: string;
}

/** El tutor o contacto de emergencia que el paciente declara al registrarse. */
export interface GuardianInput {
  readonly patientProfileId: string;
  readonly name?: string;
  readonly phone?: string;
  readonly relationshipConceptId?: string;
  readonly actorUserId: string;
}

/**
 * Registros de `profiles` que las altas escriben en la misma transacción que la
 * cuenta: la persona, sus perfiles, el vínculo cuenta-persona y, para el
 * profesional, matrícula, títulos, idiomas y especialidades.
 *
 * Las cargas de `create*` son las de los repositorios de `profiles`.
 */
export interface ProfileRegistrationPort {
  createPerson(tx: EntityManager, data: object): { id: string };
  createPersonProfile(tx: EntityManager, data: object): unknown;
  createPatientProfile(tx: EntityManager, data: object): { profileId: string };
  createAccountLink(tx: EntityManager, data: object): unknown;

  findPractitionerByCode(tx: EntityManager, code: string): Promise<unknown>;
  createPractitionerProfile(
    tx: EntityManager,
    data: object,
  ): { profileId: string };
  createJurisdictionAuthorization(
    tx: EntityManager,
    data: object,
  ): { id: string };
  createProfessionalCredential(tx: EntityManager, data: object): { id: string };
  createPractitionerLanguage(tx: EntityManager, data: object): unknown;
  createPractitionerSpecialty(tx: EntityManager, data: object): unknown;

  /** Rechaza (422) un concepto que no es un departamento del catálogo. */
  assertIsAdministrativeArea(
    tx: EntityManager,
    conceptId: string,
  ): Promise<void>;
  /** Rechaza (422) un concepto que no es una especialidad médica. */
  assertIsMedicalSpecialty(tx: EntityManager, conceptId: string): Promise<void>;

  createGuardianRelatedPerson(
    tx: EntityManager,
    data: GuardianInput,
  ): Promise<boolean>;
  createContactPerson(
    tx: EntityManager,
    data: ContactPersonInput,
  ): CreatedContactPerson;
}

export const PROFILE_REGISTRATION_PORT = Symbol(
  'IAM_PROFILE_REGISTRATION_PORT',
);
