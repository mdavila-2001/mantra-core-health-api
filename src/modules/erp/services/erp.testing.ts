import { expect } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { ErpErrorReason } from '../erp.error-reasons';

/** Tenant activo de los escenarios de prueba. */
export const T1 = '11111111-1111-1111-1111-111111111111';
/** Otra organización: nada suyo debe ser visible desde `T1`. */
export const T2 = '99999999-9999-9999-9999-999999999999';

/**
 * Devuelve el servicio con cada método ejecutándose dentro del contexto de
 * `tenantId`, como lo deja el interceptor de tenant en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo; `T1` por defecto.
 * @returns El mismo servicio, con el contexto de tenant fijado en cada llamada.
 */
export function inTenant<T extends object>(
  service: T,
  tenantId: string = T1,
): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Exige el 404 uniforme de un recurso ERP fuera de alcance: mismo `reason` y
 * sin `details`.
 *
 * @param promise - Operación que debe fallar.
 * @param reason - Sub-código esperado; `ERP_RESOURCE_NOT_FOUND` por defecto.
 * @returns La excepción, para comparar su cuerpo con el de otro caso.
 */
export async function expectNotFound(
  promise: Promise<unknown>,
  reason: ErpErrorReason = ErpErrorReason.ERP_RESOURCE_NOT_FOUND,
): Promise<ResourceNotFoundException> {
  const error: unknown = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const notFound = error as ResourceNotFoundException;
  expect(notFound.getStatus()).toBe(404);
  expect(notFound.reason).toBe(reason);
  expect(notFound.details).toBeUndefined();
  return notFound;
}
