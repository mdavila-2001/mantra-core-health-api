import { expect, jest } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { ACCT } from '../accounting.concepts';
import type { AccountingErrorReason } from '../accounting.error-reasons';
import { AccountingScopeService } from './accounting-scope.service';

/** Loose-typed mock factory (evita los typings `Mock<never>` bajo el tsconfig raíz). */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Tenant activo de los escenarios de prueba. */
export const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
/** Otra organización: nada suyo debe ser visible desde `TENANT_A`. */
export const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/** Prácticas conocidas: `p1` y `p2` son del tenant A, `p-b` del tenant B. */
export const PRACTICE_TENANTS: Readonly<Record<string, string>> = {
  p1: TENANT_A,
  p2: TENANT_A,
  'p-b': TENANT_B,
};

/**
 * Devuelve el servicio con cada método ejecutándose dentro del contexto de
 * `tenantId`, como lo deja `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo; el A por defecto.
 * @returns El mismo servicio con el tenant fijado en cada llamada.
 */
export function inTenant<T extends object>(
  service: T,
  tenantId: string = TENANT_A,
): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Exige el 404 uniforme de un recurso contable fuera de alcance: mismo
 * `reason` y sin `details`.
 *
 * @param promise - Operación que debe fallar.
 * @param reason - Sub-código esperado.
 * @returns La excepción, para comparar su cuerpo con el de otro caso.
 */
export async function expectScopeNotFound(
  promise: Promise<unknown>,
  reason: AccountingErrorReason,
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

/** Dobles de los repositorios y del puerto de `practice` que usa la política. */
export interface ScopeDoubles {
  lookup: any;
  accountsRepo: any;
  fiscalRepo: any;
  journalRepo: any;
  controllingRepo: any;
  subledgerRepo: any;
  accrualRepo: any;
  assetRepo: any;
  liabilityRepo: any;
}

/**
 * Política de alcance de prueba. Por defecto todo lo que se consulta existe y
 * es de la práctica `p1` del tenant A, de modo que las pruebas de lógica de
 * negocio no tienen que armar el mundo; una prueba de alcance reemplaza el
 * doble que necesite con un recurso ajeno o ausente.
 *
 * @param overrides - Dobles propios que sustituyen a los de por defecto (los
 *   mismos que el servicio bajo prueba recibe, para que ambos vean los mismos datos).
 * @returns La política real sobre dobles, y los dobles.
 */
export function buildScope(overrides: Partial<ScopeDoubles> = {}): {
  scope: AccountingScopeService;
  doubles: ScopeDoubles;
} {
  const doubles: ScopeDoubles = {
    lookup: {
      findTenantOfPractice: mockFn(
        async (practiceId: string) => PRACTICE_TENANTS[practiceId] ?? null,
      ),
    },
    accountsRepo: {
      findByIds: mockFn(async (_em: unknown, ids: string[]) =>
        ids.map((id) => ({ id, practiceId: 'p1' })),
      ),
    },
    fiscalRepo: {
      findPeriodById: mockFn(async (_em: unknown, id: string) => ({
        id,
        fiscalYearId: 'fy1',
        statusConceptId: ACCT.PERIOD_OPEN,
      })),
      findYearById: mockFn(async (_em: unknown, id: string) => ({
        id,
        practiceId: 'p1',
      })),
    },
    journalRepo: {
      findTransactionById: mockFn().mockResolvedValue(null),
      findLedgerEntryById: mockFn(async (_em: unknown, id: string) => ({
        id,
        transactionId: 't1',
      })),
    },
    controllingRepo: {
      findCostCentersByIds: mockFn(async (_em: unknown, ids: string[]) =>
        ids.map((id) => ({ id, practiceId: 'p1' })),
      ),
      findProfitCentersByIds: mockFn(async (_em: unknown, ids: string[]) =>
        ids.map((id) => ({ id, tenantId: TENANT_A })),
      ),
    },
    subledgerRepo: {
      findSubledgerById: mockFn().mockResolvedValue(null),
      findOpenItemById: mockFn().mockResolvedValue(null),
      findCompanyBankAccountById: mockFn(async (_em: unknown, id: string) => ({
        id,
        tenantId: TENANT_A,
      })),
    },
    accrualRepo: { findObjectById: mockFn().mockResolvedValue(null) },
    assetRepo: {
      findDepreciationAreaById: mockFn(async (_em: unknown, id: string) => ({
        id,
        tenantId: TENANT_A,
      })),
    },
    liabilityRepo: { findById: mockFn().mockResolvedValue(null) },
  };
  Object.assign(doubles, overrides);
  const scope = new AccountingScopeService(
    doubles.lookup,
    doubles.accountsRepo,
    doubles.fiscalRepo,
    doubles.journalRepo,
    doubles.controllingRepo,
    doubles.subledgerRepo,
    doubles.accrualRepo,
    doubles.assetRepo,
    doubles.liabilityRepo,
  );
  return { scope, doubles };
}
