import { CONCEPTS } from '../../../common';

/** Códigos de rol global aceptados por la API. */
export type RoleCode = 'USER' | 'SECURITY_ADMIN' | 'SUPERADMIN';

/** Código de rol → concept id (`role_concept_id`). */
export const ROLE_CONCEPT_BY_CODE: Readonly<Record<RoleCode, string>> = {
  USER: CONCEPTS.ROLE_USER,
  SECURITY_ADMIN: CONCEPTS.ROLE_SECURITY_ADMIN,
  SUPERADMIN: CONCEPTS.ROLE_SUPERADMIN,
};

/** Concept id → código de rol (para construir el `roles` del JWT). */
export const ROLE_CODE_BY_CONCEPT: Readonly<Record<string, RoleCode>> = {
  [CONCEPTS.ROLE_USER]: 'USER',
  [CONCEPTS.ROLE_SECURITY_ADMIN]: 'SECURITY_ADMIN',
  [CONCEPTS.ROLE_SUPERADMIN]: 'SUPERADMIN',
};

/** Traduce una lista de `role_concept_id` a códigos, descartando desconocidos. */
export function conceptIdsToRoleCodes(conceptIds: string[]): RoleCode[] {
  return conceptIds
    .map((id) => ROLE_CODE_BY_CONCEPT[id])
    .filter((code): code is RoleCode => code !== undefined);
}
