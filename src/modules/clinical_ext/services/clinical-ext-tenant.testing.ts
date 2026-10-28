import { DomainException, runWithTenant } from '../../../common';

/** Tenant activo que usan las pruebas de servicios de `clinical_ext`. */
export const ACTIVE_TENANT = 'ten-active';

/**
 * Envuelve un servicio para que cada método corra con el tenant activo del
 * contexto (lo que fija `TenantContextInterceptor` en una petición real).
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant que se pone en el contexto.
 * @returns El mismo servicio con cada método dentro de `runWithTenant`.
 */
export function inTenant<T extends object>(
  service: T,
  tenantId: string = ACTIVE_TENANT,
): T {
  return new Proxy(service, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () =>
          (value as (...a: unknown[]) => unknown).apply(target, args),
        );
    },
  });
}

/**
 * Espera una operación que tiene que fallar con una excepción de dominio.
 *
 * @param promise - Operación bajo prueba.
 * @returns La excepción que lanzó.
 * @throws Error si la operación terminó sin fallar.
 */
export async function thrown(
  promise: Promise<unknown>,
): Promise<DomainException> {
  try {
    await promise;
  } catch (error) {
    return error as DomainException;
  }
  throw new Error(
    'Se esperaba una excepción de dominio y la operación terminó sin error',
  );
}
