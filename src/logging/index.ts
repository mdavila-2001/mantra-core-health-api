/**
 * Superficie pública de la capa de logging.
 *
 * El resto de la aplicación importa desde aquí; los archivos internos
 * (`pino-options.ts`) son detalle de configuración.
 */
export { LoggingModule } from './logging.module';
export { loggingEnvSchema, loadLoggingEnv } from './logging.env';
export type { LoggingEnv, LogLevel } from './logging.env';
