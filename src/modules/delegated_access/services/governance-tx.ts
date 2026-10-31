import type { EntityManager } from '@mikro-orm/postgresql';
import { isRlsEnforced, withTenantContext } from './tenant-context';

/**
 * Abre una transacción acotada a una organización VERIFICADA (la del contexto o
 * la que el servicio comprobó contra los vínculos de la persona; nunca la del
 * cuerpo sin comprobar). Con RLS fija `app.current_tenant_id` en la transacción;
 * sin RLS es una transacción común.
 *
 * Lo usan las rutas `@TenantAgnostic` que escriben dentro de una organización.
 *
 * @param em - Contexto de persistencia raíz.
 * @param tenantId - Organización de la transacción.
 * @param work - Trabajo dentro de la transacción.
 * @returns Lo que devuelva `work`.
 */
export function inTenantTransaction<T>(
  em: EntityManager,
  tenantId: string,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  return em.transactional((tx) =>
    // N-5: si ya hay una transacción alrededor esta es un savepoint y el
    // contexto fijado no se revierte al liberarlo: se restaura el previo.
    isRlsEnforced()
      ? withTenantContext(tx, tenantId, () => work(tx))
      : work(tx),
  );
}
