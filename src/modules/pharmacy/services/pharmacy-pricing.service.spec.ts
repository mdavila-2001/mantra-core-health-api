import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyPricingService } from './pharmacy-pricing.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { PHARM } from '../pharmacy.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = { findById: mockFn() };
  const priceListsRepo = {
    findByPharmacyAndCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const productsRepo = { findById: mockFn() };
  const pricesRepo = {
    findActiveByListAndProduct: mockFn().mockResolvedValue([]),
    findActiveByList: mockFn().mockResolvedValue([]),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyPricingService(
    em as any,
    pharmaciesRepo as any,
    priceListsRepo,
    productsRepo as any,
    pricesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    pharmaciesRepo,
    priceListsRepo,
    productsRepo,
    pricesRepo,
  };
}

describe('PharmacyPricingService', () => {
  describe('createPriceList (UC-24-05)', () => {
    it('requires insurerTenantId for INSURER lists', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      await expect(
        d.service.createPriceList(
          'ph1',
          { code: 'PL', priceListType: 'INSURER' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects duplicated list code', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.priceListsRepo.findByPharmacyAndCode.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        d.service.createPriceList(
          'ph1',
          { code: 'PL', priceListType: 'PUBLIC' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a public price list', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.priceListsRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.priceListsRepo.create.mockReturnValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        code: 'PL',
        priceListTypeConceptId: PHARM.PRICE_LIST_TYPE_PUBLIC,
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.createPriceList(
        'ph1',
        { code: 'PL', priceListType: 'PUBLIC' } as any,
        actor,
      );
      expect(res).toMatchObject({ id: 'pl1', status: PHARM.PRICE_LIST_ACTIVE });
    });
  });

  describe('versionPrice (UC-24-06)', () => {
    it('throws when the price list is missing', async () => {
      const d = build();
      d.priceListsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.versionPrice(
          'ph1',
          'pl1',
          { pharmacyProductId: 'pr1', unitAmount: 10 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the price list is not active', async () => {
      const d = build();
      d.priceListsRepo.findById.mockResolvedValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRICE_LIST_CLOSED,
      });
      await expect(
        d.service.versionPrice(
          'ph1',
          'pl1',
          { pharmacyProductId: 'pr1', unitAmount: 10 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('supersedes previous version and inserts version max+1', async () => {
      const d = build();
      d.priceListsRepo.findById.mockResolvedValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        updatedAt: new Date(),
      });
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      });
      const prev = {
        statusConceptId: PHARM.PRICE_ACTIVE,
        effectiveTo: undefined,
      };
      d.pricesRepo.findActiveByListAndProduct.mockResolvedValue([prev]);
      d.pricesRepo.maxVersionNumber.mockResolvedValue(2);
      d.pricesRepo.create.mockReturnValue({
        id: 'price1',
        pharmacyPriceListId: 'pl1',
        pharmacyProductId: 'pr1',
        versionNumber: 3,
        unitAmount: '10',
        statusConceptId: PHARM.PRICE_ACTIVE,
        effectiveFrom: new Date(),
      });

      const res = await d.service.versionPrice(
        'ph1',
        'pl1',
        { pharmacyProductId: 'pr1', unitAmount: 10 },
        actor,
      );

      expect(res).toMatchObject({ versionNumber: 3 });
      expect(prev.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
      expect(d.pricesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ versionNumber: 3, unitAmount: '10' }),
      );
    });
  });

  describe('closePriceList (UC-24-10)', () => {
    it('rejects closing a non-active list', async () => {
      const d = build();
      d.priceListsRepo.findById.mockResolvedValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRICE_LIST_CLOSED,
      });
      await expect(
        d.service.closePriceList('ph1', 'pl1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('closes the list and supersedes its active prices', async () => {
      const d = build();
      const list = {
        id: 'pl1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      const price = {
        statusConceptId: PHARM.PRICE_ACTIVE,
        effectiveTo: undefined,
      };
      d.priceListsRepo.findById.mockResolvedValue(list);
      d.pricesRepo.findActiveByList.mockResolvedValue([price]);

      const res = await d.service.closePriceList('ph1', 'pl1', actor);
      expect(res).toEqual({ ok: true });
      expect(list.statusConceptId).toBe(PHARM.PRICE_LIST_CLOSED);
      expect(price.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
    });
  });
});
