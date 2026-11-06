import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Abre el contexto de sistema de RLS en una transacción del límite de
 * autenticación: login, refresco, bloqueo por intentos fallidos y altas
 * públicas.
 *
 * En esos flujos todavía no hay organización elegida, así que
 * `app.current_tenant_id` está vacío. Con la API conectada como `mantra_app`
 * (RLS forzado, O3-1) las tablas con `tenant_id` —`directory.tenant_memberships`,
 * `authz.user_role_assignments`, `iam.account_lockouts`…— no devolvían filas ni
 * aceptaban inserciones: el token salía sin `tenants` (403 `TENANT_REQUIRED` en
 * toda ruta), el bloqueo por intentos daba 500 y las altas también.
 *
 * Es seguro porque cada consulta de esas transacciones va acotada al sujeto que
 * se autentica o se da de alta. `set_config(..., true)` vale sólo hasta el fin
 * de la transacción: no se filtra a la siguiente petición del pool.
 *
 * @param tx - Transacción abierta del flujo.
 */
export async function enterAuthBoundaryContext(
  tx: EntityManager,
): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'true', true)");
}
