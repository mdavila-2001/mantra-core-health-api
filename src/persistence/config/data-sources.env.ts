import * as Joi from 'joi';
import { DataSourceConfigurationError } from '../errors/persistence.errors';
import {
  areEquivalent,
  connectionFingerprint,
  parsePostgresUrl,
  type PostgresConnectionConfig,
} from './connection-descriptor';

/**
 * Resolución de las fuentes de datos a partir del entorno.
 *
 * Principio rector: **compatibilidad total hacia atrás**. Un despliegue que hoy
 * solo define `DB_HOST`/`DB_USER`/... debe seguir arrancando exactamente igual,
 * con una sola conexión y un solo pool. Las variables nuevas son todas
 * opcionales, y mientras no se definan, lectura y escritura resuelven al mismo
 * descriptor, se detectan como equivalentes y comparten instancia. Es la fase
 * «expand» del §47: la infraestructura nueva existe sin cambiar el
 * comportamiento de la vieja.
 *
 * Precedencia para cada ruta:
 *   1. `POSTGRES_{READ,WRITE,ADMIN}_URL` — una URL completa.
 *   2. `DB_{READ,WRITE}_*` — campos sueltos, para componer desde secretos.
 *   3. `DB_*` — la configuración heredada, que es el respaldo de todas.
 */

/** Estrategia cuando la ruta de lectura falla (§33). */
export type ReadFallbackStrategy =
  /** El fallo se propaga. Ninguna lectura cambia de destino en silencio. */
  | 'fail-fast'
  /** Se reintenta contra la conexión de escritura, registrando el desvío. */
  | 'fallback-to-primary';

/** Fuentes de datos ya resueltas y validadas. */
export interface ResolvedDataSources {
  /** Conexión de escritura. Es siempre la primaria. */
  readonly write: PostgresConnectionConfig;
  /** Conexión de lectura. Puede ser la misma instancia que la de escritura. */
  readonly read: PostgresConnectionConfig;
  /**
   * Conexión administrativa: DDL, migraciones y aprovisionamiento.
   *
   * Es opcional a propósito. Solo se registra si el operador la define, y nunca
   * se inyecta en un caso de uso (§21). Cuando no está, las herramientas que la
   * necesitan lo dicen en vez de recurrir en silencio a la de escritura.
   */
  readonly admin?: PostgresConnectionConfig;
  /**
   * Si lectura y escritura son equivalentes y comparten una única instancia.
   *
   * Lo consume el health check para no reportar dos conexiones donde solo hay
   * un pool, que confundiría a quien dimensione `max_connections`.
   */
  readonly sharesConnection: boolean;
  /** Estrategia de fallback de lectura. */
  readonly readFallback: ReadFallbackStrategy;
}

/**
 * Esquema de las variables nuevas.
 *
 * No redeclara `DB_HOST` y compañía: de eso ya se ocupa `ormEnvSchema`, y
 * duplicar la validación produciría dos mensajes distintos para el mismo fallo.
 */
export const dataSourcesEnvSchema = Joi.object({
  POSTGRES_WRITE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  POSTGRES_READ_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  POSTGRES_ADMIN_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),

  DB_READ_HOST: Joi.string().hostname(),
  DB_READ_PORT: Joi.number().port(),
  DB_READ_USER: Joi.string(),
  DB_READ_PASSWORD: Joi.string().allow(''),
  DB_READ_NAME: Joi.string(),
  DB_READ_POOL_MIN: Joi.number().integer().min(0),
  DB_READ_POOL_MAX: Joi.number().integer().min(1),

  DATA_WRITE_CONNECTION_NAME: Joi.string().default('postgres-write'),
  DATA_READ_CONNECTION_NAME: Joi.string().default('postgres-read'),
  DATA_ADMIN_CONNECTION_NAME: Joi.string().default('postgres-admin'),

  // `fail-fast` es el valor por defecto por dos razones, y ninguna es la
  // comodidad operativa. Primera: el desvío al primario cambia la consistencia
  // de la lectura sin que nadie lo haya pedido. Segunda, y más grave: cuando la
  // separación es por rol -lector y escritor contra el mismo servidor-, el
  // desvío haría que las lecturas se ejecutaran con la credencial de escritura,
  // que es una escalada de privilegios silenciosa. Quien quiera el desvío debe
  // pedirlo y asumirlo.
  DATA_READ_FALLBACK: Joi.string()
    .valid('fail-fast', 'fallback-to-primary')
    .default('fail-fast'),

  DATA_SOURCE_PROVIDER: Joi.string().default('local'),
}).unknown(true);

/** Forma cruda de las variables una vez aplicados los valores por defecto. */
interface RawDataSourcesEnv {
  POSTGRES_WRITE_URL?: string;
  POSTGRES_READ_URL?: string;
  POSTGRES_ADMIN_URL?: string;
  DB_READ_HOST?: string;
  DB_READ_PORT?: number;
  DB_READ_USER?: string;
  DB_READ_PASSWORD?: string;
  DB_READ_NAME?: string;
  DB_READ_POOL_MIN?: number;
  DB_READ_POOL_MAX?: number;
  DATA_WRITE_CONNECTION_NAME: string;
  DATA_READ_CONNECTION_NAME: string;
  DATA_ADMIN_CONNECTION_NAME: string;
  DATA_READ_FALLBACK: ReadFallbackStrategy;
  DATA_SOURCE_PROVIDER: string;
}

/** Configuración heredada, la que ya usa `orm.env.ts`. */
interface LegacyDbEnv {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  poolMin: number;
  poolMax: number;
}

/** Valores por defecto del pool, alineados con los de `orm.env.ts`. */
const DEFAULT_POOL_MIN = 2;
const DEFAULT_POOL_MAX = 10;

/** Lee la configuración heredada sin volver a validarla. */
function readLegacy(source: NodeJS.ProcessEnv): LegacyDbEnv {
  const missing = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ].filter((key) => !source[key]);
  if (missing.length > 0) {
    throw new DataSourceConfigurationError(
      `Faltan variables de conexión obligatorias: ${missing.join(', ')}.`,
    );
  }
  return {
    host: source.DB_HOST as string,
    port: Number(source.DB_PORT),
    // `DB_APP_USER` tiene precedencia porque es el rol de runtime sujeto a RLS.
    // Se respeta aquí igual que en `orm.config.ts`, para que introducir las
    // rutas no revierta esa decisión ya tomada.
    user: source.DB_APP_USER ?? (source.DB_USER as string),
    password: source.DB_APP_PASSWORD ?? (source.DB_PASSWORD as string),
    database: source.DB_NAME as string,
    poolMin: source.DB_POOL_MIN ? Number(source.DB_POOL_MIN) : DEFAULT_POOL_MIN,
    poolMax: source.DB_POOL_MAX ? Number(source.DB_POOL_MAX) : DEFAULT_POOL_MAX,
  };
}

/** Compone el descriptor de escritura. */
function buildWrite(
  raw: RawDataSourcesEnv,
  legacy: LegacyDbEnv,
): PostgresConnectionConfig {
  // La configuración heredada no contempla TLS -`orm.config.ts` nunca lo
  // activó-, así que su equivalente es `ssl: false`. Quien necesite TLS pasa
  // por la URL, donde `sslmode` lo declara de forma explícita.
  const base = raw.POSTGRES_WRITE_URL
    ? parsePostgresUrl(raw.POSTGRES_WRITE_URL, 'POSTGRES_WRITE_URL')
    : { ...legacy, ssl: false };
  return {
    name: raw.DATA_WRITE_CONNECTION_NAME,
    role: 'write',
    host: base.host,
    port: base.port,
    user: base.user,
    password: base.password,
    database: base.database,
    ssl: base.ssl,
    pool: { min: legacy.poolMin, max: legacy.poolMax },
    provider: raw.DATA_SOURCE_PROVIDER,
  };
}

/**
 * Compone el descriptor de lectura.
 *
 * Cuando no hay ninguna variable de lectura definida, devuelve un descriptor
 * idéntico al de escritura salvo en el nombre y el papel. Eso es lo que hace
 * que `areEquivalent` dé `true` y que el registro comparta la instancia.
 */
function buildRead(
  raw: RawDataSourcesEnv,
  legacy: LegacyDbEnv,
  write: PostgresConnectionConfig,
): PostgresConnectionConfig {
  if (raw.POSTGRES_READ_URL) {
    const parsed = parsePostgresUrl(raw.POSTGRES_READ_URL, 'POSTGRES_READ_URL');
    return {
      name: raw.DATA_READ_CONNECTION_NAME,
      role: 'read',
      ...parsed,
      pool: {
        min: raw.DB_READ_POOL_MIN ?? legacy.poolMin,
        max: raw.DB_READ_POOL_MAX ?? legacy.poolMax,
      },
      provider: raw.DATA_SOURCE_PROVIDER,
    };
  }

  return {
    name: raw.DATA_READ_CONNECTION_NAME,
    role: 'read',
    host: raw.DB_READ_HOST ?? write.host,
    port: raw.DB_READ_PORT ?? write.port,
    user: raw.DB_READ_USER ?? write.user,
    password: raw.DB_READ_PASSWORD ?? write.password,
    database: raw.DB_READ_NAME ?? write.database,
    ssl: write.ssl,
    pool: {
      min: raw.DB_READ_POOL_MIN ?? legacy.poolMin,
      max: raw.DB_READ_POOL_MAX ?? legacy.poolMax,
    },
    provider: raw.DATA_SOURCE_PROVIDER,
  };
}

/** Compone el descriptor administrativo, si el operador lo definió. */
function buildAdmin(
  raw: RawDataSourcesEnv,
): PostgresConnectionConfig | undefined {
  if (!raw.POSTGRES_ADMIN_URL) return undefined;
  const parsed = parsePostgresUrl(raw.POSTGRES_ADMIN_URL, 'POSTGRES_ADMIN_URL');
  return {
    name: raw.DATA_ADMIN_CONNECTION_NAME,
    role: 'admin',
    ...parsed,
    // El pool administrativo es deliberadamente diminuto: sirve para migrar y
    // aprovisionar, no para atender tráfico. Un `max` grande aquí solo serviría
    // para que un uso indebido de esta conexión pasara desapercibido.
    pool: { min: 0, max: 2 },
    provider: raw.DATA_SOURCE_PROVIDER,
  };
}

/**
 * Resuelve y valida las fuentes de datos.
 *
 * @param source entorno a leer; se parametriza para poder probarlo sin tocar
 *               `process.env`.
 */
export function resolveDataSources(
  source: NodeJS.ProcessEnv = process.env,
): ResolvedDataSources {
  const result = dataSourcesEnvSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<RawDataSourcesEnv>;

  if (result.error) {
    throw new DataSourceConfigurationError(
      `Configuración de fuentes de datos inválida: ${result.error.message}`,
    );
  }

  const raw = result.value;
  const legacy = readLegacy(source);
  const write = buildWrite(raw, legacy);
  const read = buildRead(raw, legacy, write);
  const admin = buildAdmin(raw);

  assertDistinctNames([write, read, admin]);
  assertPoolBounds(write);
  assertPoolBounds(read);

  return {
    write,
    read,
    admin,
    sharesConnection: areEquivalent(read, write),
    readFallback: raw.DATA_READ_FALLBACK,
  };
}

/**
 * Dos conexiones no pueden compartir nombre lógico (§58).
 *
 * Si lo hicieran, el registro devolvería una u otra según el orden de
 * inserción, y el enrutado sería indeterminista: la clase de fallo que aparece
 * en producción y no se reproduce en local.
 */
function assertDistinctNames(
  configs: ReadonlyArray<PostgresConnectionConfig | undefined>,
): void {
  const seen = new Map<string, string>();
  for (const config of configs) {
    if (!config) continue;
    const previous = seen.get(config.name);
    if (previous !== undefined && previous !== connectionFingerprint(config)) {
      throw new DataSourceConfigurationError(
        `El nombre de conexión «${config.name}» está declarado dos veces con ` +
          `destinos distintos. Los nombres lógicos deben ser únicos.`,
      );
    }
    seen.set(config.name, connectionFingerprint(config));
  }
}

/** El mínimo del pool no puede superar al máximo. */
function assertPoolBounds(config: PostgresConnectionConfig): void {
  if (config.pool.min > config.pool.max) {
    throw new DataSourceConfigurationError(
      `El pool de «${config.name}» declara un mínimo (${config.pool.min}) mayor ` +
        `que su máximo (${config.pool.max}).`,
    );
  }
}
