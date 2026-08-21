import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `profiles` (personas, pacientes y fuerza laboral
 * de salud). Se declaran aquí para que el módulo pueda añadir estados/tipos sin
 * tocar archivos compartidos: `defineModuleConcepts` deriva un UUIDv5 estable por
 * clave (prefijo `profiles:`) que coincide entre el seed y el runtime.
 *
 * - `PROFILES_CONCEPT_SEEDS` lo consume el agregador central del seed.
 * - `PROF` es el mapa `nombre -> UUID` que consumen servicios y smoke.
 *
 * Cada columna `*_concept_id` NOT NULL de los inserts del módulo tiene aquí un
 * valor; los conceptos que llegan del cliente (categoría profesional, jurisdicción,
 * especialidad, tipo de credencial, parentesco, idioma) se pasan por DTO y usan
 * estos ids como valor por defecto razonable.
 */
export const { seeds: PROFILES_CONCEPT_SEEDS, ids: PROF } =
  defineModuleConcepts('profiles', {
    // Ciclo de vida de la persona
    PERSON_ACTIVE: { code: 'PERSON_ACTIVE', display: 'Person active' },
    PERSON_INACTIVE: { code: 'PERSON_INACTIVE', display: 'Person inactive' },
    PERSON_MERGED: { code: 'PERSON_MERGED', display: 'Person merged' },
    VITAL_ALIVE: { code: 'VITAL_ALIVE', display: 'Vital status alive' },
    VITAL_DECEASED: {
      code: 'VITAL_DECEASED',
      display: 'Vital status deceased',
    },

    // Tipo y estado del perfil de persona
    PROFILE_TYPE_PATIENT: {
      code: 'PROFILE_PATIENT',
      display: 'Patient profile type',
    },
    PROFILE_TYPE_PRACTITIONER: {
      code: 'PROFILE_PRACTITIONER',
      display: 'Practitioner profile type',
    },
    PROFILE_ACTIVE: { code: 'PROFILE_ACTIVE', display: 'Profile active' },

    // Estado de vinculación (MPI) del paciente
    LINKAGE_UNLINKED: { code: 'LINKAGE_UNLINKED', display: 'Record unlinked' },
    LINKAGE_LINKED: { code: 'LINKAGE_LINKED', display: 'Record linked' },
    LINKAGE_MERGED: { code: 'LINKAGE_MERGED', display: 'Record merged' },

    // Vínculo persona-cuenta de portal
    ACCOUNT_LINK_SELF: {
      code: 'ACCOUNT_LINK_SELF',
      display: 'Self account link type',
    },
    ACCOUNT_LINK_ACTIVE: {
      code: 'ACCOUNT_LINK_ACTIVE',
      display: 'Account link active',
    },
    ACCOUNT_LINK_SUPERSEDED: {
      code: 'ACCOUNT_LINK_SUPERSEDED',
      display: 'Account link superseded',
    },
    ACCOUNT_LINK_REVOKED: {
      code: 'ACCOUNT_LINK_REVOKED',
      display: 'Account link revoked',
    },
    ACCOUNT_LINK_VERIFIED: {
      code: 'ACCOUNT_LINK_VERIFIED',
      display: 'Account link verified',
    },

    // Profesional de salud
    PRACT_CATEGORY_GENERAL: {
      code: 'PRACT_CATEGORY_GENERAL',
      display: 'General practitioner category',
    },
    PRACT_VERIF_PENDING: {
      code: 'PRACT_VERIF_PENDING',
      display: 'Practitioner verification pending',
    },
    PRACT_VERIF_VERIFIED: {
      code: 'PRACT_VERIF_VERIFIED',
      display: 'Practitioner verified',
    },
    PRACTICE_ONBOARDING: {
      code: 'PRACTICE_ONBOARDING',
      display: 'Practice onboarding',
    },
    PRACTICE_ACTIVE: { code: 'PRACTICE_ACTIVE', display: 'Practice active' },

    // Autorización jurisdiccional (licencia)
    JURISDICTION_NATIONAL: {
      code: 'JURISDICTION_NATIONAL',
      display: 'National jurisdiction',
    },
    // SEDES (Servicio Departamental de Salud) es una autorización departamental,
    // no nacional: un médico que ejerce en Santa Cruz puede tener las dos —su
    // matrícula del Ministerio de Salud/Colegio y, aparte, su registro ante el
    // SEDES de la gobernación—, así que es una segunda fila de
    // `jurisdiction_authorizations`, no un reemplazo de la nacional.
    JURISDICTION_SEDES_SANTA_CRUZ: {
      code: 'JURISDICTION_SEDES_SANTA_CRUZ',
      display: 'SEDES — Gobernación Autónoma Departamental de Santa Cruz',
    },
    AUTH_PENDING: { code: 'AUTH_PENDING', display: 'Authorization pending' },
    AUTH_ACTIVE: { code: 'AUTH_ACTIVE', display: 'Authorization active' },
    AUTH_EXPIRED: { code: 'AUTH_EXPIRED', display: 'Authorization expired' },

    // Credenciales profesionales
    CREDENTIAL_TYPE_DEGREE: {
      code: 'CREDENTIAL_TYPE_DEGREE',
      display: 'Academic degree credential',
    },
    CRED_PENDING: {
      code: 'CRED_PENDING',
      display: 'Credential pending verification',
    },
    CRED_VERIFIED: { code: 'CRED_VERIFIED', display: 'Credential verified' },
    CRED_REJECTED: { code: 'CRED_REJECTED', display: 'Credential rejected' },

    // Especialidades. Cuál es cada especialidad no se declara acá: lo dice
    // `VS_MEDICAL_SPECIALTY`, que siembra el paquete del modelo. Estos conceptos
    // describen el rol y la verificación de la especialidad declarada, no su nombre.
    SPECIALTY_ROLE_PRIMARY: {
      code: 'SPECIALTY_ROLE_PRIMARY',
      display: 'Primary specialty role',
    },
    SPEC_VERIF_PENDING: {
      code: 'SPEC_VERIF_PENDING',
      display: 'Specialty verification pending',
    },
    SPEC_VERIF_VERIFIED: {
      code: 'SPEC_VERIF_VERIFIED',
      display: 'Specialty verified',
    },

    // Historial laboral: afiliaciones institucionales del profesional.
    // El estado es del registro, no de la relación laboral: si el vínculo sigue
    // vigente lo dice `end_date`, y mezclarlo acá obligaría a mirar dos campos
    // para responder una sola pregunta.
    AFFILIATION_ACTIVE: {
      code: 'AFFILIATION_ACTIVE',
      display: 'Practitioner affiliation active',
    },
    AFFILIATION_RETRACTED: {
      code: 'AFFILIATION_RETRACTED',
      display: 'Practitioner affiliation retracted',
    },
    AFFILIATION_TYPE_EMPLOYMENT: {
      code: 'AFFILIATION_TYPE_EMPLOYMENT',
      display: 'Employment affiliation type',
    },

    // Idiomas clínicos
    LANGUAGE_SPANISH: {
      code: 'LANGUAGE_SPANISH',
      display: 'Spanish clinical language',
    },
    LANG_PROFICIENCY_NATIVE: {
      code: 'LANG_PROFICIENCY_NATIVE',
      display: 'Native language proficiency',
    },

    // Vínculos de identidad externa (MPI)
    IDENTITY_LINK_MPI: {
      code: 'IDENTITY_LINK_MPI',
      display: 'MPI identity link type',
    },
    IDENTITY_UNVERIFIED: {
      code: 'IDENTITY_UNVERIFIED',
      display: 'Identity link unverified',
    },
    IDENTITY_VERIFIED: {
      code: 'IDENTITY_VERIFIED',
      display: 'Identity link verified',
    },

    // Fusión de pacientes
    MERGE_REASON_DUPLICATE: {
      code: 'MERGE_REASON_DUPLICATE',
      display: 'Duplicate patient merge reason',
    },
    MERGE_APPROVED: {
      code: 'MERGE_APPROVED',
      display: 'Merge decision approved',
    },
    MERGE_REVERSED: {
      code: 'MERGE_REVERSED',
      display: 'Merge decision reversed',
    },

    // Personas relacionadas / contactos
    RELATIONSHIP_GUARDIAN: {
      code: 'RELATIONSHIP_GUARDIAN',
      display: 'Legal guardian relationship',
    },
    RELATED_ACTIVE: {
      code: 'RELATED_ACTIVE',
      display: 'Related person active',
    },

    // Proxies de portal
    PROXY_ACTIVE: { code: 'PROXY_ACTIVE', display: 'Portal proxy active' },
    PROXY_REVOKED: { code: 'PROXY_REVOKED', display: 'Portal proxy revoked' },

    // Género administrativo de la persona (`persons.administrative_gender_concept_id`).
    // Valores de HL7 FHIR AdministrativeGender: es el género con el que la persona
    // consta a efectos administrativos, no su sexo biológico.
    GENDER_MALE: { code: 'GENDER_MALE', display: 'Administrative gender male' },
    GENDER_FEMALE: {
      code: 'GENDER_FEMALE',
      display: 'Administrative gender female',
    },
    GENDER_OTHER: {
      code: 'GENDER_OTHER',
      display: 'Administrative gender other',
    },
    GENDER_UNKNOWN: {
      code: 'GENDER_UNKNOWN',
      display: 'Administrative gender unknown',
    },

    // Sexo asignado al nacer (`persons.sex_at_birth_concept_id`). Se modela aparte
    // del género porque son datos clínicamente distintos: el sexo al nacer
    // condiciona rangos de referencia y tamizajes; el género, el trato y el registro.
    BIRTH_SEX_MALE: { code: 'BIRTH_SEX_MALE', display: 'Sex at birth male' },
    BIRTH_SEX_FEMALE: {
      code: 'BIRTH_SEX_FEMALE',
      display: 'Sex at birth female',
    },
    BIRTH_SEX_INTERSEX: {
      code: 'BIRTH_SEX_INTERSEX',
      display: 'Sex at birth intersex',
    },
    BIRTH_SEX_UNKNOWN: {
      code: 'BIRTH_SEX_UNKNOWN',
      display: 'Sex at birth unknown',
    },
  });

/** Códigos de género administrativo que aceptan los DTO de cara al cliente. */
export type AdministrativeGenderCode = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

/** Códigos de sexo al nacer que aceptan los DTO de cara al cliente. */
export type BirthSexCode = 'MALE' | 'FEMALE' | 'INTERSEX' | 'UNKNOWN';

/**
 * Traduce el código de género del cliente al concepto que persiste la columna.
 *
 * Los formularios públicos no conocen —ni deben conocer— los UUID del catálogo de
 * terminología: piden un código legible y el backend lo resuelve, igual que hacen
 * `TENANT_TYPE_CONCEPT_BY_CODE` o `ROLE_CONCEPT_BY_CODE`.
 */
export const ADMIN_GENDER_CONCEPT_BY_CODE: Readonly<
  Record<AdministrativeGenderCode, string>
> = {
  MALE: PROF.GENDER_MALE,
  FEMALE: PROF.GENDER_FEMALE,
  OTHER: PROF.GENDER_OTHER,
  UNKNOWN: PROF.GENDER_UNKNOWN,
};

/** Traduce el código de sexo al nacer al concepto que persiste la columna. */
export const BIRTH_SEX_CONCEPT_BY_CODE: Readonly<Record<BirthSexCode, string>> =
  {
    MALE: PROF.BIRTH_SEX_MALE,
    FEMALE: PROF.BIRTH_SEX_FEMALE,
    INTERSEX: PROF.BIRTH_SEX_INTERSEX,
    UNKNOWN: PROF.BIRTH_SEX_UNKNOWN,
  };

/** Códigos admitidos, para los validadores `@IsIn` de los DTO. */
export const ADMIN_GENDER_CODES = Object.keys(
  ADMIN_GENDER_CONCEPT_BY_CODE,
) as AdministrativeGenderCode[];

/** Códigos admitidos, para los validadores `@IsIn` de los DTO. */
export const BIRTH_SEX_CODES = Object.keys(
  BIRTH_SEX_CONCEPT_BY_CODE,
) as BirthSexCode[];
