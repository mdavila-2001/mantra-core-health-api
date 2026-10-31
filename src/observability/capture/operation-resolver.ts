import { normalizeTemplate } from '../route-index/route-index.service';

/**
 * Resuelve (método, plantilla) → `operation_key` y `module_code` (02 §5.1).
 *
 * Dos fuentes, en este orden:
 *  1. `RouteIndexService` (rutas vivas del proceso) → `operation_key` = `<Controlador>_<handler>`.
 *  2. `data_catalog.catalog_operations` (cacheado, refresco periódico) → `module_code`.
 *
 * Sin dato, `module_code = 'UNKNOWN'` y, si no hay ruta declarada,
 * `operation_key = null`. **No se inventa un módulo** a partir del nombre del
 * controlador: el catálogo es la fuente del módulo.
 *
 * Es un singleton de proceso porque el middleware, el filtro y el logger del
 * ORM se crean antes que el contenedor de Nest.
 */

export const UNKNOWN_MODULE = 'UNKNOWN';

export interface ResolvedOperation {
  readonly operationKey: string | null;
  readonly moduleCode: string;
}

export interface CatalogOperationRow {
  readonly operationKey: string;
  readonly httpMethod: string;
  readonly routeTemplate: string;
  readonly moduleCode: string | null;
}

type RouteLookup = (
  method: string,
  template: string,
) => { operationId: string } | null;

const UNRESOLVED: ResolvedOperation = Object.freeze({
  operationKey: null,
  moduleCode: UNKNOWN_MODULE,
});

export class OperationResolver {
  private routeLookup: RouteLookup | null = null;
  private moduleByOperation = new Map<string, string>();
  private moduleByRoute = new Map<string, string>();
  private readonly cache = new Map<string, ResolvedOperation>();
  private catalogLoadedAt: Date | null = null;

  /** Conecta el índice de rutas vivas (lo hace el módulo al iniciar). */
  setRouteLookup(lookup: RouteLookup | null): void {
    this.routeLookup = lookup;
    this.cache.clear();
  }

  /** Reemplaza el mapa del catálogo (lo hace el módulo cada 10 min). */
  setCatalog(rows: readonly CatalogOperationRow[], at = new Date()): void {
    const byOperation = new Map<string, string>();
    const byRoute = new Map<string, string>();
    for (const row of rows) {
      if (!row.moduleCode) continue;
      byOperation.set(row.operationKey, row.moduleCode);
      byRoute.set(
        `${row.httpMethod.toUpperCase()} ${normalizeTemplate(row.routeTemplate)}`,
        row.moduleCode,
      );
    }
    this.moduleByOperation = byOperation;
    this.moduleByRoute = byRoute;
    this.catalogLoadedAt = at;
    this.cache.clear();
  }

  get catalogSize(): number {
    return this.moduleByOperation.size;
  }

  get catalogAt(): Date | null {
    return this.catalogLoadedAt;
  }

  /** Nunca lanza. */
  resolve(method: string, template: string | undefined): ResolvedOperation {
    try {
      if (
        !template ||
        template === 'UNMATCHED' ||
        template === '__overflow__'
      ) {
        return UNRESOLVED;
      }
      const key = `${method} ${template}`;
      const hit = this.cache.get(key);
      if (hit) return hit;

      const route = this.routeLookup?.(method, template) ?? null;
      const operationKey = route?.operationId ?? null;
      const moduleCode =
        (operationKey ? this.moduleByOperation.get(operationKey) : undefined) ??
        this.moduleByRoute.get(
          `${method.toUpperCase()} ${normalizeTemplate(template)}`,
        ) ??
        UNKNOWN_MODULE;
      const resolved: ResolvedOperation = { operationKey, moduleCode };
      if (this.cache.size < 5000) this.cache.set(key, resolved);
      return resolved;
    } catch {
      return UNRESOLVED;
    }
  }
}

/** Resolutor del proceso. */
export const operationResolver = new OperationResolver();
