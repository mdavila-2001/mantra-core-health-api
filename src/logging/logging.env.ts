import * as Joi from 'joi';

/**
 * Configuración por entorno del logging estructurado (pino) de todo el backend.
 *
 * Sigue el mismo patrón que `src/orm/config/orm.env.ts`: la validación vive en
 * una función pura (`loadLoggingEnv`) y no en un proveedor inyectable, porque el
 * logger se construye al evaluar `LoggingModule`, antes de que exista el
 * contenedor de dependencias de NestJS. Sus defaults son seguros por sí mismos,
 * de modo que el logger queda bien configurado aunque `ConfigModule` valide el
 * entorno por otro camino.
 */

/** Niveles de pino, de más grave a más verboso, más el silencio total. */
export type LogLevel =
  'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

/** Configuración de logging ya validada. */
export interface LoggingEnv {
  /** Nivel mínimo que se emite. Por debajo de él, la llamada al logger es un no-op barato. */
  readonly level: LogLevel;
  /**
   * Salida legible para humanos (pino-pretty) en vez de JSON por línea. Solo
   * para desarrollo local; en producción el JSON es lo que consume el agregador.
   */
  readonly pretty: boolean;
}

/**
 * Esquema Joi. `ConfigModule` lo aplica sobre `process.env` (concatenado con el
 * del ORM) para fallar en el arranque si `LOG_LEVEL` trae un valor inválido, en
 * vez de degradar en silencio a un nivel inesperado.
 */
export const loggingEnvSchema = Joi.object({
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_PRETTY: Joi.boolean().truthy('true').falsy('false').default(false),
}).unknown(true);

interface RawLoggingEnv {
  LOG_LEVEL: LogLevel;
  LOG_PRETTY: boolean;
}

/**
 * Valida el entorno de logging y lo devuelve tipado.
 *
 * @param source entorno a validar; se parametriza para poder testearlo sin
 *               contaminar `process.env`.
 */
export function loadLoggingEnv(
  source: NodeJS.ProcessEnv = process.env,
): LoggingEnv {
  const result = loggingEnvSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<RawLoggingEnv>;

  if (result.error) {
    throw new Error(
      `Configuración de logging inválida: ${result.error.message}`,
    );
  }

  return {
    level: result.value.LOG_LEVEL,
    pretty: result.value.LOG_PRETTY,
  };
}
