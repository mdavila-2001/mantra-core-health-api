import * as Joi from 'joi';

/**
 * Configuración por entorno de toda la capa de persistencia relacional.
 *
 * Dos consumidores muy distintos leen este archivo:
 *   - el arranque de NestJS, a través de `ConfigModule.forRoot({ validationSchema })`;
 *   - la CLI de MikroORM (`yarn orm ...`), que carga la configuración fuera del
 *     contenedor de dependencias y por tanto no puede usar `ConfigService`.
 *
 * Por eso la validación vive en una función pura (`loadOrmEnv`) y no en un
 * proveedor inyectable: se puede invocar desde cualquiera de los dos caminos.
 *
 * Principio de diseño: no hay valores por defecto para host, puerto ni
 * credenciales. Un default de `localhost` haría que un despliegue con la
 * variable mal escrita arrancara apuntando a una base equivocada en silencio;
 * sin default, falla en el primer segundo y con un mensaje que nombra la
 * variable que falta.
 */

/** Estrategia de sincronización del DDL en el arranque. */
export type SchemaSyncMode =
  /** No se toca la base. La estructura la gestiona un proceso externo (migraciones, DBA). */
  | 'off'
  /** Se calcula el DDL y se registra en el log, pero no se ejecuta. Útil para revisar en preproducción. */
  | 'dry-run'
  /** Se aplica el DDL en modo seguro: crea lo que falta y nunca borra ni destruye datos. */
  | 'safe';

/** Configuración ya validada y normalizada a tipos de dominio. */
export interface OrmEnv {
  /** Parámetros de conexión a PostgreSQL. */
  readonly connection: {
    /**
     * Valor de host mantenido por la instancia.
     */
    readonly host: string;
    /**
     * Valor de port mantenido por la instancia.
     */
    readonly port: number;
    /**
     * Valor de user mantenido por la instancia.
     */
    readonly user: string;
    /**
     * Valor de password mantenido por la instancia.
     */
    readonly password: string;
    /**
     * Valor de name mantenido por la instancia.
     */
    readonly name: string;
  };
  /**
   * Límites del pool de conexiones. Dimensionar esto importa: cada conexión de
   * PostgreSQL es un proceso del servidor con su propia memoria, así que un
   * `max` demasiado alto multiplicado por el número de réplicas de la API agota
   * `max_connections` del servidor y provoca rechazos de conexión bajo carga.
   */
  readonly pool: {
    /**
     * Valor de min mantenido por la instancia.
     */
    readonly min: number;
    /**
     * Valor de max mantenido por la instancia.
     */
    readonly max: number;
  };
  /** Comportamiento de la secuencia de arranque que materializa el DDL. */
  readonly schema: {
    /**
     * Valor de sync mode mantenido por la instancia.
     */
    readonly syncMode: SchemaSyncMode;
    /** Si true, tras sincronizar se compara la base real contra el modelo y se reporta la deriva. */
    readonly verifyFidelity: boolean;
  };
  /** Observabilidad de la capa de datos. */
  readonly observability: {
    /** Volcado íntegro de cada consulta. Solo para depuración local: es muy ruidoso. */
    readonly debug: boolean;
    /** Umbral en milisegundos a partir del cual una consulta se registra como lenta. */
    readonly slowQueryMs: number;
  };
}

/**
 * Esquema Joi que valida el entorno.
 *
 * `ConfigModule` lo aplica sobre `process.env` completo, por eso las claves son
 * los nombres crudos de las variables y no la forma anidada de `OrmEnv`.
 */
export const ormEnvSchema = Joi.object({
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Pool: el mínimo mantiene conexiones calientes para evitar el coste de
  // handshake TCP + autenticación en cada pico; el máximo acota el consumo.
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  // Arranque del DDL. El default es 'safe' porque el objetivo declarado del
  // servicio es levantar su propia estructura de forma idempotente.
  ORM_SCHEMA_SYNC: Joi.string().valid('off', 'dry-run', 'safe').default('safe'),
  ORM_VERIFY_FIDELITY: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),

  MIKRO_ORM_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),
  // 200 ms es el umbral por defecto: por debajo, el ruido supera a la señal en
  // un modelo con 1159 tablas; por encima, se pierden regresiones reales.
  ORM_SLOW_QUERY_MS: Joi.number().integer().min(1).default(200),
})
  // El entorno trae muchas más variables (Redis, S3, OpenSearch...). Validamos
  // las de persistencia sin rechazar las ajenas.
  .unknown(true);

/** Forma cruda del entorno una vez que Joi aplicó defaults y coerción de tipos. */
interface RawOrmEnv {
  /**
   * Valor de db host mantenido por la instancia.
   */
  DB_HOST: string;
  /**
   * Valor de db port mantenido por la instancia.
   */
  DB_PORT: number;
  /**
   * Valor de db user mantenido por la instancia.
   */
  DB_USER: string;
  /**
   * Valor de db password mantenido por la instancia.
   */
  DB_PASSWORD: string;
  /**
   * Valor de db name mantenido por la instancia.
   */
  DB_NAME: string;
  /**
   * Valor de db pool min mantenido por la instancia.
   */
  DB_POOL_MIN: number;
  /**
   * Valor de db pool max mantenido por la instancia.
   */
  DB_POOL_MAX: number;
  /**
   * Valor de orm schema sync mantenido por la instancia.
   */
  ORM_SCHEMA_SYNC: SchemaSyncMode;
  /**
   * Valor de orm verify fidelity mantenido por la instancia.
   */
  ORM_VERIFY_FIDELITY: boolean;
  /**
   * Valor de mikro orm debug mantenido por la instancia.
   */
  MIKRO_ORM_DEBUG: boolean;
  /**
   * Valor de orm slow query ms mantenido por la instancia.
   */
  ORM_SLOW_QUERY_MS: number;
}

/**
 * Valida el entorno y lo devuelve tipado.
 *
 * `abortEarly: false` acumula todos los errores en un solo mensaje: al levantar
 * un entorno nuevo interesa ver de una vez las cinco variables que faltan, no
 * descubrirlas de una en una en cinco reinicios.
 *
 * @param source entorno a validar; se parametriza para poder testearlo sin
 *               contaminar `process.env`.
 */
export function loadOrmEnv(source: NodeJS.ProcessEnv = process.env): OrmEnv {
  const result = ormEnvSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<RawOrmEnv>;

  if (result.error) {
    throw new Error(
      `Configuración de base de datos inválida: ${result.error.message}`,
    );
  }

  const v = result.value;

  if (v.DB_POOL_MIN > v.DB_POOL_MAX) {
    throw new Error(
      `Configuración de base de datos inválida: DB_POOL_MIN (${v.DB_POOL_MIN}) ` +
        `no puede superar a DB_POOL_MAX (${v.DB_POOL_MAX}).`,
    );
  }

  return {
    connection: {
      host: v.DB_HOST,
      port: v.DB_PORT,
      user: v.DB_USER,
      password: v.DB_PASSWORD,
      name: v.DB_NAME,
    },
    pool: { min: v.DB_POOL_MIN, max: v.DB_POOL_MAX },
    schema: {
      syncMode: v.ORM_SCHEMA_SYNC,
      verifyFidelity: v.ORM_VERIFY_FIDELITY,
    },
    observability: {
      debug: v.MIKRO_ORM_DEBUG,
      slowQueryMs: v.ORM_SLOW_QUERY_MS,
    },
  };
}
