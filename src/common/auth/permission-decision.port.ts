/**
 * Contrato entre `RequirePermissionGuard` (transversal, en `common/auth`) y el
 * PDP de `authz` (`AuthzPdpService`).
 *
 * `common` no importa módulos de dominio: la guarda pide la decisión a través
 * de este puerto y `AuthzModule` lo provee con un adaptador fino sobre el PDP
 * existente (`AuthzPermissionDecisionPoint`). La lógica de decisión
 * (deny-overrides, herencia de roles, excepciones de usuario, grants por
 * recurso, políticas ABAC) vive **sólo** en el PDP; aquí no se repite nada.
 */

/** Token DI del punto de decisión de permisos finos. */
export const PERMISSION_DECISION_POINT = Symbol('PERMISSION_DECISION_POINT');

/** Acciones del catálogo `authz.permissions` (mismas que `PERMISSION_ACTIONS`). */
export type PdpPermissionAction =
  'READ' | 'WRITE' | 'CREATE' | 'DELETE' | 'EXECUTE' | 'APPROVE';

/** Lo que la guarda le pregunta al PDP. */
export interface PermissionQuery {
  /** `iam.users.id` del actor. */
  readonly userId: string;
  /** Tenant resuelto del request (o el único del actor). */
  readonly tenantId: string;
  /**
   * Recurso del permiso en `authz.permissions.resource`. Por convención es el
   * propio código `modulo.recurso.accion` (misma convención que ya usa
   * `bulk_import`: `resource = código`).
   */
  readonly resource: string;
  /** Acción del catálogo con la que se sembró el permiso. */
  readonly action: PdpPermissionAction;
  /** Id del recurso concreto, para los grants por recurso del PDP. */
  readonly resourceId?: string;
}

/** Respuesta del PDP reducida a lo que la guarda necesita. */
export interface PermissionVerdict {
  readonly decision: 'PERMIT' | 'DENY';
  /** Motivo legible del PDP (para el log; nunca se devuelve al cliente). */
  readonly reason: string;
}

/** Puerto que implementa `authz`. */
export interface PermissionDecisionPoint {
  decide(
    query: PermissionQuery,
    actor: { readonly id: string; readonly roles: string[] },
  ): Promise<PermissionVerdict>;
}

/**
 * Modo de aplicación de `@RequirePermission`.
 *
 * - `off`: la guarda no consulta el PDP (el decorador queda como documentación).
 * - `shadow`: decide `@Roles` (comportamiento actual); el PDP se consulta en
 *   segundo plano y la discrepancia se registra en el log. **Nunca** bloquea ni
 *   añade latencia.
 * - `enforce`: `@Roles` **y** permiso. PDP caído o no registrado ⇒ 503
 *   (fail-closed); `DENY` ⇒ 403.
 */
export type PermissionMode = 'off' | 'shadow' | 'enforce';

/** Modo por defecto del piloto. */
export const DEFAULT_PERMISSION_MODE: PermissionMode = 'shadow';

/** Variable de entorno global del modo. */
export const PERMISSION_MODE_ENV = 'AUTHZ_PERMISSION_MODE';

const MODES: ReadonlySet<string> = new Set(['off', 'shadow', 'enforce']);

/** Nombre de la variable que fija el modo de un módulo (`AUTHZ_PERMISSION_MODE__ACCOUNTING`). */
export function modulePermissionModeEnv(moduleSegment: string): string {
  return `${PERMISSION_MODE_ENV}__${moduleSegment.toUpperCase()}`;
}

/** Resultado de resolver el modo, con su procedencia (para el log). */
export interface ResolvedPermissionMode {
  readonly mode: PermissionMode;
  readonly source: 'module-env' | 'global-env' | 'default';
  /** Valor no reconocido que se ignoró, si lo hubo. */
  readonly invalid?: string;
}

function parseMode(
  raw: string | undefined,
): PermissionMode | 'invalid' | undefined {
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === '') return undefined;
  return MODES.has(value) ? (value as PermissionMode) : 'invalid';
}

/**
 * Resuelve el modo de un código de permiso.
 *
 * Prioridad: variable del módulo (primer segmento del código) > variable
 * global > `shadow`. Un valor no reconocido se ignora (cae al siguiente nivel)
 * y se informa en `invalid`: un error de tipeo nunca abre a `off` ni cierra a
 * `enforce` por sorpresa.
 */
export function resolvePermissionMode(
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedPermissionMode {
  const moduleSegment = code.split('.')[0] ?? '';
  let invalid: string | undefined;
  const fromModule = parseMode(env[modulePermissionModeEnv(moduleSegment)]);
  if (fromModule && fromModule !== 'invalid') {
    return { mode: fromModule, source: 'module-env' };
  }
  if (fromModule === 'invalid') {
    invalid = env[modulePermissionModeEnv(moduleSegment)];
  }
  const fromGlobal = parseMode(env[PERMISSION_MODE_ENV]);
  if (fromGlobal && fromGlobal !== 'invalid') {
    return {
      mode: fromGlobal,
      source: 'global-env',
      ...(invalid ? { invalid } : {}),
    };
  }
  if (fromGlobal === 'invalid') invalid ??= env[PERMISSION_MODE_ENV];
  return {
    mode: DEFAULT_PERMISSION_MODE,
    source: 'default',
    ...(invalid ? { invalid } : {}),
  };
}

/**
 * Acción del catálogo para el último segmento del código.
 *
 * El recurso que se consulta es el código completo, así que dos códigos con la
 * misma acción (`…approve` y `…reject` → `APPROVE`) siguen siendo permisos
 * distintos. Las acciones canónicas sin equivalente en el catálogo
 * (`assign`, `configure`, `export`, `audit`) van a `EXECUTE`.
 */
export function pdpActionForCode(code: string): PdpPermissionAction {
  const verb = code.slice(code.lastIndexOf('.') + 1);
  switch (verb) {
    case 'read':
    case 'list':
      return 'READ';
    case 'create':
      return 'CREATE';
    case 'update':
      return 'WRITE';
    case 'delete':
      return 'DELETE';
    case 'approve':
    case 'reject':
      return 'APPROVE';
    default:
      return 'EXECUTE';
  }
}

/** Clave de metadata con el permiso fino exigido por un handler. */
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

/** Forma de un código de permiso fino: `modulo.recurso.accion` (minúsculas). */
export const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){2,}$/;

/** Opciones de `@RequirePermission`. */
export interface RequirePermissionOptions {
  /**
   * Parámetro de ruta con el id del recurso concreto (p. ej. `'id'`). Si viene
   * y es un UUID, se pasa al PDP como `resourceId` para que cuenten los grants
   * por recurso (`authz.resource_scope_grants`). No carga nada.
   */
  readonly resourceIdParam?: string;
  /**
   * Acción del catálogo con la que se sembró el permiso, si no es la que se
   * deriva del último segmento del código (ver `pdpActionForCode`).
   */
  readonly pdpAction?: PdpPermissionAction;
}

/** Lo que guarda el decorador en la metadata. */
export interface RequiredPermissionMetadata extends RequirePermissionOptions {
  readonly code: string;
}
