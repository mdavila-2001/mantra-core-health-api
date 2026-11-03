import { jest } from '@jest/globals';
import { DomainException, runWithTenant } from '../../../common';
import { AuthzClinicalScopeService } from './authz-clinical-scope.service';

/** Tenant activo que usan las pruebas de servicios de `authz`. */
export const ACTIVE_TENANT = 't1';

/** Paciente con vínculo en el tenant activo. */
export const PATIENT_IN_TENANT = 'pat-1';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Envuelve un servicio para que cada método corra con el tenant dado en el
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
 * Política de alcance real con las lecturas de otros módulos en doble. Por
 * defecto el paciente `pat-1` existe y tiene vínculo con el tenant activo; el
 * encuentro `enc-1` y el consentimiento `con-1` son del tenant activo y de `pat-1`.
 *
 * @returns La política real y el doble de lecturas.
 */
export function buildClinicalScope() {
  const scopeRepo = {
    patientExists: mockFn((_tx: unknown, id: string) =>
      Promise.resolve(id === PATIENT_IN_TENANT),
    ),
    patientHasFootprintInTenant: mockFn(
      (_tx: unknown, id: string, tenantId: string) =>
        Promise.resolve(id === PATIENT_IN_TENANT && tenantId === ACTIVE_TENANT),
    ),
    encounterScope: mockFn((_tx: unknown, id: string) =>
      Promise.resolve(
        id === 'enc-1'
          ? { tenantId: ACTIVE_TENANT, patientProfileId: PATIENT_IN_TENANT }
          : null,
      ),
    ),
    consentScope: mockFn((_tx: unknown, id: string) =>
      Promise.resolve(
        id === 'con-1'
          ? { tenantId: ACTIVE_TENANT, patientProfileId: PATIENT_IN_TENANT }
          : null,
      ),
    ),
  };
  const scope = new AuthzClinicalScopeService(scopeRepo as any);
  return { scope, scopeRepo };
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
