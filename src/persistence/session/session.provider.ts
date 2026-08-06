import type { Provider } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PersistenceSessionFactory } from '../factory/persistence-session.factory';
import { PostgresTransactionManager } from '../adapters/postgres/postgres-transaction.manager';
import {
  persistenceSessionToken,
  type PersistenceSession,
} from '../ports/session.port';
import { RoutedPersistenceSession } from './routed.session';
import { DirectPersistenceSession } from './direct.session';

/**
 * Interruptor de la migración progresiva.
 *
 * `PERSISTENCE_PORTS_MODULES` lista los módulos que ya operan por el enrutado
 * nuevo, separados por comas. Los que no aparecen siguen por el camino de
 * siempre. Es un flag **por módulo** y no global porque la migración es módulo a
 * módulo (§47): un interruptor global obligaría a mover los 60 a la vez, que es
 * lo que el §59 prohíbe.
 *
 * Su valor por defecto es la lista vacía, es decir, nadie migrado (§48: valor
 * seguro). Activar el piloto es añadir `scheduling`, y revertirlo es quitarlo.
 */
export const PERSISTENCE_PORTS_MODULES_VAR = 'PERSISTENCE_PORTS_MODULES';

/** Si un módulo debe usar el enrutado nuevo. */
export function isModuleRouted(
  module: string,
  source: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = source[PERSISTENCE_PORTS_MODULES_VAR];
  if (!raw) return false;
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(module);
}

/**
 * Proveedor de la sesión de un módulo.
 *
 * El módulo de dominio lo registra una vez e inyecta el token en sus
 * adaptadores. Elegir aquí -y no dentro del adaptador- mantiene la decisión de
 * configuración fuera del código de acceso a datos.
 *
 * @param module nombre del módulo, tal y como aparece en la tabla de enrutado.
 */
export function createPersistenceSessionProvider(module: string): Provider {
  return {
    provide: persistenceSessionToken(module),
    useFactory: (
      em: EntityManager,
      sessions: PersistenceSessionFactory,
      transactions: PostgresTransactionManager,
    ): PersistenceSession =>
      isModuleRouted(module)
        ? new RoutedPersistenceSession(module, sessions, transactions)
        : new DirectPersistenceSession(em),
    inject: [
      EntityManager,
      PersistenceSessionFactory,
      PostgresTransactionManager,
    ],
  };
}
