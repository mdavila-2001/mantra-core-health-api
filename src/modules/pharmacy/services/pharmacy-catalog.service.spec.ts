import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyCatalogService } from './pharmacy-catalog.service';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PHARM } from '../pharmacy.concepts';

const T1 = 't1';
const T2 = 't2';
const NOT_AVAILABLE = PharmacyErrorReason.PHARMACY_NOT_AVAILABLE;
const REFERENCE_NOT_AVAILABLE =
  PharmacyErrorReason.PHARMACY_REFERENCE_NOT_AVAILABLE;

/** Administrador con membresía en T1, el tenant activo de los tests. */
const actor = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;

/** Ejecuta `fn` con T1 como tenant activo del request. */
const inTenant = <T>(fn: () => Promise<T>, tenantId = T1): Promise<T> =>
  runWithTenant(tenantId, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

/** Farmacia activa de un tenant, como la devuelve el repositorio. */
const pharmacyOf = (tenantId: string, extra: object = {}) => ({
  id: 'ph1',
  tenantId,
  statusConceptId: PHARM.PHARMACY_ACTIVE,
  ...extra,
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const forked = {};
  const em = { fork: mockFn(() => forked) };
  const pharmaciesRepo = {
    findByIdInTenant: mockFn().mockResolvedValue(pharmacyOf(T1)),
  };
  const productsRepo = { findByPharmacyAndStatus: mockFn() };
  const pricesRepo = { findActiveByProduct: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyCatalogService(
    em as any,
    pharmaciesRepo as any,
    productsRepo as any,
    pricesRepo as any,
    logger as any,
  );
  return { service, em, pharmaciesRepo, productsRepo, pricesRepo };
}

describe('PharmacyCatalogService (UC-24-11)', () => {
  it('throws when the pharmacy does not exist', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(
      inTenant(() => d.service.projectCatalog('ph1', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('projects active products with their active prices', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T1));
    d.productsRepo.findByPharmacyAndStatus.mockResolvedValue([
      { id: 'pr1', productCode: 'P-1', brandName: 'Acme' },
    ]);
    d.pricesRepo.findActiveByProduct.mockResolvedValue([
      { pharmacyPriceListId: 'pl1', unitAmount: '10', versionNumber: 1 },
    ]);

    const res = await inTenant(() => d.service.projectCatalog('ph1', actor));

    expect(res.productCount).toBe(1);
    expect(res.entries[0]).toMatchObject({
      productId: 'pr1',
      productCode: 'P-1',
    });
    expect(res.entries[0].prices[0]).toMatchObject({
      priceListId: 'pl1',
      unitAmount: '10',
    });
    expect(d.em.fork).toHaveBeenCalled();
    expect(d.productsRepo.findByPharmacyAndStatus).toHaveBeenCalledWith(
      expect.anything(),
      'ph1',
      PHARM.PRODUCT_ACTIVE,
    );
  });

  describe('alcance de tenant (PHARM-01)', () => {
    it('no proyecta el catálogo de una farmacia de T2', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));

      const error = await rejection(
        inTenant(() => d.service.projectCatalog('ph2', actor)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.productsRepo.findByPharmacyAndStatus).not.toHaveBeenCalled();
    });
  });
});
