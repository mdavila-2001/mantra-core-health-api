import { isIP } from 'node:net';
import type {
  AuditIdSource,
  AuditTrailOptions,
} from './audit-trail.decorators';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Prefijo de las acciones que el interceptor deriva de la ruta. */
export const ROUTE_ACTION_PREFIX = 'HTTP';

/** `true` si el valor es un UUID: `entity_id`, `resource_id` y los FK lo exigen. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Dirección de origen apta para la columna `inet`, o `undefined`. Express puede
 * entregar IPv4 mapeada en IPv6 (`::ffff:10.0.0.1`), que `inet` acepta tal cual;
 * lo que no sea una IP (vacío, nombre de host) no se sella.
 */
export function toInetAddress(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim();
  return isIP(candidate) === 0 ? undefined : candidate;
}

/** Une los segmentos de controlador y handler en una plantilla `/a/:b/c`. */
export function joinRouteTemplate(
  controllerPath: string,
  handlerPath: string,
): string {
  const joined = [controllerPath, handlerPath]
    .flatMap((part) => part.split('/'))
    .filter((segment) => segment.length > 0)
    .join('/');
  return `/${joined}`;
}

/** Identidad del sello: qué se hizo, sobre qué y sobre cuál. */
export interface RouteAuditIdentity {
  readonly action: string;
  readonly entity: string;
  readonly entityId?: string;
}

/** Datos de la petición resuelta que alimentan la identidad derivada. */
export interface RouteAuditInput {
  readonly method: string;
  readonly routeTemplate: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly result?: unknown;
  readonly options?: AuditTrailOptions;
}

const PARAM_SEGMENT = /^:(\w+)/;

function fieldOf(value: unknown, field: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  return (value as Record<string, unknown>)[field];
}

function readIdSource(
  source: AuditIdSource,
  params: Readonly<Record<string, unknown>>,
  result: unknown,
): string | undefined {
  const [kind, name] = source.split(':') as ['param' | 'result', string];
  const value = kind === 'param' ? params[name] : fieldOf(result, name);
  return isUuid(value) ? value : undefined;
}

/**
 * Parámetro de ruta que identifica el recurso afectado: `:id` si existe y es
 * UUID; si no, el ÚLTIMO parámetro UUID (en `/patients/:patientId/notes/:noteId`
 * el recurso tocado es la nota, no el paciente).
 */
function pickRouteParam(
  segments: readonly string[],
  params: Readonly<Record<string, unknown>>,
): string | undefined {
  const names = segments
    .map((segment) => PARAM_SEGMENT.exec(segment)?.[1])
    .filter((name): name is string => name !== undefined);
  if (names.includes('id') && isUuid(params.id)) return 'id';
  return [...names].reverse().find((name) => isUuid(params[name]));
}

/** Último segmento estático antes del índice dado, en snake_case. */
function staticSegmentBefore(
  segments: readonly string[],
  index: number,
): string | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const segment = segments[i];
    if (!PARAM_SEGMENT.test(segment) && !segment.includes('*')) {
      return segment.replace(/[^A-Za-z0-9]+/g, '_').toLowerCase();
    }
  }
  return undefined;
}

/**
 * Identidad del sello de una ruta que muta. Con `@AuditTrail()` manda el nombre
 * de negocio; sin él se deriva de la ruta, que es única por construcción (Nest
 * no admite dos handlers con el mismo verbo y plantilla), así que dos módulos no
 * pueden colisionar en una acción derivada.
 */
export function deriveRouteAuditIdentity(
  input: RouteAuditInput,
): RouteAuditIdentity {
  const segments = input.routeTemplate.split('/').filter(Boolean);
  const verb = input.method.toUpperCase();
  const paramName = pickRouteParam(segments, input.params);
  const paramIndex = paramName
    ? segments.findIndex((segment) => segment === `:${paramName}`)
    : -1;

  const derivedEntityId = paramName
    ? (input.params[paramName] as string)
    : readIdSource('result:id', input.params, input.result);
  const derivedEntity =
    staticSegmentBefore(
      segments,
      paramIndex >= 0 ? paramIndex : segments.length,
    ) ?? 'root';

  const options = input.options;
  return {
    action:
      options?.action ??
      `${ROUTE_ACTION_PREFIX} ${verb} ${input.routeTemplate}`,
    entity: options?.entity ?? derivedEntity,
    entityId: options?.entityId
      ? readIdSource(options.entityId, input.params, input.result)
      : derivedEntityId,
  };
}

/** Lee un id `param:<nombre>` de la ruta, sólo si es UUID. */
export function readUuidParam(
  source: `param:${string}`,
  params: Readonly<Record<string, unknown>>,
): string | undefined {
  return readIdSource(source, params, undefined);
}
