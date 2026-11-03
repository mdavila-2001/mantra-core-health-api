import { jest } from '@jest/globals';
import { DomainException, runWithTenant } from '../../../common';
import { DelegationScopeService } from './delegation-scope.service';

/** Tenant activo que usan las pruebas de servicios de `delegated_access`. */
export const ACTIVE_TENANT = 't1';

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

/** Dobles de los repositorios que consume la política de alcance. */
export interface ScopeDoubles {
  /** Repositorio de sets de permisos. */
  setsRepo: any;
  /** Repositorio de delegaciones. */
  delegatesRepo: any;
  /** Repositorio de asignaciones de usuario de organización. */
  orgAssignmentsRepo: any;
}

/**
 * Política común de alcance con repositorios en doble. Por defecto la membresía
 * es del tenant activo y del usuario `delegate-user`, y la asignación de rol, el
 * paciente y el encuentro `enc-1` (de `pat-1`) son del tenant activo.
 *
 * @param doubles - Dobles que el servicio bajo prueba comparte con la política.
 * @returns La política real y el doble de lecturas de otros módulos.
 */
export function buildScope(doubles: ScopeDoubles) {
  const scopeRepo = {
    membershipOf: mockFn().mockResolvedValue({
      tenantId: ACTIVE_TENANT,
      userId: 'delegate-user',
    }),
    roleAssignmentTenant: mockFn().mockResolvedValue(ACTIVE_TENANT),
    encounterScope: mockFn().mockResolvedValue({
      tenantId: ACTIVE_TENANT,
      patientProfileId: 'pat-1',
    }),
    patientExists: mockFn().mockResolvedValue(true),
  };
  const scope = new DelegationScopeService(
    doubles.setsRepo,
    doubles.delegatesRepo,
    doubles.orgAssignmentsRepo,
    scopeRepo as any,
  );
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
