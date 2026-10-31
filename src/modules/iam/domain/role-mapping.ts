import { CONCEPTS } from '../../../common/constants/concepts';

/**
 * Códigos de rol global aceptados por la API.
 *
 * `PATIENT` es el rol del titular sobre sus propios datos: lo concede el
 * auto-registro y es el que exigen los endpoints de autoservicio del portal
 * (`@Roles(..., 'PATIENT')` en scheduling). Sin él en esta lista, el claim
 * `roles` del token nunca podría contenerlo -`conceptIdsToRoleCodes` descarta
 * lo desconocido- y todo el portal del paciente respondería 403.
 *
 * `SUPPORT_STAFF` es la secretaria (personal de apoyo hospitalario): lo da su
 * alta y es el que exigen sus rutas `/me/support-*`. Qué hospitales, doctores y
 * pisos ve lo deciden sus vínculos aceptados, no el rol.
 */
export type RoleCode =
  | 'USER'
  | 'SECURITY_ADMIN'
  | 'SUPERADMIN'
  | 'PATIENT'
  | 'PRACTITIONER'
  | 'CLINICIAN'
  | 'SUPPORT_STAFF';

/** Código de rol → concept id (`role_concept_id`). */
export const ROLE_CONCEPT_BY_CODE: Readonly<Record<RoleCode, string>> = {
  USER: CONCEPTS.ROLE_USER,
  SECURITY_ADMIN: CONCEPTS.ROLE_SECURITY_ADMIN,
  SUPERADMIN: CONCEPTS.ROLE_SUPERADMIN,
  PATIENT: CONCEPTS.ROLE_PATIENT,
  PRACTITIONER: CONCEPTS.ROLE_PRACTITIONER,
  CLINICIAN: CONCEPTS.ROLE_CLINICIAN,
  SUPPORT_STAFF: CONCEPTS.ROLE_SUPPORT_STAFF,
};

/** Concept id → código de rol (para construir el `roles` del JWT). */
export const ROLE_CODE_BY_CONCEPT: Readonly<Record<string, RoleCode>> = {
  [CONCEPTS.ROLE_USER]: 'USER',
  [CONCEPTS.ROLE_SECURITY_ADMIN]: 'SECURITY_ADMIN',
  [CONCEPTS.ROLE_SUPERADMIN]: 'SUPERADMIN',
  [CONCEPTS.ROLE_PATIENT]: 'PATIENT',
  [CONCEPTS.ROLE_PRACTITIONER]: 'PRACTITIONER',
  [CONCEPTS.ROLE_CLINICIAN]: 'CLINICIAN',
  [CONCEPTS.ROLE_SUPPORT_STAFF]: 'SUPPORT_STAFF',
};

/** Traduce una lista de `role_concept_id` a códigos, descartando desconocidos. */
export function conceptIdsToRoleCodes(conceptIds: string[]): RoleCode[] {
  return conceptIds
    .map((id) => ROLE_CODE_BY_CONCEPT[id])
    .filter((code): code is RoleCode => code !== undefined);
}
