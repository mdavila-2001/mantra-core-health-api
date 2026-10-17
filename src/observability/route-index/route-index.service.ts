import { Injectable, RequestMethod, type OnModuleInit } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { joinRouteTemplate } from '../../common/audit-trail/route-audit-identity';

/**
 * Índice en proceso de las rutas HTTP de la API: (método, plantilla) →
 * `operationId`.
 *
 * Se arma al arrancar leyendo los metadatos de Nest (`@Controller`, `@Get`…), no
 * el archivo `openapi/openapi.json`: ese archivo no viaja en la imagen de
 * producción (el `Dockerfile` copia sólo `dist/`) y Swagger se construye sólo
 * fuera de producción. Los metadatos están siempre.
 *
 * El `operationId` sigue la convención de Swagger —`<Controlador>_<handler>`—, así
 * que coincide con el del contrato publicado; una prueba lo comprueba contra
 * `openapi.json`. Sirve para que las lecturas del portal (tráfico por endpoint,
 * catálogo de flujos, suites por endpoint) nombren una ruta con el mismo
 * identificador que el contrato, sin leer ningún archivo.
 */

/** Una ruta HTTP de la API. */
export interface RouteEntry {
  /** Verbo en mayúsculas; `ALL` si el handler acepta cualquiera. */
  readonly method: string;
  /** Plantilla con `:parámetro`, sin barra final. */
  readonly template: string;
  /** `<Controlador>_<handler>`, igual al de Swagger. */
  readonly operationId: string;
  readonly controller: string;
  readonly handler: string;
}

/** `{id}` (estilo OpenAPI) → `:id` (estilo Express), y sin barra final. */
export function normalizeTemplate(template: string): string {
  const withColons = template.replace(/\{(\w+)\}/g, ':$1');
  const trimmed = withColons.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function pathsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(pathsOf);
  return [typeof value === 'string' ? value : ''];
}

@Injectable()
export class RouteIndexService implements OnModuleInit {
  private byKey = new Map<string, RouteEntry>();
  private entries: readonly RouteEntry[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    this.build();
  }

  /** Recorre los controladores registrados y arma el índice. */
  build(): void {
    const found: RouteEntry[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const metatype = wrapper.metatype;
      const instance = wrapper.instance as object | null | undefined;
      if (typeof metatype !== 'function' || !instance) continue;

      const controllerPaths = pathsOf(
        Reflect.getMetadata(PATH_METADATA, metatype),
      );
      const prototype = Object.getPrototypeOf(instance) as object | null;

      for (const handler of this.scanner.getAllMethodNames(prototype)) {
        const target: unknown = Reflect.get(prototype ?? {}, handler);
        if (typeof target !== 'function') continue;
        const methodCode: unknown = Reflect.getMetadata(
          METHOD_METADATA,
          target,
        );
        if (typeof methodCode !== 'number') continue;
        const method = RequestMethod[methodCode];
        if (!method) continue;

        const handlerPaths = pathsOf(
          Reflect.getMetadata(PATH_METADATA, target),
        );
        for (const controllerPath of controllerPaths) {
          for (const handlerPath of handlerPaths) {
            found.push({
              method,
              template: normalizeTemplate(
                joinRouteTemplate(controllerPath, handlerPath),
              ),
              operationId: `${metatype.name}_${handler}`,
              controller: metatype.name,
              handler,
            });
          }
        }
      }
    }

    // El desempate por `operationId` hace el orden —y con él, qué entrada gana
    // si dos handlers declaran la misma ruta— independiente del orden en que
    // Nest descubre los controladores.
    found.sort(
      (a, b) =>
        a.template.localeCompare(b.template) ||
        a.method.localeCompare(b.method) ||
        a.operationId.localeCompare(b.operationId),
    );
    this.entries = found;
    this.byKey = new Map();
    for (const entry of found) {
      // Si dos handlers declaran la misma ruta, gana el de menor `operationId`.
      const key = `${entry.method} ${entry.template}`;
      if (!this.byKey.has(key)) this.byKey.set(key, entry);
    }
  }

  /**
   * Busca una ruta por verbo y plantilla.
   *
   * @returns La entrada, o `null` si la API no declara esa ruta. Un handler
   * `@All()` responde a cualquier verbo.
   */
  lookup(method: string, template: string): RouteEntry | null {
    const normalized = normalizeTemplate(template);
    return (
      this.byKey.get(`${method.toUpperCase()} ${normalized}`) ??
      this.byKey.get(`ALL ${normalized}`) ??
      null
    );
  }

  /** Todas las rutas, ordenadas por plantilla y verbo. */
  all(): readonly RouteEntry[] {
    return this.entries;
  }
}
