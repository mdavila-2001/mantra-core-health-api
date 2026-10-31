import type { EntityManager } from '@mikro-orm/postgresql';
import { isRlsEnforced, withTenantContext } from './tenant-context';

/**
 * Corre `work` en una transacción NUEVA de la organización: con RLS encendido
 * fija su contexto antes de leer o escribir (`set_config` local a la
 * transacción), y lo deja al terminar con ella. Es lo que usan los barridos
 * (`SYSTEM`), que recorren varias organizaciones sin una activa.
 *
 * @param em - Contexto de persistencia (se bifurca; nunca se reutiliza su estado).
 * @param tenantId - Organización ya verificada (de la propia base, no del cliente).
 * @param work - Trabajo de la organización; recibe la transacción.
 * @returns Lo que devuelva `work`.
 */
export async function inTenantTransaction<T>(
  em: EntityManager,
  tenantId: string,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  return em
    .fork()
    .transactional((tx) =>
      isRlsEnforced()
        ? withTenantContext(tx, tenantId, () => work(tx))
        : work(tx),
    );
}
