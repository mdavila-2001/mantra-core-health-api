/**
 * Roles que existen sin sembrarse en `authz.roles`: los globales de `iam`, la cuenta de servicio y
 * los que el login deriva de una membresía. La deriva de permisos los descuenta de «usados y no
 * sembrados».
 */
export interface PlatformRoleCodesPort {
  platformRoleCodes(): readonly string[];
}

export const PLATFORM_ROLE_CODES_PORT = Symbol('PLATFORM_ROLE_CODES_PORT');
