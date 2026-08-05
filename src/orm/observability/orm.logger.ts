import { Logger as NestLogger } from '@nestjs/common';
import { DefaultLogger } from '@mikro-orm/core';
import type {
  LogContext,
  LoggerNamespace,
  LoggerOptions,
} from '@mikro-orm/core';
import { QueryMetrics } from './query-metrics';

/**
 * Puente entre el logger interno de MikroORM y el logger de NestJS.
 *
 * Problema que resuelve: por defecto MikroORM escribe con `console.log` y con
 * colores ANSI. En un contenedor eso produce líneas que el agregador de logs no
 * sabe parsear, sin nivel, sin timestamp y sin correlación con el resto de la
 * aplicación. Al enrutar por el `Logger` de Nest -que `main.ts` sustituye por
 * pino con `app.useLogger`-, las consultas del ORM salen por el mismo transporte
 * estructurado que el resto de las capas del backend.
 *
 * Los mensajes que llevan datos (consultas lentas) se emiten como objeto con la
 * clave `msg`: pino la toma como el mensaje y trata el resto de claves
 * (`tookMs`, `rows`, `query`) como campos indexables, de modo que una consulta
 * lenta se puede filtrar por duración en el agregador, no solo leer.
 *
 * Además aprovecha el punto de paso para dos cosas que no vienen de serie:
 *   - clasificar como advertencia toda consulta que supere el umbral de lentitud,
 *     con lo que una regresión de rendimiento se ve sin activar el modo debug;
 *   - alimentar los contadores de `QueryMetrics`.
 *
 * Nota de coste: `logQuery` se ejecuta por cada consulta. Todo el trabajo caro
 * (formatear el SQL, serializar parámetros) queda detrás de la comprobación de
 * nivel, así que en producción con debug apagado el camino normal es un
 * incremento de contadores y una comparación numérica.
 */
export class OrmLogger extends DefaultLogger {
  /**
   * Valor de nest mantenido por la instancia.
   */
  private readonly nest = new NestLogger('MikroORM');

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param options - Valor de options requerido por la operación.
   * @param slowQueryMs - Valor de slow query ms requerido por la operación.
   * @param metrics - Valor de metrics requerido por la operación.
   */
  constructor(
    options: LoggerOptions,
    private readonly slowQueryMs: number,
    private readonly metrics: QueryMetrics,
  ) {
    super(options);
  }

  /**
   * Consultas SQL. `context.took` es la duración medida por el driver, es decir
   * el tiempo real de ida y vuelta contra PostgreSQL, no el tiempo de CPU.
   */
  override logQuery(
    context: {
      /**
       * Valor de query mantenido por la instancia.
       */
      query: string;
    } & LogContext,
  ): void {
    const took = context.took ?? 0;
    const isSlow = took >= this.slowQueryMs;

    this.metrics.record(context.query, took, isSlow);

    if (isSlow) {
      // Se registra siempre, aunque el modo debug esté apagado: una consulta
      // lenta es una señal operativa, no una traza de depuración.
      this.nest.warn({
        msg: 'consulta lenta',
        tookMs: Math.round(took),
        thresholdMs: this.slowQueryMs,
        rows: context.results ?? context.affected,
        query: context.query,
      });
      return;
    }

    if (this.isEnabled('query', context)) {
      this.nest.debug({
        msg: 'consulta',
        tookMs: Math.round(took),
        rows: context.results ?? context.affected,
        query: context.query,
      });
    }
  }

  /**
   * Ejecuta la operación log.
   *
   * @param namespace - Valor de namespace requerido por la operación.
   * @param message - Valor de message requerido por la operación.
   * @param context - Valor de context requerido por la operación.
   */
  override log(
    namespace: LoggerNamespace,
    message: string,
    context?: LogContext,
  ): void {
    if (!this.isEnabled(namespace, context)) return;
    this.nest.log(`[${namespace}] ${message}`);
  }

  // Las advertencias y los errores del ORM se registran siempre, sin consultar
  // `isEnabled`: no son trazas de depuración. Por eso estos dos métodos ignoran
  // el contexto de logging que sí usa `log`.
  /**
   * Ejecuta la operación warn.
   *
   * @param namespace - Valor de namespace requerido por la operación.
   * @param message - Valor de message requerido por la operación.
   */
  override warn(namespace: LoggerNamespace, message: string): void {
    this.nest.warn(`[${namespace}] ${message}`);
  }

  /**
   * Ejecuta la operación error.
   *
   * @param namespace - Valor de namespace requerido por la operación.
   * @param message - Valor de message requerido por la operación.
   */
  override error(namespace: LoggerNamespace, message: string): void {
    this.metrics.recordFailure();
    this.nest.error(`[${namespace}] ${message}`);
  }
}

/**
 * Instancia única de contadores para el proceso.
 *
 * Vive fuera del contenedor de dependencias porque el logger de MikroORM se
 * construye al crear la configuración, antes de que exista el contenedor de
 * Nest. El módulo ORM la vuelve a exponer como proveedor para que los servicios
 * la puedan inyectar con normalidad.
 */
export const ormQueryMetrics = new QueryMetrics();

/**
 * Fábrica que MikroORM invoca para construir su logger.
 *
 * @param slowQueryMs umbral de consulta lenta tomado del entorno
 */
export function createOrmLoggerFactory(
  slowQueryMs: number,
): (options: LoggerOptions) => OrmLogger {
  return (options: LoggerOptions) =>
    new OrmLogger(options, slowQueryMs, ormQueryMetrics);
}
