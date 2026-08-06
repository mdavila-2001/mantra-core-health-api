import type { EntityManager } from '@mikro-orm/postgresql';
import type { PersistenceSession } from '../ports/session.port';
import type { TransactionContext } from '../ports/persistence-context';
import type { TransactionOptions } from '../ports/transaction.port';
import { PostgresTransactionContext } from '../adapters/postgres/postgres-transaction.manager';

/**
 * Sesión directa: el comportamiento de siempre.
 *
 * Usa el `EntityManager` inyectado sin pasar por el router, exactamente como
 * hacen hoy los 60 módulos. Es la vía de rollback del §47: si el enrutado
 * causara un problema en el módulo piloto, sacarlo de
 * `PERSISTENCE_PORTS_MODULES` lo devuelve a este camino sin desplegar código.
 *
 * No mide ni normaliza errores a propósito. Su valor está en ser idéntica al
 * comportamiento anterior; añadirle instrumentación la convertiría en un tercer
 * comportamiento distinto y dejaría de servir como punto de comparación.
 */
export class DirectPersistenceSession implements PersistenceSession {
  constructor(private readonly em: EntityManager) {}

  read<T>(
    _operation: string,
    work: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return work(this.em);
  }

  write<T>(
    _operation: string,
    work: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return work(this.em);
  }

  transaction<T>(
    _operation: string,
    work: (em: EntityManager, context: TransactionContext) => Promise<T>,
    _options: TransactionOptions = {},
  ): Promise<T> {
    return this.em.transactional((tx) =>
      work(tx, new PostgresTransactionContext(tx)),
    );
  }
}
