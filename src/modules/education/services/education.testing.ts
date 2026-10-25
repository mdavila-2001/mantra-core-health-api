import { expect } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { EducationErrorReason } from '../education.error-reasons';

/** Tenant activo de los escenarios de prueba. */
export const T1 = '11111111-aaaa-4111-8111-111111111111';
/** Otra organización: nada suyo debe ser visible desde `T1`. */
export const T2 = '22222222-bbbb-4222-8222-222222222222';

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
 * Exige el 404 uniforme de un recurso fuera de alcance: `reason`
 * `EDUCATION_RESOURCE_OUT_OF_SCOPE` y sin `details`.
 *
 * @param promise - Operación que debe fallar.
 * @returns La excepción, para comparar su cuerpo con el de otro caso.
 */
export async function expectOutOfScope(
  promise: Promise<unknown>,
): Promise<ResourceNotFoundException> {
  const error: unknown = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const notFound = error as ResourceNotFoundException;
  expect(notFound.getStatus()).toBe(404);
  expect(notFound.reason).toBe(
    EducationErrorReason.EDUCATION_RESOURCE_OUT_OF_SCOPE,
  );
  expect(notFound.details).toBeUndefined();
  return notFound;
}
