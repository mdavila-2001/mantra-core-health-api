import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { PharmacyInventoryScopePolicy } from './pharmacy-inventory-scope.policy';

/** Tenant y farmacia que resuelve la política permisiva de las pruebas. */
export const SCOPE_TENANT_ID = 'tenant-1';
export const SCOPE_PHARMACY_ID = 'pharmacy-1';

/**
 * Política de ámbito que lo deja pasar todo, para las pruebas de un caso de
 * uso cuyo foco no es el ámbito. Cada método es un `jest.fn` para poder
 * afirmar con qué argumentos se invocó o sustituir su comportamiento por un
 * rechazo. La lógica real de pertenencia se prueba en
 * `pharmacy-inventory-scope.policy.spec.ts`.
 */
export function allowAllScope(): jest.Mocked<PharmacyInventoryScopePolicy> {
  const policy = {
    notAvailable: jest.fn(
      () =>
        new ResourceNotFoundException(
          'Recurso de farmacia no disponible',
          undefined,
          PharmacyInventoryErrorReason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE,
        ),
    ),
    inconsistent: jest.fn(
      (detail: string) =>
        new PreconditionFailedException(
          'Los datos de inventario no son consistentes con la farmacia',
          { detail },
          PharmacyInventoryErrorReason.PHARMACY_INVENTORY_SCOPE_INCONSISTENT,
        ),
    ),
    requireManagedPharmacy: jest.fn(
      async (_tx: unknown, pharmacyId: string) => ({
        tenantId: SCOPE_TENANT_ID,
        pharmacyId,
      }),
    ),
    requireManagedSite: jest.fn(async (_tx: unknown, siteId: string) => ({
      tenantId: SCOPE_TENANT_ID,
      pharmacyId: SCOPE_PHARMACY_ID,
      siteId,
    })),
    requireSite: jest.fn(
      async (_tx: unknown, pharmacy: object, siteId: string) => ({
        ...pharmacy,
        siteId,
      }),
    ),
    requireLocation: jest.fn(
      async (_tx: unknown, site: { siteId: string }, id: string) => ({
        id,
        pharmacySiteId: site.siteId,
      }),
    ),
    requireLocationInPharmacy: jest.fn(
      async (_tx: unknown, _p: object, id: string) => ({
        id,
        pharmacySiteId: 'site-1',
      }),
    ),
    requireStockKey: jest.fn(async () => undefined),
    assertStoredStockKey: jest.fn(async () => undefined),
    requireProduct: jest.fn(async () => undefined),
    requireLot: jest.fn(async () => undefined),
    requirePatientContext: jest.fn(async () => undefined),
    resolveStoredLocation: jest.fn(
      async (_tx: unknown, pharmacy: object, locationId: string) => ({
        ...pharmacy,
        siteId: 'site-1',
        locationId,
      }),
    ),
    requireManagedProduct: jest.fn(async () => ({
      tenantId: SCOPE_TENANT_ID,
      pharmacyId: SCOPE_PHARMACY_ID,
    })),
    requireManagedConnection: jest.fn(async (_tx: unknown, _id: string) => ({
      tenantId: SCOPE_TENANT_ID,
      pharmacyId: SCOPE_PHARMACY_ID,
    })),
  };
  return policy as unknown as jest.Mocked<PharmacyInventoryScopePolicy>;
}

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Tenants del mundo de prueba. */
export const WORLD_T1 = 'tenant-1';
export const WORLD_T2 = 'tenant-2';

/**
 * Mundo de prueba de dos tenants. T1: farmacia `ph-1` → sede `site-1` →
 * ubicaciones `loc-1` y `loc-2` (`site-2` es otra sede de la misma farmacia),
 * producto `prod-1` → lote `lot-1`. T2 tiene la cadena equivalente con sufijo 2.
 */
export function buildScopeWorld() {
  const pharmacies = new Map([
    ['ph-1', { id: 'ph-1', tenantId: WORLD_T1 }],
    ['ph-2', { id: 'ph-2', tenantId: WORLD_T2 }],
  ]);
  const sites = new Map([
    ['site-1', { id: 'site-1', pharmacyId: 'ph-1' }],
    ['site-1b', { id: 'site-1b', pharmacyId: 'ph-1' }],
    ['site-2', { id: 'site-2', pharmacyId: 'ph-2' }],
  ]);
  const locations = new Map([
    ['loc-1', { id: 'loc-1', pharmacySiteId: 'site-1' }],
    ['loc-1b', { id: 'loc-1b', pharmacySiteId: 'site-1b' }],
    ['loc-2', { id: 'loc-2', pharmacySiteId: 'site-2' }],
    ['loc-orphan', { id: 'loc-orphan', pharmacySiteId: 'site-missing' }],
  ]);
  const products = new Map([
    ['prod-1', { id: 'prod-1', pharmacyId: 'ph-1' }],
    ['prod-2', { id: 'prod-2', pharmacyId: 'ph-2' }],
  ]);
  const lots = new Map([
    ['lot-1', { id: 'lot-1', pharmacyProductId: 'prod-1' }],
    ['lot-2', { id: 'lot-2', pharmacyProductId: 'prod-2' }],
  ]);
  const connections = new Map([
    ['conn-1', { id: 'conn-1', pharmacyId: 'ph-1' }],
    ['conn-2', { id: 'conn-2', pharmacyId: 'ph-2' }],
  ]);
  const repo = {
    findPharmacyInTenant: mockFn(
      async (_tx: unknown, id: string, tenantId: string) => {
        const pharmacy = pharmacies.get(id);
        return pharmacy && pharmacy.tenantId === tenantId ? pharmacy : null;
      },
    ),
    findSite: mockFn(async (_tx: unknown, id: string) => sites.get(id) ?? null),
    findSiteInPharmacy: mockFn(
      async (_tx: unknown, id: string, pharmacyId: string) => {
        const site = sites.get(id);
        return site && site.pharmacyId === pharmacyId ? site : null;
      },
    ),
    findLocation: mockFn(
      async (_tx: unknown, id: string) => locations.get(id) ?? null,
    ),
    findLocationInSite: mockFn(
      async (_tx: unknown, id: string, siteId: string) => {
        const location = locations.get(id);
        return location && location.pharmacySiteId === siteId ? location : null;
      },
    ),
    findProduct: mockFn(
      async (_tx: unknown, id: string) => products.get(id) ?? null,
    ),
    findProductInPharmacy: mockFn(
      async (_tx: unknown, id: string, pharmacyId: string) => {
        const product = products.get(id);
        return product && product.pharmacyId === pharmacyId ? product : null;
      },
    ),
    findLot: mockFn(async (_tx: unknown, id: string) => lots.get(id) ?? null),
    findConnection: mockFn(
      async (_tx: unknown, id: string) => connections.get(id) ?? null,
    ),
    patientExists: mockFn(async (_tx: unknown, id: string) =>
      ['pat-1', 'pat-foreign'].includes(id),
    ),
    medicationRequestBelongsToPatient: mockFn(
      async (_tx: unknown, id: string, patientId: string) =>
        (id === 'rx-1' && patientId === 'pat-1') ||
        (id === 'rx-foreign' && patientId === 'pat-foreign'),
    ),
    // Relación con la farmacia: `pat-1` y `rx-1` son de la farmacia de T1;
    // `pat-foreign` y `rx-foreign` existen pero no tienen relación con ella.
    patientServedByPharmacy: mockFn(
      async (_tx: unknown, id: string) => id === 'pat-1',
    ),
    medicationRequestServedByPharmacy: mockFn(
      async (_tx: unknown, id: string) => id === 'rx-1',
    ),
  };
  const policy = new PharmacyInventoryScopePolicy(repo as any);
  return { policy, repo };
}
