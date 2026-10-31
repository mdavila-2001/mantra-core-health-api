import type { EntityManager } from '@mikro-orm/postgresql';
import type { TransactionEventArgs } from '@mikro-orm/core';

/** ¿La transacción del evento es un savepoint (anidada) y no la raíz? */
function isSavepoint(transaction: unknown): boolean {
  return (
    typeof transaction === 'object' &&
    transaction !== null &&
    'savepointName' in transaction
  );
}

/**
 * Corre `run` cuando la transacción que rodea al llamador YA terminó de verdad
 * (V-4). Con `RLS_ENFORCE=true` `TenantContextInterceptor` envuelve cada
 * petición en una transacción y el `em.transactional` de un servicio es un
 * SAVEPOINT: al volver de él lo escrito todavía NO está confirmado, y quien
 * avisa a otras réplicas (invalidar una caché por Redis) en ese momento deja que
 * una lectura concurrente guarde la lista vieja. Aquí:
 *
 * - sin transacción alrededor (la propia ya confirmó, o no hay `em` real en una
 *   prueba), `run` corre al instante;
 * - dentro de una, `run` espera al COMMIT de la transacción RAÍZ; el commit o el
 *   rollback de un savepoint no cuenta;
 * - si la raíz se REVIERTE también corre: una caché pudo guardar lo no
 *   confirmado y debe soltarlo.
 *
 * Corre a lo sumo una vez y un fallo suyo no rompe la transacción que acaba de
 * terminar (el aviso es de mejor esfuerzo: el TTL acotado es el respaldo).
 *
 * @param em - Contexto de persistencia (el global o uno activo).
 * @param run - Lo que debe ocurrir tras el commit real.
 */
export function afterCommit(em: EntityManager, run: () => void): void {
  const context =
    typeof em?.getContext === 'function' ? em.getContext(false) : undefined;
  if (!context?.getTransactionContext?.()) {
    run();
    return;
  }
  let done = false;
  const settle = (args: TransactionEventArgs): void => {
    if (done || isSavepoint(args.transaction)) return;
    done = true;
    try {
      run();
    } catch {
      // Mejor esfuerzo: la transacción ya terminó y no se desanda por un aviso.
    }
  };
  context.getEventManager().registerSubscriber({
    afterTransactionCommit: settle,
    afterTransactionRollback: settle,
  });
}
