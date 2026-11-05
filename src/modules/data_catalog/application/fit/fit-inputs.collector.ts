import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { loadBuildInfo } from '../../../../common/build-info';
import { RouteMetadataService } from '../../../../observability/route-index/route-metadata.service';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import type { OperacionRecord } from '../../domain/inventory/inventory.types';
import { FitLiveRepository } from './fit-live.repository';
import {
  FIT_MUTABILITY_SOURCE,
  available,
  unavailable,
  type FitDriftSummary,
  type FitInputs,
  type FitMutabilitySource,
  type FitOperation,
  type FitStaticTable,
  type Source,
} from './fit.types';

/** Lo único que se publica de un fallo de lectura: su clase. El mensaje puede citar SQL o rutas. */
const reasonOf = (error: unknown): string =>
  error instanceof Error
    ? `falló la lectura (${error.name})`
    : 'falló la lectura';

/** Corre una lectura y la convierte en {@link Source}: la ausencia es un hecho, nunca un `[]`. */
async function attempt<T>(
  logger: Logger,
  name: string,
  read: () => Promise<T> | T,
): Promise<Source<T>> {
  try {
    return available(await read());
  } catch (error) {
    logger.warn(
      {
        source: name,
        err: error instanceof Error ? error.message : String(error),
      },
      'La sonda de ajuste no pudo leer una fuente',
    );
    return unavailable(reasonOf(error));
  }
}

function toOperation(o: OperacionRecord): FitOperation {
  return {
    id: o.id,
    method: o.metodo,
    route: o.ruta,
    origin: o.origen,
    isPublic: o.autenticacion.publica,
    roles: o.autenticacion.roles,
    hasBody: o.cuerpo !== null,
    bodyDto: o.cuerpo?.dto ?? null,
    responseDto: o.respuesta.dto,
    httpCode: o.httpCode,
    tables: o.tablas.length,
    noTablesDeclared: o.sinTablas !== null,
  };
}

/** Cuenta de un elemento de deriva: el inventario guarda unas categorías como lista y otras como número. */
function driftEntry(valor: unknown): { count: number; samples: string[] } {
  if (typeof valor === 'number') return { count: valor, samples: [] };
  if (Array.isArray(valor))
    return {
      count: valor.length,
      samples: valor.slice(0, 5).map((e) => {
        if (typeof e === 'string') return e;
        const registro = e as { tabla?: string; columna?: string };
        return (
          registro.tabla ?? registro.columna ?? JSON.stringify(e).slice(0, 80)
        );
      }),
    };
  return { count: 0, samples: [] };
}

export function summarizeDrift(
  origen: Record<string, unknown>,
): FitDriftSummary {
  const counts: Record<string, number> = {};
  const samples: Record<string, string[]> = {};
  for (const [clave, valor] of Object.entries(origen)) {
    const { count, samples: muestra } = driftEntry(valor);
    counts[clave] = count;
    if (muestra.length) samples[clave] = muestra;
  }
  return { counts, samples };
}

/**
 * Arma {@link FitInputs} leyendo las fuentes reales: las rutas que Nest registró, el inventario
 * generado, el catálogo estático, el catálogo vivo (`data_catalog.*`) y la importación. Cada fuente
 * se lee por separado: una que falla deja `SIN_DATO` a las comprobaciones que la usan y no
 * tumba las demás.
 */
@Injectable()
export class FitInputsCollector {
  private readonly logger = new Logger(FitInputsCollector.name);

  constructor(
    private readonly em: EntityManager,
    private readonly routes: RouteMetadataService,
    private readonly inventory: InventoryRepository,
    private readonly live: FitLiveRepository,
    @Optional()
    @Inject(FIT_MUTABILITY_SOURCE)
    private readonly mutabilitySource: FitMutabilitySource | null = null,
  ) {}

  async collect(now: Date = new Date()): Promise<FitInputs> {
    const log = this.logger;
    const build = loadBuildInfo();
    const [operations, staticTables, ormDrift, deployedDbDrift] = [
      await attempt(log, 'operations', () =>
        this.inventory.operaciones().map(toOperation),
      ),
      await attempt(log, 'staticTables', () => this.staticTables()),
      await attempt(log, 'ormDrift', () =>
        summarizeDrift(this.inventory.catalogoIndice().deriva),
      ),
      await attempt(log, 'deployedDbDrift', () => this.deployedDbDrift()),
    ];
    const liveObjects = await attempt(log, 'liveObjects', () =>
      this.live.liveObjects(this.em.fork()),
    );
    const scan = await attempt(log, 'scan', () =>
      this.live.scanState(this.em.fork()),
    );
    const importedOperations = await attempt(log, 'importedOperations', () =>
      this.live.importedOperations(this.em.fork()),
    );
    const mutability = await attempt(log, 'mutability', async () =>
      this.mutabilitySource ? await this.mutabilitySource.declarations() : null,
    );
    return {
      now,
      routes: await attempt(log, 'routes', () =>
        this.routes.all().map((r) => ({
          method: r.method,
          template: r.template,
          controller: r.controller,
          handler: r.handler,
        })),
      ),
      operations,
      staticTables,
      ormDrift,
      deployedDbDrift,
      liveObjects,
      scan,
      importedOperations,
      mutability,
      deployment: { commit: build.commit, builtAt: build.builtAt },
    };
  }

  /** Tablas del catálogo estático con sus columnas, de `inventario/catalogo/<schema>.json`. */
  private staticTables(): FitStaticTable[] {
    const schemas = [
      ...new Set(this.inventory.catalogoIndice().tablas.map((t) => t.schema)),
    ].sort();
    return schemas.flatMap((schema) =>
      this.inventory.tablasDeSchema(schema).map((t) => ({
        schema: t.schema,
        table: t.tabla,
        columns: t.columnas.map((c) =>
          String((c as { nombre: string }).nombre),
        ),
        systemDescription: t.proposito.texto,
      })),
    );
  }

  /** Resumen de `inventario/catalogo/deriva-bd.json`: modelo contra la base con que se generó el inventario. */
  private deployedDbDrift(): FitDriftSummary {
    const archivo = join(
      this.inventory.directory(),
      'catalogo',
      'deriva-bd.json',
    );
    const { resumen } = JSON.parse(readFileSync(archivo, 'utf8')) as {
      resumen: Record<string, unknown>;
    };
    return summarizeDrift(resumen);
  }
}
