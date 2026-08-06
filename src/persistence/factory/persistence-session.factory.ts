import { Inject, Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PostgresDataConnection } from '../adapters/postgres/postgres.connection';
import { unwrapTransaction } from '../adapters/postgres/postgres-transaction.manager';
import { assertCapability } from '../capabilities/adapter-capabilities';
import {
  ConnectionUnavailableError,
  PersistenceError,
} from '../errors/persistence.errors';
import { mapPostgresError } from '../errors/postgres-error.mapper';
import type { ReadContext, WriteContext } from '../ports/persistence-context';
import { PersistenceMetrics } from '../observability/persistence.metrics';
import { DataSourceRouter } from '../routing/data-source.router';
import { READ_FALLBACK_STRATEGY } from '../persistence.tokens';
import type { ReadFallbackStrategy } from '../config/data-sources.env';

/**
 * Fábrica de sesiones de persistencia: el papel que el §13 asigna al registro
 * de adaptadores.
 *
 * Un adaptador concreto -por ejemplo el de la agenda- no resuelve conexiones ni
 * mide nada: pide una sesión de lectura o de escritura para su módulo y recibe
 * un `EntityManager` ya enrutado, ya instrumentado y con los errores ya
 * normalizados. Todo lo que este backend quiere garantizar de forma transversal
 * -que las escrituras no vayan a la réplica, que un desvío se registre, que un
 * `23505` no llegue a un servicio como error del driver- ocurre aquí y en un
 * solo sitio.
 *
 * No contiene lógica de negocio y no conoce ninguna entidad.
 */
@Injectable()
export class PersistenceSessionFactory {
  constructor(
    private readonly router: DataSourceRouter,
    private readonly metrics: PersistenceMetrics,
    @Inject(READ_FALLBACK_STRATEGY)
    private readonly readFallback: ReadFallbackStrategy,
    @Optional() private readonly logger?: PinoLogger,
  ) {
    this.logger?.setContext(PersistenceSessionFactory.name);
  }

  /**
   * Ejecuta una lectura por la ruta de lectura del módulo.
   *
   * Si hay una transacción activa en el contexto, la lectura ocurre dentro de
   * ella y no se enruta: leer fuera de la transacción que está escribiendo
   * devolvería el estado anterior, y con réplica devolvería el de un servidor
   * que aún no ha visto nada (§30).
   *
   * @param module módulo que origina la lectura.
   * @param operation nombre lógico, para métricas y trazas.
   * @param work trabajo a ejecutar con el `EntityManager` resuelto.
   * @param context contexto de lectura: transacción y consistencia exigida.
   */
  async read<T>(
    module: string,
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context: ReadContext = {},
  ): Promise<T> {
    const inTransaction = unwrapTransaction(context.transaction);
    if (inTransaction) {
      return this.run(work, inTransaction, {
        connectionName: 'transaction',
        engine: 'postgresql',
        operation,
        kind: 'read',
      });
    }

    const resolved = this.router.resolve({
      module,
      operation: 'read',
      consistency: context.consistency,
      tenantId: context.tenantId,
    });
    const em = this.entityManagerOf(
      resolved.connection,
      resolved.connectionName,
    );

    try {
      return await this.run(work, em, {
        connectionName: resolved.connectionName,
        engine: resolved.connection.engine,
        operation,
        kind: 'read',
        redirected: resolved.redirected,
      });
    } catch (error) {
      return this.handleReadFailure(error, module, operation, work, {
        name: resolved.connectionName,
        fingerprint: resolved.connection.fingerprint,
      });
    }
  }

  /**
   * Ejecuta una escritura por la ruta de escritura del módulo.
   *
   * Exige que el destino soporte transacciones aunque esta operación concreta
   * no abra ninguna: una ruta de escritura sin transacciones no puede sostener
   * el patrón outbox que este backend ya usa, y descubrirlo en la primera
   * escritura sería descubrirlo tarde.
   */
  async write<T>(
    module: string,
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context: WriteContext = {},
  ): Promise<T> {
    const inTransaction = unwrapTransaction(context.transaction);
    if (inTransaction) {
      return this.run(work, inTransaction, {
        connectionName: 'transaction',
        engine: 'postgresql',
        operation,
        kind: 'write',
      });
    }

    const resolved = this.router.resolve({
      module,
      operation: 'write',
      tenantId: context.tenantId,
    });
    assertCapability(resolved.connection.capabilities, 'transactions', {
      connectionName: resolved.connectionName,
      engine: resolved.connection.engine,
      requestedBy: `${module}.${operation}`,
    });
    const em = this.entityManagerOf(
      resolved.connection,
      resolved.connectionName,
    );

    return this.run(work, em, {
      connectionName: resolved.connectionName,
      engine: resolved.connection.engine,
      operation,
      kind: 'write',
    });
  }

  /**
   * Aplica la estrategia de fallback de lectura (§33).
   *
   * Solo se desvía ante un fallo de conexión: un `23505` o un error de sintaxis
   * fallarían igual contra la primaria, y reintentarlos allí solo serviría para
   * duplicar la carga y el ruido. El desvío se registra siempre con motivo,
   * conexiones implicadas y duración -nunca en silencio-.
   */
  private async handleReadFailure<T>(
    error: unknown,
    module: string,
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    original: { name: string; fingerprint: string },
  ): Promise<T> {
    const normalized =
      error instanceof PersistenceError ? error : mapPostgresError(error);

    if (
      this.readFallback !== 'fallback-to-primary' ||
      !(normalized instanceof ConnectionUnavailableError)
    ) {
      throw normalized;
    }

    // Sin réplica no hay a dónde desviarse: si la primaria es el mismo pool que
    // acaba de fallar, reintentar allí solo duplicaría el fallo y el tiempo de
    // respuesta. La comparación es por huella y no por nombre, porque los dos
    // nombres lógicos pueden apuntar a la misma instancia.
    const primary = this.router.resolve({ module, operation: 'write' });
    if (primary.connection.fingerprint === original.fingerprint)
      throw normalized;

    const startedAt = process.hrtime.bigint();
    const em = this.entityManagerOf(primary.connection, primary.connectionName);
    const result = await this.run(work, em, {
      connectionName: primary.connectionName,
      engine: primary.connection.engine,
      operation,
      kind: 'read',
      fellBack: true,
    });
    this.logger?.warn(
      {
        motivo: normalized.name,
        conexionOriginal: original.name,
        conexionFallback: primary.connectionName,
        operacion: `${module}.${operation}`,
        duracionMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
      },
      'Lectura desviada a la conexión primaria tras fallo de la de lectura.',
    );
    return result;
  }

  /** `EntityManager` de una conexión, exigiendo que sea de PostgreSQL. */
  private entityManagerOf(
    connection: { engine: string },
    connectionName: string,
  ): EntityManager {
    if (!(connection instanceof PostgresDataConnection)) {
      throw mapPostgresError(
        new Error(
          `La conexión «${connectionName}» es de motor «${connection.engine}» y ` +
            `todavía no tiene adaptador de puertos. Revisa la tabla de enrutado.`,
        ),
        { connectionName },
      );
    }
    return connection.entityManager();
  }

  /** Ejecuta el trabajo midiendo y normalizando el error. */
  private async run<T>(
    work: (em: EntityManager) => Promise<T>,
    em: EntityManager,
    labels: {
      connectionName: string;
      engine: string;
      operation: string;
      kind: 'read' | 'write';
      redirected?: boolean;
      fellBack?: boolean;
    },
  ): Promise<T> {
    const startedAt = process.hrtime.bigint();
    try {
      const result = await work(em);
      this.metrics.record({
        ...labels,
        durationMs: elapsedMs(startedAt),
        outcome: 'ok',
      });
      return result;
    } catch (error) {
      const normalized = mapPostgresError(error, {
        connectionName: labels.connectionName,
        engine: labels.engine,
        operation: labels.operation,
      });
      this.metrics.record({
        ...labels,
        durationMs: elapsedMs(startedAt),
        outcome: 'error',
        errorType: normalized.name,
      });
      throw normalized;
    }
  }
}

/** Milisegundos transcurridos desde una marca de `process.hrtime.bigint()`. */
function elapsedMs(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}
