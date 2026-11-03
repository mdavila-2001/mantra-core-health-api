import { expect } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';

/** Tenant activo de los escenarios de prueba. */
export const T1 = '11111111-1111-4111-8111-111111111111';
/** Otra organización: nada suyo debe ser visible desde `T1`. */
export const T2 = '22222222-2222-4222-8222-222222222222';

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
 * Exige el 404 uniforme de un recurso fuera de alcance: mismo `reason` de
 * `diagnostics` y sin `details`.
 *
 * @param promise - Operación que debe fallar.
 * @param reason - Sub-código esperado.
 * @returns La excepción, para comparar su cuerpo con el de otro caso.
 */
export async function expectNotAvailable(
  promise: Promise<unknown>,
  reason: DiagnosticsErrorReason = DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
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
