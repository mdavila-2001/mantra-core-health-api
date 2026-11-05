/**
 * Rol de la cuenta de servicio de los workers: lo firma el worker, no se asigna ni se siembra
 * (ver `RoleCode`), y las rutas `/internal/*` lo exigen.
 */
export const SYSTEM_ROLE = 'SYSTEM';

/**
 * Roles que el login deriva de una membresía y que por eso no se asignan ni se siembran:
 * `PHARMACY_STAFF` se agrega al token de quien tiene una membresía activa en un tenant de tipo
 * `PHARMACY` (`withPharmacyStaffRole` en `iam-auth.service.ts`). Sembrarlo permitiría asignarlo a
 * mano a alguien sin esa membresía.
 */
export const DERIVED_RUNTIME_ROLES: readonly string[] = ['PHARMACY_STAFF'];
