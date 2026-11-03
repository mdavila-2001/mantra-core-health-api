import { TENANT_TYPE_CODES } from '../directory/directory.concepts';

/**
 * Rol que administra el catálogo y las reglas de visibilidad. `SUPERADMIN` entra por el
 * comodín de `RolesGuard`; cualquier otro rol recibe 403. La visibilidad no es
 * autorización: este rol gobierna lo que se PRESENTA, no lo que se puede hacer.
 */
export const UI_VISIBILITY_ADMIN_ROLES = ['SECURITY_ADMIN'] as const;

export const UI_ELEMENT_KINDS = [
  'MODULE',
  'MENU_SECTION',
  'SCREEN',
  'SECTION',
  'WIDGET',
  'FIELD',
  'ACTION',
] as const;
export type UiElementKind = (typeof UI_ELEMENT_KINDS)[number];

export const UI_ELEMENT_SOURCES = ['CODE', 'ADMIN'] as const;
export type UiElementSource = (typeof UI_ELEMENT_SOURCES)[number];

export const UI_ELEMENT_STATUSES = ['ACTIVE', 'RETIRED'] as const;
export type UiElementStatus = (typeof UI_ELEMENT_STATUSES)[number];

export const UI_RULE_EFFECTS = ['SHOW', 'HIDE'] as const;
export type UiRuleEffect = (typeof UI_RULE_EFFECTS)[number];

export const UI_RULE_SUBJECT_TYPES = [
  'USER',
  'TENANT',
  'ROLE',
  'ORG_TYPE',
  'ALL',
] as const;
export type UiRuleSubjectType = (typeof UI_RULE_SUBJECT_TYPES)[number];

/** Misma expresión que el CHECK `ck_ui_visibility_elements_key` del modelo. */
export const UI_ELEMENT_KEY_PATTERN =
  /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$/;
export const UI_ELEMENT_KEY_MAX = 160;
export const UI_MODULE_CODE_MAX = 80;
export const UI_LABEL_MAX = 200;
export const UI_DESCRIPTION_MAX = 500;
export const UI_SUBJECT_ID_MAX = 160;

/** Motivo obligatorio de una regla (CONTRATO.md §Reglas). */
export const UI_REASON_MIN = 10;
export const UI_REASON_MAX = 500;

/** Tope del lote de `elements/sync`: el registro del front cabe de sobra y un lote mayor es un error. */
export const UI_SYNC_MAX_ELEMENTS = 2000;

export const UI_DEFAULT_PAGE_SIZE = 50;
export const UI_MAX_PAGE_SIZE = 200;

/** Cabecera de bloqueo optimista del `PATCH` de reglas. */
export const IF_MATCH_HEADER = 'if-match';

/**
 * Tipos de organización válidos para una regla `ORG_TYPE`: los códigos de
 * `TENANT_TYPE_CONCEPT_BY_CODE` (`CLINIC`, `PHARMACY`…), los mismos que el token ya publica en
 * `tenantTypes`. Se reutilizan y no se repiten a mano.
 */
export const UI_ORG_TYPE_CODES: readonly string[] = TENANT_TYPE_CODES;

/**
 * Prefijos de clave de las pantallas con las que se GOBIERNA la visibilidad (portal de administración
 * y de superadministración). Protección anti-bloqueo OPERATIVO, no de seguridad: si una regla `HIDE`
 * pudiera ocultárselas a quien administra las reglas, nadie podría volver a mostrarlas desde la
 * interfaz. La visibilidad no es autorización: esto sólo evita que un administrador se quede fuera
 * de su propia consola; la API sigue autorizando cada petición.
 *
 * Un elemento está protegido si su clave empieza por el prefijo, o es el propio nodo de sección
 * (el prefijo sin el punto final).
 */
export const UI_PROTECTED_KEY_PREFIXES: readonly string[] = [
  'nav.superadmin.',
  'nav.administration.',
];

/** Roles para los que los elementos protegidos quedan SIEMPRE visibles. */
export const UI_PROTECTED_ROLES: readonly string[] = [
  'SUPERADMIN',
  'SECURITY_ADMIN',
];

/** ¿La clave es de una pantalla de gobierno de la visibilidad? */
export function isProtectedElementKey(key: string): boolean {
  return UI_PROTECTED_KEY_PREFIXES.some(
    (prefix) => key.startsWith(prefix) || key === prefix.slice(0, -1),
  );
}

/** ¿Alguno de los roles es de administración (SUPERADMIN o SECURITY_ADMIN)? */
export function hasProtectedRole(roles: readonly string[]): boolean {
  return roles.some((role) => UI_PROTECTED_ROLES.includes(role));
}
