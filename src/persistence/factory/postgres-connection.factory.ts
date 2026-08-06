import { MikroORM } from '@mikro-orm/postgresql';
import { buildOrmConfig } from '../../orm/config/orm.config';
import { loadOrmEnv } from '../../orm/config/orm.env';
import {
  areEquivalent,
  type PostgresConnectionConfig,
} from '../config/connection-descriptor';
import type { ResolvedDataSources } from '../config/data-sources.env';
import { PostgresDataConnection } from '../adapters/postgres/postgres.connection';
import { POSTGRES_CAPABILITIES } from '../capabilities/adapter-capabilities';
import type { ConnectionRegistry } from '../registry/connection.registry';

/**
 * Construye las conexiones PostgreSQL y las publica en el registro.
 *
 * La decisión que justifica que esta pieza exista es una sola: **cuándo abrir un
 * segundo pool y cuándo no**. Abrirlo siempre sería lo cómodo de programar y lo
 * caro de operar -una segunda instancia de MikroORM vuelve a descubrir 1184
 * entidades y duplica su metadata en memoria-, además de duplicar las conexiones
 * contra el servidor sin que nadie lo haya pedido. Por eso la fábrica compara
 * huellas antes de crear nada (§12).
 */
export interface PostgresConnectionFactoryDeps {
  /** Instancia primaria, la que ya gestiona `OrmModule`. */
  readonly primaryOrm: MikroORM;
  /** Registro donde publicar las conexiones. */
  readonly registry: ConnectionRegistry;
  /** Fuentes de datos ya resueltas desde el entorno. */
  readonly dataSources: ResolvedDataSources;
  /** Traza de arranque. Recibe mensajes ya sanitizados. */
  readonly log?: (message: string) => void;
}

/**
 * Crea una instancia adicional de MikroORM para una conexión distinta.
 *
 * Reutiliza `buildOrmConfig` para heredar el descubrimiento de entidades, la
 * caché de metadata y los suscriptores: una segunda configuración escrita a mano
 * divergiría de la primera en cuanto alguien cambiara una y no la otra.
 *
 * `contextName` es obligatorio para que MikroORM no confunda las dos instancias
 * en su registro global, y `allowGlobalContext` queda en `false` para conservar
 * la garantía de que toda operación ocurra dentro de un contexto de petición.
 */
async function createAdditionalOrm(
  config: PostgresConnectionConfig,
): Promise<MikroORM> {
  const base = buildOrmConfig(loadOrmEnv());
  return MikroORM.init({
    ...base,
    contextName: config.name,
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    dbName: config.database,
    pool: { min: config.pool.min, max: config.pool.max },
    driverOptions: {
      ...(base.driverOptions as Record<string, unknown>),
      ...(config.ssl ? { ssl: { rejectUnauthorized: true } } : {}),
    },
    // La instancia secundaria NUNCA toca el DDL. El esquema lo materializa el
    // arranque de la primaria, y una segunda instancia intentando lo mismo
    // competiría por el advisory lock del bootstrap. Además, la conexión de
    // lectura se autentica con un rol que -si el mínimo privilegio se aplicó
    // bien- ni siquiera puede crear una tabla.
    schemaGenerator: { createForeignKeyConstraints: false, disableForeignKeys: false },
  });
}

/**
 * Publica las conexiones de lectura y escritura en el registro.
 *
 * Devuelve las instancias creadas por la fábrica -no la primaria- para que el
 * módulo pueda cerrarlas en el apagado.
 */
export async function registerPostgresConnections(
  deps: PostgresConnectionFactoryDeps,
): Promise<MikroORM[]> {
  const { primaryOrm, registry, dataSources, log } = deps;
  const { write, read, sharesConnection } = dataSources;
  const created: MikroORM[] = [];

  if (sharesConnection) {
    // Escenario A del §9: una sola instancia sirviendo a las dos rutas. Se
    // publica bajo los dos nombres lógicos para que el enrutado no tenga que
    // saber si hay uno o dos pools; el papel es `read-write`, que es la verdad.
    const shared = new PostgresDataConnection(
      { ...write, role: 'read-write' },
      primaryOrm,
      false,
      'read-write',
    );
    registry.register(shared, [read.name]);
    log?.(
      `Persistencia: «${write.name}» y «${read.name}» son equivalentes; ` +
        `comparten un único pool (${shared.fingerprint}).`,
    );
    return created;
  }

  // Rutas distintas: la primaria atiende la escritura y se abre un pool nuevo
  // para la lectura.
  const writeConnection = new PostgresDataConnection(write, primaryOrm, false);
  registry.register(writeConnection);

  const readOrm = await createAdditionalOrm(read);
  created.push(readOrm);
  const readConnection = new PostgresDataConnection(read, readOrm, true);
  // `readReplica` solo es cierto si la lectura apunta a otro servidor. Cuando
  // la separación es únicamente de credencial -mismo host, rol lector-, no hay
  // réplica y declararla llevaría al enrutado a asumir un retraso que no existe
  // y, peor, a permitir rutas de consistencia eventual que aquí no aplican.
  const differentServer =
    read.host !== write.host || read.port !== write.port;
  readConnection.withCapabilities({
    ...POSTGRES_CAPABILITIES,
    readReplica: differentServer,
  });
  registry.register(readConnection);

  log?.(
    `Persistencia: rutas separadas. Escritura en «${writeConnection.fingerprint}», ` +
      `lectura en «${readConnection.fingerprint}»` +
      `${differentServer ? ' (servidor distinto: se asume réplica).' : ' (mismo servidor, distinto rol).'}`,
  );
  return created;
}

/**
 * Comprueba que dos descriptores no sean equivalentes por accidente.
 *
 * Lo usa la prueba del §57-4 y el informe de arranque. Se expone aquí para que
 * la regla de equivalencia tenga un único dueño.
 */
export function describeEquivalence(
  a: PostgresConnectionConfig,
  b: PostgresConnectionConfig,
): { equivalent: boolean; reason: string } {
  if (areEquivalent(a, b)) {
    return {
      equivalent: true,
      reason: 'Mismo motor, host, puerto, base, usuario y modo TLS.',
    };
  }
  const differences: string[] = [];
  if (a.host !== b.host) differences.push('host');
  if (a.port !== b.port) differences.push('puerto');
  if (a.user !== b.user) differences.push('usuario');
  if (a.database !== b.database) differences.push('base');
  if (a.ssl !== b.ssl) differences.push('TLS');
  return {
    equivalent: false,
    reason: `Difieren en: ${differences.join(', ')}.`,
  };
}
