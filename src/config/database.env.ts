import * as Joi from 'joi';

/**
 * Configuración de conexión a la capa relacional PostgreSQL (fuente de verdad
 * canónica de SALUD v4.0.1). Todos los parámetros de conexión provienen del
 * entorno (`.env` / secret manager): NO hay defaults de host, puerto ni
 * credenciales en el código, para que ninguna configuración quede hardcodeada y
 * cualquier variable faltante falle temprano en vez de conectar a un destino
 * equivocado en silencio. La validación vive acá porque la consumen tanto el
 * arranque de NestJS como la CLI de MikroORM (que carga la config fuera de la DI).
 */
export interface DatabaseEnv {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  debug: boolean;
}

export const databaseEnvSchema = Joi.object({
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  MIKRO_ORM_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),
});

interface RawDatabaseEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  MIKRO_ORM_DEBUG: boolean;
}

export function loadDatabaseEnv(
  source: NodeJS.ProcessEnv = process.env,
): DatabaseEnv {
  const result = databaseEnvSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<RawDatabaseEnv>;

  if (result.error) {
    throw new Error(
      `Configuración de base de datos inválida: ${result.error.message}`,
    );
  }

  const validated = result.value;

  return {
    host: validated.DB_HOST,
    port: validated.DB_PORT,
    user: validated.DB_USER,
    password: validated.DB_PASSWORD,
    name: validated.DB_NAME,
    debug: validated.MIKRO_ORM_DEBUG,
  };
}
