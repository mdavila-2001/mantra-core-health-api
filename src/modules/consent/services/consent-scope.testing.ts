import { jest } from '@jest/globals';
import { DomainException, runWithTenant } from '../../../common';
import { ConsentScopeService } from './consent-scope.service';

/** Tenant activo que usan las pruebas de servicios de `consent`. */
export const ACTIVE_TENANT = 'ten-active';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

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
 * Política común de alcance con repositorios en doble: por defecto el paciente
 * y el propósito existen y la base legal es del tenant activo y del propósito
 * `pp1`.
 *
 * @returns La política real y sus dobles, para ajustar cada caso.
 */
export function buildScope() {
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'p1' }),
  };
  const purposesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'pp1' }),
  };
  const legalBasesRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'lb1',
      tenantId: ACTIVE_TENANT,
      processingPurposeId: 'pp1',
    }),
  };
  const scope = new ConsentScopeService(
    patientProfilesRepo as any,
    purposesRepo as any,
    legalBasesRepo as any,
  );
  return { scope, patientProfilesRepo, purposesRepo, legalBasesRepo };
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
