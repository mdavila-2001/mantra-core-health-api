import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { EntityName, FilterQuery } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PageResponseDto } from '../dto/page-response.dto';
import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import { requireTenantId } from '../tenant/tenant-context';

/** Lo mínimo que se lee de {@link PaginationQueryDto} para armar una página. */
export type CollectionPageQuery = Pick<
  PaginationQueryDto,
  'page' | 'pageSize' | 'order' | 'sortBy' | 'offset'
>;

/** Opciones de {@link listTenantCollection}. */
export interface TenantCollectionOptions<E extends object, T> {
  /** Paginación y orden pedidos por el cliente, ya validados por el DTO. */
  readonly query: CollectionPageQuery;
  /**
   * Columnas por las que el cliente puede ordenar; la primera es el orden por
   * defecto. `sortBy` fuera de la lista es un 400: ordenar por cualquier
   * propiedad abriría la puerta a inferir valores de columnas que la respuesta
   * no publica. Puede quedar vacía si la tabla no tiene una columna de orden
   * natural: entonces se ordena sólo por `id`.
   */
  readonly sortable: readonly (keyof E & string)[];
  /** Filtros del recurso, ya traducidos de la query. Nunca deciden el tenant. */
  readonly where?: FilterQuery<E>;
  /** Propiedad que guarda el tenant dueño de la fila. Por defecto, `tenantId`. */
  readonly tenantField?: keyof E & string;
  /**
   * Suma las filas con tenant nulo, que el módulo trata como catálogo de
   * plataforma (p. ej. un proveedor de identidad global). Sólo se activa
   * donde el módulo ya les da ese significado.
   */
  readonly includePlatformRows?: boolean;
  /**
   * Traduce una fila a su DTO de salida. Es la allowlist de lo que se publica:
   * un listado no devuelve la entidad, porque una columna nueva (un secreto,
   * un dato clínico) quedaría expuesta sin que nadie lo decida.
   */
  readonly map: (row: E) => T;
}

/**
 * Página de una tabla con `tenant_id`, acotada al tenant del contexto.
 *
 * ## Por qué existe
 *
 * Más de quinientas vistas del catálogo de interfaz estaban bloqueadas por no
 * tener un `GET` de colección. Escribirlos uno por uno repetía, en cada
 * módulo, las mismas tres decisiones de seguridad; olvidarse una sola vez
 * deja una fuga entre organizaciones. Este helper las fija en un lugar:
 *
 * 1. **El tenant sale del contexto, nunca del cliente.** Se lee con
 *    {@link requireTenantId}: si el request no fijó tenant, la lectura falla
 *    con 422 (`TENANT_REQUIRED`) en vez de devolver una página vacía (que mentiría sobre el
 *    motivo) o una página de todas las organizaciones.
 * 2. **El filtro del tenant se compone con `$and`.** Un filtro del recurso no
 *    puede pisarlo, ni siquiera uno que nombre la misma propiedad.
 * 3. **La salida pasa por un mapeo explícito** y la paginación tiene tope: el
 *    `PaginationQueryDto` común ya limita `pageSize` a 100.
 *
 * El rol lo sigue exigiendo el `@Roles(...)` del controlador, que es donde lo
 * lee el guard global. Este helper no lo vuelve a comprobar para no dejar dos
 * verdades sobre quién puede leer.
 *
 * El orden desempata siempre por `id` en el mismo sentido: sin desempate, dos
 * filas con el mismo `created_at` podrían repetirse o perderse entre páginas.
 *
 * @param em - Contexto de persistencia (un fork por request).
 * @param entity - Entidad que se lista.
 * @param options - Paginación, filtros, columnas ordenables y mapeo de salida.
 * @returns Página `{ data, meta }` con el formato común de listados.
 * @throws PreconditionFailedException si el request no fijó tenant.
 * @throws BadRequestException si `sortBy` no está entre las columnas ordenables.
 */
export async function listTenantCollection<E extends object, T>(
  em: EntityManager,
  entity: EntityName<E>,
  options: TenantCollectionOptions<E, T>,
): Promise<PageResponseDto<T>> {
  const tenantId = requireTenantId();
  const { query, sortable } = options;
  const sortBy = resolveSortBy(query.sortBy, sortable);

  const tenantField = options.tenantField ?? ('tenantId' as keyof E & string);
  const tenantScope = (
    options.includePlatformRows
      ? { $or: [{ [tenantField]: tenantId }, { [tenantField]: null }] }
      : { [tenantField]: tenantId }
  ) as FilterQuery<E>;
  // `NoInfer` es la firma de `findAndCount`: sin anotarlo, TypeScript no
  // reconoce como iguales el `E` del helper y el del ORM.
  const where = (
    options.where ? { $and: [options.where, tenantScope] } : tenantScope
  ) as FilterQuery<NoInfer<E>>;

  const direction = query.order === 'ASC' ? 'ASC' : 'DESC';
  const [rows, total] = await em.findAndCount(entity, where, {
    orderBy: (sortBy
      ? { [sortBy]: direction, id: direction }
      : { id: direction }) as never,
    limit: query.pageSize,
    offset: query.offset,
  });

  return new PageResponseDto(
    rows.map((row) => options.map(row)),
    total,
    query.page,
    query.pageSize,
  );
}

/** Valor por defecto de `sortBy` en {@link PaginationQueryDto}. */
const DTO_DEFAULT_SORT = 'createdAt';

/**
 * Columna de orden efectiva.
 *
 * El `PaginationQueryDto` común pone `sortBy = 'createdAt'` cuando el cliente
 * no lo pide, y hay tablas sin `created_at` (una corrida tiene `started_at`,
 * una solicitud `requested_at`). Ese valor por defecto se lee como «el orden
 * natural del recurso» —la primera columna ordenable—, no como un pedido
 * explícito que la tabla no puede cumplir. Cualquier otro valor fuera de la
 * allowlist sigue siendo un 400.
 *
 * @returns La columna, o `undefined` si el recurso sólo se ordena por `id`.
 * @throws BadRequestException si se pidió una columna no ordenable.
 */
function resolveSortBy<K extends string>(
  requested: string,
  sortable: readonly K[],
): K | undefined {
  if ((sortable as readonly string[]).includes(requested))
    return requested as K;
  if (requested === DTO_DEFAULT_SORT) return sortable[0];
  throw new BadRequestException(
    sortable.length > 0
      ? `sortBy admite: ${sortable.join(', ')}.`
      : 'Este listado no admite sortBy: se ordena por id.',
  );
}

/**
 * La ruta nombra un tenant (`/…/tenants/:tenantId/…`): tiene que ser el del
 * contexto.
 *
 * `TenantContextInterceptor` ya rechaza un `tenantId` de ruta ajeno. Se repite
 * en la lectura porque la página se arma con el tenant del contexto: sin esta
 * comprobación, una ruta que nombrara otro tenant devolvería los datos del
 * propio bajo una URL que promete los de otro.
 *
 * @param tenantId - Tenant que trae la ruta.
 * @throws PreconditionFailedException si el request no fijó tenant.
 * @throws ForbiddenException si la ruta nombra otro tenant.
 */
export function assertRouteTenant(tenantId: string): void {
  if (tenantId !== requireTenantId()) {
    throw new ForbiddenException('El tenant de la ruta no es el del contexto');
  }
}

/**
 * Quita los filtros que no llegaron en la query.
 *
 * Para el ORM, `{ estado: undefined }` no es «sin filtro»: según la versión,
 * se traduce a `IS NULL` o se descarta. Se resuelve antes, explícito.
 *
 * @param filters - Filtros del recurso, con `undefined` donde no se pidió.
 * @returns Los filtros pedidos, o `undefined` si no se pidió ninguno.
 */
export function definedFilters<T extends Record<string, string | undefined>>(
  filters: T,
): Partial<T> | undefined {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined);
  return entries.length > 0
    ? (Object.fromEntries(entries) as Partial<T>)
    : undefined;
}
