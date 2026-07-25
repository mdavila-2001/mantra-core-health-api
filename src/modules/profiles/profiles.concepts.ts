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
export const { seeds: PROFILES_CONCEPT_SEEDS, ids: PROF } = defineModuleConcepts('profiles', {
  // Ciclo de vida de la persona
  PERSON_ACTIVE: { code: 'PERSON_ACTIVE', display: 'Person active' },
  PERSON_INACTIVE: { code: 'PERSON_INACTIVE', display: 'Person inactive' },
  PERSON_MERGED: { code: 'PERSON_MERGED', display: 'Person merged' },
  VITAL_ALIVE: { code: 'VITAL_ALIVE', display: 'Vital status alive' },
  VITAL_DECEASED: { code: 'VITAL_DECEASED', display: 'Vital status deceased' },

  // Tipo y estado del perfil de persona
  PROFILE_TYPE_PATIENT: { code: 'PROFILE_PATIENT', display: 'Patient profile type' },
  PROFILE_TYPE_PRACTITIONER: { code: 'PROFILE_PRACTITIONER', display: 'Practitioner profile type' },
  PROFILE_ACTIVE: { code: 'PROFILE_ACTIVE', display: 'Profile active' },

  // Estado de vinculación (MPI) del paciente
  LINKAGE_UNLINKED: { code: 'LINKAGE_UNLINKED', display: 'Record unlinked' },
  LINKAGE_LINKED: { code: 'LINKAGE_LINKED', display: 'Record linked' },
  LINKAGE_MERGED: { code: 'LINKAGE_MERGED', display: 'Record merged' },

  // Vínculo persona-cuenta de portal
  ACCOUNT_LINK_SELF: { code: 'ACCOUNT_LINK_SELF', display: 'Self account link type' },
  ACCOUNT_LINK_ACTIVE: { code: 'ACCOUNT_LINK_ACTIVE', display: 'Account link active' },
  ACCOUNT_LINK_SUPERSEDED: { code: 'ACCOUNT_LINK_SUPERSEDED', display: 'Account link superseded' },
  ACCOUNT_LINK_REVOKED: { code: 'ACCOUNT_LINK_REVOKED', display: 'Account link revoked' },
  ACCOUNT_LINK_VERIFIED: { code: 'ACCOUNT_LINK_VERIFIED', display: 'Account link verified' },

  // Profesional de salud
  PRACT_CATEGORY_GENERAL: { code: 'PRACT_CATEGORY_GENERAL', display: 'General practitioner category' },
  PRACT_VERIF_PENDING: { code: 'PRACT_VERIF_PENDING', display: 'Practitioner verification pending' },
  PRACT_VERIF_VERIFIED: { code: 'PRACT_VERIF_VERIFIED', display: 'Practitioner verified' },
  PRACTICE_ONBOARDING: { code: 'PRACTICE_ONBOARDING', display: 'Practice onboarding' },
  PRACTICE_ACTIVE: { code: 'PRACTICE_ACTIVE', display: 'Practice active' },

  // Autorización jurisdiccional (licencia)
  JURISDICTION_NATIONAL: { code: 'JURISDICTION_NATIONAL', display: 'National jurisdiction' },
  AUTH_PENDING: { code: 'AUTH_PENDING', display: 'Authorization pending' },
  AUTH_ACTIVE: { code: 'AUTH_ACTIVE', display: 'Authorization active' },
  AUTH_EXPIRED: { code: 'AUTH_EXPIRED', display: 'Authorization expired' },

  // Credenciales profesionales
  CREDENTIAL_TYPE_DEGREE: { code: 'CREDENTIAL_TYPE_DEGREE', display: 'Academic degree credential' },
  CRED_PENDING: { code: 'CRED_PENDING', display: 'Credential pending verification' },
  CRED_VERIFIED: { code: 'CRED_VERIFIED', display: 'Credential verified' },
  CRED_REJECTED: { code: 'CRED_REJECTED', display: 'Credential rejected' },

  // Especialidades
  SPECIALTY_GENERAL: { code: 'SPECIALTY_GENERAL', display: 'General medicine specialty' },
  SPECIALTY_ROLE_PRIMARY: { code: 'SPECIALTY_ROLE_PRIMARY', display: 'Primary specialty role' },
  SPEC_VERIF_PENDING: { code: 'SPEC_VERIF_PENDING', display: 'Specialty verification pending' },
  SPEC_VERIF_VERIFIED: { code: 'SPEC_VERIF_VERIFIED', display: 'Specialty verified' },

  // Idiomas clínicos
  LANGUAGE_SPANISH: { code: 'LANGUAGE_SPANISH', display: 'Spanish clinical language' },
  LANG_PROFICIENCY_NATIVE: { code: 'LANG_PROFICIENCY_NATIVE', display: 'Native language proficiency' },

  // Vínculos de identidad externa (MPI)
  IDENTITY_LINK_MPI: { code: 'IDENTITY_LINK_MPI', display: 'MPI identity link type' },
  IDENTITY_UNVERIFIED: { code: 'IDENTITY_UNVERIFIED', display: 'Identity link unverified' },
  IDENTITY_VERIFIED: { code: 'IDENTITY_VERIFIED', display: 'Identity link verified' },

  // Fusión de pacientes
  MERGE_REASON_DUPLICATE: { code: 'MERGE_REASON_DUPLICATE', display: 'Duplicate patient merge reason' },
  MERGE_APPROVED: { code: 'MERGE_APPROVED', display: 'Merge decision approved' },
  MERGE_REVERSED: { code: 'MERGE_REVERSED', display: 'Merge decision reversed' },

  // Personas relacionadas / contactos
  RELATIONSHIP_GUARDIAN: { code: 'RELATIONSHIP_GUARDIAN', display: 'Legal guardian relationship' },
  RELATED_ACTIVE: { code: 'RELATED_ACTIVE', display: 'Related person active' },

  // Proxies de portal
  PROXY_ACTIVE: { code: 'PROXY_ACTIVE', display: 'Portal proxy active' },
  PROXY_REVOKED: { code: 'PROXY_REVOKED', display: 'Portal proxy revoked' },
});
