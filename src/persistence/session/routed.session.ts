import type { EntityManager } from '@mikro-orm/postgresql';
import type { PersistenceSession } from '../ports/session.port';
import type {
  ReadContext,
  TransactionContext,
  WriteContext,
} from '../ports/persistence-context';
import type { TransactionOptions } from '../ports/transaction.port';
import { PersistenceSessionFactory } from '../factory/persistence-session.factory';
import {
  PostgresTransactionContext,
  PostgresTransactionManager,
} from '../adapters/postgres/postgres-transaction.manager';

/**
 * Sesión enrutada: la implementación nueva.
 *
 * Cada operación pasa por el router, se mide y se le normalizan los errores.
 * Es la que se activa cuando un módulo entra en `PERSISTENCE_PORTS_MODULES`.
 */
export class RoutedPersistenceSession implements PersistenceSession {
  constructor(
    private readonly module: string,
    private readonly sessions: PersistenceSessionFactory,
    private readonly transactions: PostgresTransactionManager,
  ) {}

  read<T>(
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context: ReadContext = {},
  ): Promise<T> {
    return this.sessions.read(this.module, operation, work, context);
  }

  write<T>(
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context: WriteContext = {},
  ): Promise<T> {
    return this.sessions.write(this.module, operation, work, context);
  }

  transaction<T>(
    operation: string,
    work: (em: EntityManager, context: TransactionContext) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    return this.transactions.execute(
      (transaction) => {
        // El gestor entrega el contexto opaco; el `EntityManager` que hay
        // dentro se desenvuelve aquí, una sola vez, para que el adaptador no
        // tenga que conocer la clase concreta del contexto.
        const em = (transaction as PostgresTransactionContext).em;
        return work(em, transaction);
      },
      { ...options, operation: options.operation ?? `${this.module}.${operation}` },
    );
  }
}
