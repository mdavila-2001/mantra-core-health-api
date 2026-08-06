import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  ReadContext,
  TransactionContext,
  WriteContext,
} from './persistence-context';
import type { TransactionOptions } from './transaction.port';

/**
 * Sesión de persistencia de un módulo: la única dependencia que un adaptador
 * necesita para hablar con la base.
 *
 * Existe para que la migración progresiva del §47 cueste poco. Un adaptador
 * escrito contra esta interfaz funciona igual con el enrutado nuevo que con el
 * `EntityManager` de siempre, así que activar o revertir un módulo es cambiar
 * qué implementación se inyecta -no reescribir el adaptador ni mantener dos
 * copias del servicio-.
 *
 * Que las tres operaciones entreguen un `EntityManager` es una concesión
 * consciente al punto de partida: los 412 repositorios de este backend ya están
 * escritos contra él, y reescribirlos todos a la vez es justo lo que el §59
 * prohíbe. La abstracción que sí se gana es **quién decide la conexión**: ya no
 * el servicio, sino el enrutado.
 */
export interface PersistenceSession {
  /** Ejecuta una lectura por la ruta de lectura del módulo. */
  read<T>(
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context?: ReadContext,
  ): Promise<T>;

  /** Ejecuta una escritura por la ruta de escritura del módulo. */
  write<T>(
    operation: string,
    work: (em: EntityManager) => Promise<T>,
    context?: WriteContext,
  ): Promise<T>;

  /**
   * Ejecuta un bloque dentro de una transacción de la ruta de escritura.
   *
   * El trabajo recibe el `EntityManager` transaccional y el contexto opaco que
   * hay que propagar a cualquier puerto que se invoque dentro, para que sus
   * operaciones ocurran en la misma transacción y no fuera de ella.
   */
  transaction<T>(
    operation: string,
    work: (em: EntityManager, context: TransactionContext) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
}

/** Token de inyección de la sesión de un módulo. */
export function persistenceSessionToken(module: string): string {
  return `PERSISTENCE_SESSION:${module}`;
}
