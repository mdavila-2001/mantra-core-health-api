import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { loadOrmEnv, type OrmEnv } from './orm.env';
import { createOrmLoggerFactory } from '../observability/orm.logger';
import { HistoryMirrorSubscriber } from '../subscribers/history-mirror.subscriber';

/**
 * Configuración de runtime de MikroORM para la capa relacional PostgreSQL.
 *
 * La consumen dos caminos distintos y por eso es una función pura sobre el
 * entorno, no un proveedor de NestJS:
 *   - `OrmModule`, vía `MikroOrmModule.forRoot(buildOrmConfig())`;
 *   - la CLI (`yarn orm ...`), que resuelve `src/mikro-orm.config.ts`.
 *
 * La configuración del generador de entidades por introspección vive aparte, en
 * `orm.generator.config.ts`, para no arrastrar `@mikro-orm/entity-generator`
 * (que es devDependency) al bundle de producción.
 */

/**
 * Nombre con el que la aplicación se identifica ante PostgreSQL.
 *
 * Aparece en `pg_stat_activity.application_name`, así que permite a un DBA
 * atribuir una conexión o una consulta bloqueante a este servicio sin adivinar.
 * Es la pieza de observabilidad más barata que existe en la capa de datos.
 */
const APPLICATION_NAME = 'mantra-redesa-health-api';

/**
 * Construye la configuración a partir del entorno ya validado.
 *
 * @param env entorno; se inyecta para poder construir configuraciones alternas
 *            en tests sin tocar `process.env`.
 */
export function buildOrmConfig(env: OrmEnv = loadOrmEnv()) {
  return defineConfig({
    host: env.connection.host,
    port: env.connection.port,
    // Rol de runtime opcional sujeto a RLS. Si se define `DB_APP_USER`
    // (p. ej. `mantra_app`, sin BYPASSRLS) la app opera bajo las políticas de
    // aislamiento por tenant; el rol propietario (`DB_USER`) se reserva para
    // migraciones/DDL/seed. Requiere `ORM_SCHEMA_SYNC=off` (no puede alterar el
    // esquema al no ser propietario).
    user: process.env.DB_APP_USER ?? env.connection.user,
    password: process.env.DB_APP_PASSWORD ?? env.connection.password,
    dbName: env.connection.name,

    // Descubrimiento de entidades. En producción se leen los .js compilados; en
    // desarrollo, los .ts, que es lo que necesita el proveedor de metadata
    // basado en el AST de TypeScript.
    entities: ['dist/modules/**/entities/*.entity.js'],
    entitiesTs: ['src/modules/**/entities/*.entity.ts'],

    // Las entidades declaran el tipo de columna de forma explícita en cada
    // decorador (`type` o `columnType`), pero el proveedor de ts-morph sigue
    // siendo necesario para resolver los tipos TypeScript de las propiedades
    // opcionales sin `emitDecoratorMetadata` fiable en uniones. La metadata se
    // cachea en disco: el coste de analizar 1159 archivos se paga una vez.
    metadataProvider: TsMorphMetadataProvider,

    // Caché de metadata en disco. Sin ella, cada arranque vuelve a analizar con
    // ts-morph los 1159 archivos de entidad.
    //
    // El directorio se mueve fuera del árbol del proyecto a propósito: el valor
    // por defecto es `<cwd>/temp`, y el adaptador de archivos escribe un JSON
    // por entidad, de modo que con este modelo aparecían 1159 archivos sueltos
    // en la raíz del repositorio. Bajo `node_modules/.cache` quedan donde
    // corresponde a un artefacto derivado y ya ignorado por git.
    metadataCache: {
      enabled: true,
      pretty: false,
      options: { cacheDir: 'node_modules/.cache/mikro-orm' },
    },

    discovery: {
      // El descubrimiento recorre 57 módulos; sin esto, cada carpeta sin
      // entidades emite una advertencia y ahoga el log de arranque.
      warnWhenNoEntities: false,
      // Dos entidades que apunten a la misma tabla, o dos propiedades a la misma
      // columna, indican una regeneración mal hecha. Se deja activo (es el valor
      // por defecto) porque es exactamente la clase de deriva que este proyecto
      // quiere detectar en el arranque y no en producción.
      checkDuplicateTableNames: true,
      checkDuplicateFieldNames: true,
    },

    // Pool de conexiones. Ver la justificación de los límites en `orm.env.ts`.
    pool: { min: env.pool.min, max: env.pool.max },

    // `driverOptions` viaja tal cual a la configuración del cliente `pg`, donde
    // `application_name` es una opción de primer nivel. No anidarla bajo
    // `connection`: esa clave la reserva `pg` para inyectar un objeto Connection
    // propio y pasarle un literal rompe el establecimiento de la conexión.
    driverOptions: { application_name: APPLICATION_NAME },

    // Todas las marcas temporales del modelo son `timestamptz`. Forzar UTC evita
    // que la zona horaria del contenedor se cuele en las conversiones y produzca
    // desplazamientos de horas en historiales clínicos.
    forceUtcTimezone: true,

    // Las claves foráneas no se derivan de las entidades (las columnas FK están
    // mapeadas como uuid escalares, sin `@ManyToOne`, para no acoplar los 57
    // módulos): las declara el catálogo y las aplica la capa 06 del arranque.
    // Desactivarlo aquí evita que el generador de esquema borre en un diff las
    // restricciones que él no reconoce como suyas.
    schemaGenerator: {
      createForeignKeyConstraints: false,
      disableForeignKeys: false,
    },

    // Espejo de versionado (REDESA §2): puebla `audit.<tabla>_history` en cada
    // flush para todo agregado con tabla de historial, dentro de su transacción.
    subscribers: [new HistoryMirrorSubscriber()],

    // `debug` activa el volcado de cada consulta; el logger propio decide luego
    // qué nivel usar y qué registrar siempre (las consultas lentas).
    debug: env.observability.debug,
    loggerFactory: createOrmLoggerFactory(env.observability.slowQueryMs),
  });
}

/** Configuración por defecto, la que resuelve la CLI de MikroORM. */
export default buildOrmConfig();
