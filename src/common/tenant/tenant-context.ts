import { AsyncLocalStorage } from 'node:async_hooks';

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
