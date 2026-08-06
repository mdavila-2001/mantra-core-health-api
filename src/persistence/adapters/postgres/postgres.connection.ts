import type { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import {
  POSTGRES_CAPABILITIES,
  type AdapterCapabilities,
} from '../../capabilities/adapter-capabilities';
import {
  connectionFingerprint,
  type ConnectionRole,
  type PostgresConnectionConfig,
} from '../../config/connection-descriptor';
import { mapPostgresError } from '../../errors/postgres-error.mapper';
import type {
  ConnectionHealth,
  DataConnection,
} from '../../registry/data-connection.contract';

/**
 * Conexión PostgreSQL respaldada por una instancia de MikroORM.
 *
 * No abre un pool propio: envuelve el que MikroORM ya gestiona. Crear aquí un
 * `pg.Pool` paralelo daría dos pools por conexión lógica -uno del ORM y otro
 * nuestro- y el §41 lo prohíbe justamente porque el número de conexiones contra
 * el servidor es un recurso finito que hay que poder calcular.
 */
export class PostgresDataConnection implements DataConnection {
  readonly name: string;
  readonly engine = 'postgresql';
  readonly provider: string;
  readonly role: ConnectionRole;
  readonly capabilities: AdapterCapabilities;
  readonly fingerprint: string;

  /**
   * @param config descriptor ya validado.
   * @param orm instancia de MikroORM que respalda la conexión.
   * @param owned si esta conexión creó la instancia y debe cerrarla.
   *              Cuando la instancia la gestiona `OrmModule` -el caso de la
   *              conexión primaria compartida-, `owned` es `false` y `close()`
   *              no hace nada: cerrarla aquí desconectaría a los 60 módulos que
   *              aún usan el `EntityManager` directamente.
   * @param roleOverride papel efectivo, que puede ser `read-write` cuando una
   *                     misma instancia sirve a las dos rutas.
   */
  constructor(
    private readonly config: PostgresConnectionConfig,
    private readonly orm: MikroORM,
    private readonly owned: boolean,
    roleOverride?: ConnectionRole,
  ) {
    this.name = config.name;
    this.provider = config.provider;
    this.role = roleOverride ?? config.role;
    this.fingerprint = connectionFingerprint(config);
    this.capabilities = {
      ...POSTGRES_CAPABILITIES,
      // `readReplica` describe al despliegue, no al motor: solo es cierto si
      // esta conexión de lectura apunta a un servidor distinto del de
      // escritura. Lo fija la fábrica, que es quien ve las dos a la vez.
      readReplica: false,
    };
  }

  /**
   * `EntityManager` de esta conexión.
   *
   * Devuelve `orm.em`, que es el gestor global de MikroORM y resuelve por sí
   * solo al fork de la petición cuando hay un `RequestContext` activo. Devolver
   * un `fork()` nuevo en cada llamada rompería el Unit of Work de la petición:
   * dos adaptadores de la misma petición verían mapas de identidad distintos y
   * las entidades cargadas por uno no serían las mismas instancias que las del
   * otro.
   *
   * Es `internal` por convención: lo consumen los adaptadores de este mismo
   * directorio, nunca un servicio de dominio.
   */
  entityManager(): EntityManager {
    return this.orm.em;
  }

  /** Capacidades efectivas, con `readReplica` resuelto por la fábrica. */
  withCapabilities(capabilities: AdapterCapabilities): PostgresDataConnection {
    // Se muta la propiedad de solo lectura vía `Object.assign` porque la
    // alternativa -reconstruir la conexión- crearía un objeto distinto del que
    // ya pueda estar registrado, y el registro compara por identidad al cerrar.
    Object.assign(this, { capabilities });
    return this;
  }

  /**
   * Comprueba que la conexión responde.
   *
   * Nunca lanza: un health check que lanza obliga a cada llamante a envolverlo,
   * y el resultado que interesa -«está caída»- es una respuesta válida, no un
   * error. El motivo se normaliza antes de salir para no exponer el host ni el
   * usuario en una respuesta HTTP (§44).
   */
  async healthCheck(): Promise<ConnectionHealth> {
    const startedAt = process.hrtime.bigint();
    try {
      // `select 1` y no `isConnected()`: comprobar el estado del pool solo dice
      // que hay un socket abierto, no que el servidor conteste. Un primario en
      // recuperación acepta la conexión y rechaza la consulta.
      await this.orm.em.getConnection().execute('select 1');
      return {
        status: 'up',
        role: this.role,
        engine: this.engine,
        latencyMs: elapsedMs(startedAt),
      };
    } catch (error) {
      const normalized = mapPostgresError(error, {
        connectionName: this.name,
        engine: this.engine,
        operation: 'health-check',
      });
      return {
        status: 'down',
        role: this.role,
        engine: this.engine,
        latencyMs: elapsedMs(startedAt),
        reason: normalized.message,
      };
    }
  }

  /**
   * Cierra el pool si esta conexión es su dueña.
   *
   * La instancia primaria la cierra `OrmModule` a través del ciclo de vida de
   * NestJS; cerrarla también aquí produciría un segundo `close` sobre un pool
   * ya cerrado.
   */
  async close(): Promise<void> {
    if (!this.owned) return;
    await this.orm.close(true);
  }

  /** Descriptor, para que la fábrica compare sin volver a leer el entorno. */
  descriptor(): PostgresConnectionConfig {
    return this.config;
  }
}

/** Milisegundos transcurridos desde una marca de `process.hrtime.bigint()`. */
function elapsedMs(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}
