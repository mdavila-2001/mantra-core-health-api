/* ============================================================================
    Derivación pura de «módulo · recurso · acción» a partir de una ruta HTTP.

    Sin imports a propósito: la usa el servicio del catálogo por módulo en tiempo de
    ejecución y el generador del informe `docs/trabajo/2026-10-31-visibilidad-rbac/
    evidencia/scan-rbac-por-modulo.cjs` (la transpila tal cual), de modo que el informe
    y el endpoint no pueden discrepar.

    NO inventa permisos: propone un código `<modulo>.<recurso>.<accion>` que sólo es una
    SUGERENCIA derivada de lo que el código ya expone. Sembrarlo es una decisión humana.
    ========================================================================== */

/** Las acciones canónicas de un permiso fino (sólo las que el módulo realmente ofrece). */
export const CANONICAL_ACTIONS = [
  'read',
  'list',
  'create',
  'update',
  'delete',
  'export',
  'approve',
  'reject',
  'assign',
  'configure',
  'audit',
] as const;
export type CanonicalAction = (typeof CANONICAL_ACTIONS)[number];

/** Una acción que no tiene equivalente canónico (p. ej. `EXECUTE` sembrado a mano). */
export const OTHER_ACTION = 'other' as const;
export type PermissionActionKey = CanonicalAction | typeof OTHER_ACTION;

export function isCanonicalAction(value: string): value is CanonicalAction {
  return (CANONICAL_ACTIONS as readonly string[]).includes(value);
}

/** Segmentos de ruta que no nombran ningún recurso. */
const NOISE_SEGMENTS: ReadonlySet<string> = new Set([
  'admin',
  'internal',
  'api',
  'v1',
  'v2',
  'public',
  'me',
]);

/** Último segmento que fija la acción (se evalúa antes que el verbo HTTP). */
const VERB_ACTIONS: Readonly<Record<string, CanonicalAction>> = {
  export: 'export',
  approve: 'approve',
  approval: 'approve',
  authorize: 'approve',
  reject: 'reject',
  deny: 'reject',
  decline: 'reject',
  assign: 'assign',
  unassign: 'assign',
  reassign: 'assign',
  configure: 'configure',
  config: 'configure',
  settings: 'configure',
  audit: 'audit',
  'audit-log': 'audit',
  'audit-trail': 'audit',
};

/** `POST` que en realidad sólo lee (búsquedas, simulaciones, validaciones). */
const READ_ONLY_POST_SEGMENTS: ReadonlySet<string> = new Set([
  'search',
  'query',
  'evaluate',
  'check',
  'preview',
  'simulate',
  'validate',
  'lookup',
  'resolve',
  'dry-run',
]);

/** Alias de nombres de módulo (sub-módulos de Nest que comparten carpeta con otro). */
const MODULE_ALIASES: Readonly<Record<string, string>> = {
  directory_authorization: 'directory',
  identity_evidence_lifecycle: 'identity_assurance',
  insurance_patient_settlement: 'insurance',
  public_catalog: 'public',
};

/** `PharmaLabModule` → `pharma_lab`. Un nombre sin sufijo `Module` se normaliza igual. */
export function moduleKeyFromClassName(className: string): string {
  const base = className.replace(/Module$/, '');
  const snake = base
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
  return MODULE_ALIASES[snake] ?? snake;
}

const isParam = (segment: string): boolean => segment.startsWith(':');
const slug = (segment: string): string =>
  segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** Un segmento «es» el módulo si coincide con su clave, en singular o plural. */
function isModuleSegment(segment: string, moduleKey: string): boolean {
  const s = slug(segment);
  return s === moduleKey || `${s}s` === moduleKey || s === `${moduleKey}s`;
}

export interface DerivedRoute {
  /** Recurso en snake_case (nunca vacío: cae en el nombre del módulo). */
  readonly resource: string;
  readonly action: CanonicalAction;
  /** `true` si la ruta sólo opera sobre el sujeto del token (`/me/...`). */
  readonly selfService: boolean;
  /** `true` si la acción cambia estado. */
  readonly mutating: boolean;
}

/**
 * Deriva recurso y acción de `(método, plantilla)`.
 *
 * Recurso: los segmentos literales de la plantilla sin ruido (`admin`, `internal`, `v1`, `me`…)
 * ni el propio módulo; se conservan los dos últimos, unidos con `_`.
 * Acción: un verbo final conocido manda (`/:id/approve` → `approve`); si no, el verbo HTTP
 * (`GET` con id → `read`, `GET` de colección → `list`, `POST` de alta → `create`,
 * `POST /:id/<verbo>` → `update`, `PUT`/`PATCH` → `update`, `DELETE` → `delete`).
 */
export function deriveRoute(
  method: string,
  template: string,
  moduleKey: string,
): DerivedRoute {
  const segments = template.split('/').filter((s) => s.length > 0);
  const selfService = segments.includes('me');
  const literal = segments.filter((s) => !isParam(s));
  const last = segments[segments.length - 1] ?? '';
  const lastLiteral = last !== '' && !isParam(last) ? last.toLowerCase() : '';
  const verb = lastLiteral !== '' ? VERB_ACTIONS[lastLiteral] : undefined;
  const verbMethod = method.toUpperCase();

  // Un verbo final sólo fija la acción si hay algo más que nombrar como recurso.
  const nouns = literal
    .filter((s) => !NOISE_SEGMENTS.has(s.toLowerCase()))
    .filter((s) => !isModuleSegment(s, moduleKey));
  const resourceSegments =
    verb !== undefined || READ_ONLY_POST_SEGMENTS.has(lastLiteral)
      ? nouns.slice(0, -1)
      : nouns;
  const resource =
    resourceSegments.slice(-2).map(slug).filter(Boolean).join('_') || moduleKey;

  let action: CanonicalAction;
  if (verb !== undefined && (verbMethod !== 'DELETE' || verb === 'assign')) {
    action = verb;
  } else if (verbMethod === 'GET' || verbMethod === 'HEAD') {
    const trailingParam = last !== '' && isParam(last);
    action = trailingParam || !/[^su]s$/.test(lastLiteral) ? 'read' : 'list';
  } else if (verbMethod === 'POST') {
    // `POST` a una colección (plural) da de alta; `POST` a un verbo/estado bajo un id
    // (`/:id/suspend`, `/:id/status`) cambia el estado de algo que ya existe.
    const plural = /[^su]s$/.test(lastLiteral);
    const underId = segments.some(isParam) && lastLiteral !== '';
    action = READ_ONLY_POST_SEGMENTS.has(lastLiteral)
      ? 'read'
      : !plural && underId
        ? 'update'
        : 'create';
  } else if (verbMethod === 'DELETE') {
    action = 'delete';
  } else {
    action = 'update';
  }
  return {
    resource,
    action,
    selfService,
    mutating: !(action === 'read' || action === 'list' || action === 'audit'),
  };
}

/** El código sugerido `<modulo>.<recurso>.<acción>`. */
export function proposedPermissionCode(
  moduleKey: string,
  resource: string,
  action: CanonicalAction,
): string {
  return `${moduleKey}.${resource}.${action}`;
}

/** Acción a partir del concepto sembrado (`READ`, `WRITE`…), o `other` si no hay equivalente. */
export function actionFromLegacy(legacy: string | null): PermissionActionKey {
  switch (legacy) {
    case 'READ':
      return 'read';
    case 'CREATE':
      return 'create';
    case 'WRITE':
      return 'update';
    case 'DELETE':
      return 'delete';
    case 'APPROVE':
      return 'approve';
    default:
      return OTHER_ACTION;
  }
}

export interface PermissionPlacement {
  readonly module: string;
  readonly resource: string;
  readonly action: PermissionActionKey;
  /** El código ya tiene la forma `<modulo>.<recurso>.<acción>`. */
  readonly canonical: boolean;
}

/** Módulo virtual para los permisos cuyo código y recurso no nombran ningún módulo. */
export const UNASSIGNED_MODULE = 'sin_modulo';

const CANONICAL_CODE = /^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)\.([a-z]+)$/;

/**
 * Dónde cae un permiso ya existente: por su código si tiene la forma canónica; si no, por el
 * prefijo de su `resource` (`diagnostics.diagnostic_report` → módulo `diagnostics`) y la acción
 * del concepto sembrado. Si ninguno nombra un módulo, va al módulo virtual {@link UNASSIGNED_MODULE}.
 */
export function placePermission(input: {
  readonly code: string;
  readonly resource: string;
  readonly legacyAction: string | null;
}): PermissionPlacement {
  const m = CANONICAL_CODE.exec(input.code);
  if (m && isCanonicalAction(m[3])) {
    return {
      module: m[1],
      resource: m[2],
      action: m[3],
      canonical: true,
    };
  }
  const action = actionFromLegacy(input.legacyAction);
  const dot = input.resource.indexOf('.');
  if (dot > 0) {
    return {
      module: slug(input.resource.slice(0, dot)),
      resource: slug(input.resource.slice(dot + 1)) || 'general',
      action,
      canonical: false,
    };
  }
  return {
    module: UNASSIGNED_MODULE,
    resource: slug(input.resource) || 'general',
    action,
    canonical: false,
  };
}
