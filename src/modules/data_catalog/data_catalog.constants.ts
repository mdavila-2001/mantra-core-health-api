/**
 * Roles del portal administrativo de datos.
 *
 * Todos son roles sembrados (`data_catalog.roles.ts`) salvo `SECURITY_ADMIN`, que es global de
 * `iam`, y `PLATFORM_ADMIN`, que se siembra desde el modelo. La API es la autoridad: el frontend
 * sólo evita llevar a alguien a una pantalla que devolvería 403.
 */
export const PORTAL_READ_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DPO',
  'AUDITOR',
  'DATA_STEWARD',
] as const;

/**
 * Roles que pueden escribir en el catálogo (ficha, evidencia, revisión y escaneo).
 *
 * Leer el catálogo no autoriza a cambiarlo: un DPO, un auditor o un administrador de seguridad
 * lo consultan, pero la voz sobre qué significa una tabla es de gobierno, plataforma de datos y
 * los custodios.
 */
export const CATALOG_WRITE_ROLES = [
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DATA_STEWARD',
] as const;

/** Variable de entorno con el directorio de los JSON del inventario. */
export const INVENTARIO_DIR_ENV = 'INVENTARIO_DIR';

/** Tope de elementos por página de los listados del portal. */
export const MAX_PAGE_SIZE = 200;

/** Tamaño de página cuando el cliente no pide uno. */
export const DEFAULT_PAGE_SIZE = 50;
