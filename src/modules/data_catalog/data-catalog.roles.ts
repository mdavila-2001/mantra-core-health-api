/**
 * Quién puede hacer qué en el catálogo. Se separa leer metadatos, proponer,
 * revisar y escanear: ninguno implica los demás (SUPERADMIN los pasa todos por
 * el comodín de `RolesGuard`, pero la segregación de revisión se comprueba por
 * identidad en el servicio, así que tampoco puede aprobarse a sí mismo).
 *
 * Ver meta del catálogo no concede leer filas de negocio: este módulo no
 * expone datos, sólo estructura y semántica.
 */
export const CATALOG_READ_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DPO',
] as const;

/** Redactar fichas y añadir evidencia. */
export const CATALOG_EDIT_ROLES = [
  'SECURITY_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;

/** Aprobar o rechazar fichas. */
export const CATALOG_REVIEW_ROLES = [
  'SECURITY_ADMIN',
  'GOVERNANCE_ADMIN',
  'DPO',
] as const;

/** Lanzar y cancelar escaneos técnicos. */
export const CATALOG_SCAN_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;
