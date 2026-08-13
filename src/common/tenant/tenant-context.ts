import { AsyncLocalStorage } from 'node:async_hooks';
import { PreconditionFailedException } from '../errors/domain.exception';

/** Contexto de tenant activo durante el procesamiento de una petición. */
export interface TenantContext {
  /** Tenant seleccionado por el request (cabecera `X-Tenant-Id`, ya verificado). */
  readonly tenantId: string;
}

/**
 * Almacén por-request del tenant activo. Lo fija el `TenantContextInterceptor`
 * tras verificar que el sujeto es miembro del tenant, y lo consumen la capa de
 * persistencia (para fijar `app.current_tenant_id`) y cualquier servicio que
 * necesite el tenant del contexto sin recibirlo por parámetro.
 */
const storage = new AsyncLocalStorage<TenantContext>();

/** Ejecuta `fn` con el tenant dado en el contexto asíncrono. */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

/** Tenant del contexto actual, o `undefined` si el request no fijó ninguno. */
export function getCurrentTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}

/**
 * Tenant del contexto, exigiéndolo.
 *
 * Lo usan las lecturas que listan filas de una tabla con `tenant_id`: servirlas
 * sin acotar sería una fuga entre organizaciones, y devolver una lista vacía
 * sería mentir sobre el motivo. `TenantContextInterceptor` fija el contexto para
 * todo sujeto que pertenezca a un tenant; queda sin fijar cuando el actor no
 * pertenece a ninguno o cuando un `SUPERADMIN` no indica `X-Tenant-Id`, y en
 * ambos casos lo correcto es decirlo.
 *
 * @returns El tenant activo.
 * @throws PreconditionFailedException si no hay tenant en el contexto.
 */
export function requireTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new PreconditionFailedException(
      'La operación requiere un tenant: indique X-Tenant-Id.',
      {},
    );
  }
  return tenantId;
}
