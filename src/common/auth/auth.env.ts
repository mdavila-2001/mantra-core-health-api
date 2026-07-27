import * as Joi from 'joi';

/**
 * Esquema de entorno de autenticación. Se concatena al esquema global en
 * `AppModule` para que un secreto ausente o un TTL mal escrito aborten el
 * arranque, no la primera emisión de token.
 *
 * `JWT_SECRET` trae un valor por defecto solo apto para desarrollo local; en
 * cualquier despliegue real debe provenir del gestor de secretos. El default
 * evita fricción en pruebas y en el arranque local sin `.env` completo.
 */
export const authEnvSchema = Joi.object({
  JWT_SECRET: Joi.string()
    .min(16)
    .default('dev-only-insecure-secret-change-me'),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(30),
  ACCOUNT_LOCK_THRESHOLD: Joi.number().integer().min(1).default(5),
}).unknown(true);

export interface AuthEnv {
  secret: string;
  accessTtl: string;
  refreshTtlDays: number;
  lockThreshold: number;
}

/** Lee la configuración de auth desde `process.env` con los defaults del esquema. */
export function loadAuthEnv(): AuthEnv {
  return {
    secret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30),
    lockThreshold: Number(process.env.ACCOUNT_LOCK_THRESHOLD ?? 5),
  };
}
