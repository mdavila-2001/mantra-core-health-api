import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Ejecuta `work` en una transacción que se CONFIRMA al terminar `work`, aunque la
 * petición siga abierta.
 *
 * Con `RLS_ENFORCE=true` el `TenantContextInterceptor` envuelve el handler entero
 * en una transacción (para fijar `app.current_tenant_id`), y un
 * `em.transactional` dentro de ella es anidado: no confirma nada hasta que la
 * petición termina, y si la petición falla (por ejemplo un 504 de la pasarela) se
 * revierte con todo lo demás. Eso es justo lo que no sirve para la reserva del
 * despacho: tiene que ser visible para las otras transacciones ANTES de llamar a
 * la pasarela y sobrevivir a un fallo posterior de la petición.
 *
 * - Sin transacción de petición (`RLS_ENFORCE` apagado): es un `transactional`
 *   normal, que ya confirma al terminar.
 * - Con ella: se abre la transacción en un `EntityManager` bifurcado (otra
 *   conexión, sin heredar la transacción de la petición) y se fija en ella el
 *   mismo contexto de tenant que fijó el interceptor, para que las políticas RLS
 *   acoten sus consultas igual. Los bloqueos que tome se sueltan al confirmar,
 *   no cuando termina la petición.
 *
 * @param em - `EntityManager` del servicio (el de contexto).
 * @param tenantId - Tenant verificado de la petición; sólo se usa en el caso aislado.
 * @param work - Trabajo transaccional; recibe el `EntityManager` de la transacción.
 */
export async function runCommitted<T>(
  em: EntityManager,
  tenantId: string,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  if (!em.isInTransaction()) return em.transactional(work);
  return em.fork().transactional(async (tx) => {
    await tx.execute("select set_config('app.system_context', 'false', true)");
    await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
      tenantId,
    ]);
    return work(tx);
  });
}
