import * as Joi from 'joi';

/**
 * Secreto de desarrollo. Solo apto para pruebas y arranque local sin `.env`.
 * NUNCA debe usarse en producción: `loadAuthEnv` aborta el arranque si detecta
 * este valor (o su ausencia) cuando `NODE_ENV==='production'`.
 */
const INSECURE_DEV_SECRET = 'dev-only-insecure-secret-change-me';

/**
 * Algoritmo de firma/verificación fijado. Se pinnea explícitamente para evitar
 * ataques de confusión de algoritmo (p. ej. que un verificador acepte `none` o
 * un algoritmo asimétrico con la clave simétrica como material público).
 */
export const JWT_ALGORITHM = 'HS256' as const;

/**
 * Esquema de entorno de autenticación. Se concatena al esquema global en
 * `AppModule` para que un secreto ausente o un TTL mal escrito aborten el
 * arranque, no la primera emisión de token.
 *
 * `JWT_SECRET` trae un valor por defecto solo apto para desarrollo local; en
 * producción es obligatorio (ver `loadAuthEnv`). El default evita fricción en
 * pruebas y en el arranque local sin `.env` completo.
 */
export const authEnvSchema = Joi.object({
  JWT_SECRET: Joi.string()
    .min(16)
    // Obligatorio y de al menos 32 caracteres en producción; con default de dev
    // en cualquier otro entorno.
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(32).invalid(INSECURE_DEV_SECRET).required(),
      otherwise: Joi.string().default(INSECURE_DEV_SECRET),
    }),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(30),
  ACCOUNT_LOCK_THRESHOLD: Joi.number().integer().min(1).default(5),
  // Entrega del refresh token como cookie httpOnly. Apagada por defecto:
  // encenderla cambia el contrato con el frontend (ver `src/common/auth/README.md`).
  AUTH_REFRESH_COOKIE_ENABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),
  AUTH_REFRESH_COOKIE_NAME: Joi.string().default('mch_refresh'),
  AUTH_REFRESH_COOKIE_PATH: Joi.string().default('/iam/auth/token/refresh'),
  AUTH_REFRESH_COOKIE_SAMESITE: Joi.string()
    .valid('strict', 'lax', 'none')
    .default('strict'),
  AUTH_REFRESH_COOKIE_SECURE: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
}).unknown(true);

/**
 * Describe el contrato estructural de auth env.
 */
export interface AuthEnv {
  /**
   * Valor de secret mantenido por la instancia.
   */
  secret: string;
  /**
   * Valor de access ttl mantenido por la instancia.
   */
  accessTtl: string;
  /**
   * Valor de refresh ttl days mantenido por la instancia.
   */
  refreshTtlDays: number;
  /**
   * Valor de lock threshold mantenido por la instancia.
   */
  lockThreshold: number;
}

/**
 * Lee la configuración de auth desde `process.env`.
 *
 * Regla de seguridad: en producción el secreto es obligatorio y no puede ser el
 * default de desarrollo. Si falta o es el default inseguro, se aborta el arranque
 * en lugar de firmar tokens con un secreto público conocido del repositorio (que
 * permitiría forjar un JWT con rol `SUPERADMIN`).
 */
export function loadAuthEnv(): AuthEnv {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawSecret = process.env.JWT_SECRET;

  if (isProduction && (!rawSecret || rawSecret === INSECURE_DEV_SECRET)) {
    throw new Error(
      'JWT_SECRET es obligatorio en producción y no puede ser el secreto de ' +
        'desarrollo. Configúrelo desde el gestor de secretos (>= 32 caracteres).',
    );
  }

  return {
    secret: rawSecret ?? INSECURE_DEV_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30),
    lockThreshold: Number(process.env.ACCOUNT_LOCK_THRESHOLD ?? 5),
  };
}
