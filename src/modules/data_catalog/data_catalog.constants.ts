/**
 * Roles del portal administrativo de datos.
 *
 * Son los cinco que el frontend exige para llegar a `administration/data-catalog`
 * (`navigation.map.ts`). La API es la autoridad: el frontend sólo evita llevar a
 * alguien a una pantalla que devolvería 403.
 */
export const PORTAL_READ_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DPO',
] as const;

/**
 * Roles que pueden escribir en el catálogo (ficha, evidencia, revisión y escaneo).
 *
 * Leer el catálogo no autoriza a cambiarlo: un DPO o un administrador de seguridad
 * lo consultan, pero la voz sobre qué significa una tabla es de gobierno y
 * plataforma de datos.
 */
export const CATALOG_WRITE_ROLES = [
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;

/** Variable de entorno con el directorio de los JSON del inventario. */
export const INVENTARIO_DIR_ENV = 'INVENTARIO_DIR';

/** Tope de elementos por página de los listados del portal. */
export const MAX_PAGE_SIZE = 200;

/** Tamaño de página cuando el cliente no pide uno. */
export const DEFAULT_PAGE_SIZE = 50;
