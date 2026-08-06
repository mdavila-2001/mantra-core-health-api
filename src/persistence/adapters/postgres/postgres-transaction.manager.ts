import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { assertCapability } from '../../capabilities/adapter-capabilities';
import { mapPostgresError } from '../../errors/postgres-error.mapper';
import type {
  TransactionManager,
  TransactionOptions,
} from '../../ports/transaction.port';
import type { TransactionContext } from '../../ports/persistence-context';
import { DataSourceRouter } from '../../routing/data-source.router';
import { PostgresDataConnection } from './postgres.connection';
import { PersistenceMetrics } from '../../observability/persistence.metrics';

/**
 * Contexto transaccional de PostgreSQL.
 *
 * Envuelve el `EntityManager` transaccional que entrega MikroORM. La aplicación
 * lo recibe como `TransactionContext` opaco y se lo devuelve a los puertos sin
 * mirar dentro; solo los adaptadores de este directorio lo desenvuelven.
 */
export class PostgresTransactionContext implements TransactionContext {
  /** Marca estructural exigida por el contrato del puerto. */
  readonly __transaction = 'postgres' as const;

  constructor(readonly em: EntityManager) {}
}

/**
 * Desenvuelve un contexto transaccional de PostgreSQL.
 *
 * Devuelve `undefined` si el contexto no es de este motor, en vez de lanzar: un
 * puerto puede recibir una transacción abierta por otro adaptador y lo correcto
 * entonces es operar fuera de ella, no romper.
 */
export function unwrapTransaction(
  transaction: TransactionContext | undefined,
): EntityManager | undefined {
  return transaction instanceof PostgresTransactionContext
    ? transaction.em
    : undefined;
}

/**
 * Gestor de transacciones sobre la ruta de escritura.
 *
 * Resuelve la conexión por el router y no por inyección directa del
 * `EntityManager`: así una transacción no puede abrirse contra la réplica ni
 * contra la conexión administrativa, porque el router no las ofrece para
 * escribir (§55).
 */
@Injectable()
export class PostgresTransactionManager implements TransactionManager {
  constructor(
    private readonly router: DataSourceRouter,
    private readonly metrics: PersistenceMetrics,
  ) {}

  /**
   * Ejecuta `operation` dentro de una transacción de la conexión de escritura.
   *
   * @param operation trabajo a ejecutar; recibe el contexto transaccional.
   * @param options nivel de aislamiento y nombre lógico de la operación.
   */
  async execute<T>(
    operation: (transaction: TransactionContext) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    const label = options.operation ?? 'transaction';
    const resolved = this.router.resolve({
      module: 'persistence',
      operation: 'write',
    });
    const connection = resolved.connection;

    // Que el motor destino soporte transacciones no es una suposición: se
    // exige. Sin esto, enrutar un módulo a Redis y llamar aquí devolvería una
    // atomicidad inexistente sin un solo error (§15).
    assertCapability(connection.capabilities, 'transactions', {
      connectionName: resolved.connectionName,
      engine: connection.engine,
      requestedBy: label,
    });

    if (!(connection instanceof PostgresDataConnection)) {
      // El router resolvió a un motor que este gestor no sabe manejar. Es un
      // fallo de configuración, no de datos, y debe verse como tal.
      throw mapPostgresError(
        new Error(
          `La conexión «${resolved.connectionName}» no es PostgreSQL; ` +
            `este gestor de transacciones no puede atenderla.`,
        ),
        { connectionName: resolved.connectionName, operation: label },
      );
    }

    const startedAt = process.hrtime.bigint();
    try {
      const result = await connection.entityManager().transactional(
        (em) => operation(new PostgresTransactionContext(em as EntityManager)),
        options.isolationLevel ? { isolationLevel: options.isolationLevel } : {},
      );
      this.metrics.record({
        connectionName: resolved.connectionName,
        engine: connection.engine,
        operation: label,
        kind: 'write',
        durationMs: elapsedMs(startedAt),
        outcome: 'ok',
      });
      return result;
    } catch (error) {
      const normalized = mapPostgresError(error, {
        connectionName: resolved.connectionName,
        engine: connection.engine,
        operation: label,
      });
      this.metrics.record({
        connectionName: resolved.connectionName,
        engine: connection.engine,
        operation: label,
        kind: 'write',
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
