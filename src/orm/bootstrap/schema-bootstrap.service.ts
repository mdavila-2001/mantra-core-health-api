import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { loadOrmEnv, type SchemaSyncMode } from '../config/orm.env';
import { SchemaFidelityService } from '../fidelity/schema-fidelity.service';
import { acquireBootstrapLock } from './advisory-lock';
import { ddlLayers } from './layers';
import type { DdlLayerContext, DdlLayerResult } from './ddl-layer.contract';

/**
 * Inyección idempotente del DDL en el arranque de la aplicación.
 *
 * Objetivo del componente: que levantar el servicio contra una base vacía sea
 * suficiente para tener el modelo canónico completo -57 schemas, 1159 tablas,
 * ~7000 índices y 5993 claves foráneas- y que levantarlo contra una base ya
 * construida no cambie absolutamente nada.
 *
 * Por qué `OnApplicationBootstrap` y no `OnModuleInit`: en ese momento todos los
 * módulos ya están inicializados, lo que garantiza que MikroORM terminó de
 * descubrir las 1159 entidades. Con `OnModuleInit` el descubrimiento podría
 * estar incompleto y el DDL saldría parcial. Además ocurre antes de que el
 * servidor HTTP empiece a aceptar tráfico, así que ninguna petición llega a una
 * base a medio construir.
 *
 * Modos de operación, controlados por `ORM_SCHEMA_SYNC`:
 *   - `safe`    (por defecto) calcula y aplica el DDL aditivo;
 *   - `dry-run` calcula y registra el DDL sin ejecutarlo;
 *   - `off`     no toca la base; la estructura la gestiona otro proceso.
 */
@Injectable()
export class SchemaBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchemaBootstrapService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly fidelity: SchemaFidelityService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const env = loadOrmEnv();

    if (env.schema.syncMode === 'off') {
      this.logger.log(
        'ORM_SCHEMA_SYNC=off: la estructura de la base no se toca en el arranque',
      );
      return;
    }

    await this.run(env.schema.syncMode, env.schema.verifyFidelity);
  }

  /**
   * Ejecuta la secuencia completa bajo el cerrojo de arranque.
   *
   * Separado de `onApplicationBootstrap` para poder invocarlo desde un test o
   * desde un comando de mantenimiento sin depender del ciclo de vida de Nest.
   */
  async run(
    mode: SchemaSyncMode,
    verifyFidelity: boolean,
  ): Promise<DdlLayerResult[]> {
    const connection = this.orm.em.getConnection();
    const startedAt = Date.now();

    this.logger.log(
      `Materialización del esquema en modo "${mode}": ${ddlLayers.length} capas`,
    );

    // El cerrojo serializa a las réplicas que arranquen a la vez. Se toma antes
    // de la primera lectura del catálogo para que el "qué falta" que calcula
    // cada capa no quede obsoleto entre la lectura y la escritura.
    const lock = await acquireBootstrapLock(connection, this.logger);
    const results: DdlLayerResult[] = [];

    try {
      for (const layer of ddlLayers) {
        const layerStartedAt = Date.now();
        const context = this.buildContext(mode, layer.name);

        const outcome = await layer.apply(context);
        const result: DdlLayerResult = {
          layer: layer.name,
          ...outcome,
          tookMs: Date.now() - layerStartedAt,
        };
        results.push(result);

        this.logger.log(
          `Capa ${String(layer.order).padStart(2, '0')} ${layer.name}: ` +
            `${result.applied} aplicados, ${result.skipped} ya existían, ` +
            `${result.failures.length} incidencias (${result.tookMs} ms)`,
        );
      }
    } finally {
      // Se libera siempre. Si una capa lanzó, dejar el cerrojo tomado
      // bloquearía el arranque de todas las demás réplicas indefinidamente.
      await lock.release();
    }

    this.report(results, Date.now() - startedAt, mode);

    if (verifyFidelity) {
      await this.fidelity.verifyAndReport();
    }

    return results;
  }

  /**
   * Construye el contexto que recibe una capa.
   *
   * Aquí se concentra la diferencia entre `safe` y `dry-run`: las capas escriben
   * su SQL siempre igual y es este contexto el que decide si se ejecuta o solo
   * se registra. Así ninguna capa tiene que acordarse de comprobar el modo.
   */
  private buildContext(
    mode: SchemaSyncMode,
    layerName: string,
  ): DdlLayerContext {
    const connection = this.orm.em.getConnection();
    const logger = new Logger(`SchemaBootstrap:${layerName}`);

    return {
      orm: this.orm,
      mode,
      logger,
      execute: async (sql: string, label: string) => {
        if (mode === 'dry-run') {
          logger.log(`[dry-run] ${label}\n${sql}`);
          return;
        }
        await connection.execute(sql, [], 'run');
      },
      query: async <T>(sql: string, params: readonly unknown[] = []) =>
        connection.execute<T[]>(sql, params, 'all'),
    };
  }

  /** Resumen agregado del arranque, en una línea por métrica y apto para alertar sobre él. */
  private report(
    results: DdlLayerResult[],
    tookMs: number,
    mode: SchemaSyncMode,
  ): void {
    const applied = results.reduce((sum, r) => sum + r.applied, 0);
    const skipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const failures = results.flatMap((r) => r.failures);

    this.logger.log(
      `Esquema materializado en ${tookMs} ms (modo ${mode}): ` +
        `${applied} objetos aplicados, ${skipped} ya presentes`,
    );

    if (failures.length > 0) {
      // No se lanza: son fallos tolerados por diseño (extensión opcional sin
      // permisos, FK con datos huérfanos). Se agrupan para que una alerta pueda
      // engancharse a esta única línea en vez de a los avisos dispersos.
      this.logger.warn(
        `Incidencias no bloqueantes durante la materialización (${failures.length}):\n` +
          failures.map((failure) => `  - ${failure}`).join('\n'),
      );
    }
  }
}
