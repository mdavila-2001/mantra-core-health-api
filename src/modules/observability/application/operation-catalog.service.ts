import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { RouteIndexService } from '../../../observability/route-index/route-index.service';
import {
  operationResolver,
  type CatalogOperationRow,
} from '../../../observability/capture';

/** Cada cuánto se relee `data_catalog.catalog_operations`. */
export const CATALOG_REFRESH_MS = 10 * 60 * 1000;

/**
 * Conecta el resolutor de operaciones del proceso con sus dos fuentes:
 * el índice de rutas vivas y el catálogo `data_catalog.catalog_operations`
 * (cacheado, se relee cada 10 minutos). Si el catálogo no se puede leer o está
 * vacío, el `module_code` queda `UNKNOWN`: no se inventa un módulo.
 */
@Injectable()
export class OperationCatalogService
  implements OnModuleInit, OnApplicationShutdown
{
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly orm: MikroORM,
    private readonly routes: RouteIndexService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OperationCatalogService.name);
  }

  async onModuleInit(): Promise<void> {
    operationResolver.setRouteLookup((method, template) =>
      this.routes.lookup(method, template),
    );
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, CATALOG_REFRESH_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Relee el catálogo. Nunca lanza. */
  async refresh(): Promise<number> {
    try {
      const rows = await this.orm.em.getConnection().execute<
        {
          operation_key: string;
          http_method: string;
          route_template: string;
          module_code: string | null;
        }[]
      >(
        `SELECT operation_key, http_method, route_template, module_code
           FROM data_catalog.catalog_operations
          WHERE module_code IS NOT NULL`,
        [],
        'all',
      );
      const mapped: CatalogOperationRow[] = rows.map((r) => ({
        operationKey: r.operation_key,
        httpMethod: r.http_method,
        routeTemplate: r.route_template,
        moduleCode: r.module_code,
      }));
      operationResolver.setCatalog(mapped);
      return mapped.length;
    } catch (error) {
      this.logger.warn(
        {
          operation: 'observability.catalog',
          errorType:
            error instanceof Error ? error.constructor.name : 'unknown',
        },
        'No se pudo leer data_catalog.catalog_operations; module_code queda UNKNOWN',
      );
      return 0;
    }
  }
}
