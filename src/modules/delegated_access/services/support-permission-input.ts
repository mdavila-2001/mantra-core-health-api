import {
  SUPPORT_PERMISSION_INPUT_CODES,
  isSupportAtom,
  permissionAtomId,
  supportPermissionId,
  type SupportActionCode,
} from '../domain';

/**
 * Id de la fila de `authz.permissions` de un código que las escrituras aceptan:
 * un átomo del catálogo o uno de los 15 alias heredados. Los alias NO se expanden
 * al escribir: se guardan tal cual (`origin: LEGACY`) hasta que la organización
 * corre la normalización (`normalize-legacy`), así lo ya concedido no cambia.
 *
 * @param code - Átomo o alias.
 * @returns El id determinista de la fila de permiso.
 */
export function permissionIdOfInput(code: string): string {
  return isSupportAtom(code)
    ? permissionAtomId(code)
    : supportPermissionId(code as SupportActionCode);
}

/** ¿El código es uno de los 73 átomos o de los 15 alias? */
export function isPermissionInput(code: string): boolean {
  return SUPPORT_PERMISSION_INPUT_CODES.includes(code);
}
