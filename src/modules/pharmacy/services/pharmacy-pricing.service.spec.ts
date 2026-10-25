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
  runWithTenant,
} from '../../../common';
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
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = {
    findByIdInTenant: mockFn().mockResolvedValue(pharmacyOf(T1)),
  };
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
  const referencesRepo = {
    practiceSiteBelongsToTenant: mockFn().mockResolvedValue(true),
    findPharmacySiteInPharmacy: mockFn().mockResolvedValue({
      id: 'site1',
      pharmacyId: 'ph1',
    }),
    isRegisteredInsurer: mockFn().mockResolvedValue(true),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyPricingService(
    em as any,
    pharmaciesRepo as any,
    priceListsRepo,
    productsRepo as any,
    pricesRepo as any,
    referencesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    pharmaciesRepo,
    priceListsRepo,
    productsRepo,
    pricesRepo,
    referencesRepo,
  };
}

describe('PharmacyPricingService', () => {
  describe('createPriceList (UC-24-05)', () => {
    it('requires insurerTenantId for INSURER lists', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      await expect(
        inTenant(() =>
          d.service.createPriceList(
            'ph1',
            { code: 'PL', priceListType: 'INSURER' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects duplicated list code', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.priceListsRepo.findByPharmacyAndCode.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        inTenant(() =>
          d.service.createPriceList(
            'ph1',
            { code: 'PL', priceListType: 'PUBLIC' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a public price list', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
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
      const res = await inTenant(() =>
        d.service.createPriceList(
          'ph1',
          { code: 'PL', priceListType: 'PUBLIC' } as any,
          actor,
        ),
      );
      expect(res).toMatchObject({ id: 'pl1', status: PHARM.PRICE_LIST_ACTIVE });
    });
  });

  describe('versionPrice (UC-24-06)', () => {
    it('throws when the price list is missing', async () => {
      const d = build();
      d.priceListsRepo.findById.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.versionPrice(
            'ph1',
            'pl1',
            { pharmacyProductId: 'pr1', unitAmount: 10 } as any,
            actor,
          ),
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
        inTenant(() =>
          d.service.versionPrice(
            'ph1',
            'pl1',
            { pharmacyProductId: 'pr1', unitAmount: 10 } as any,
            actor,
          ),
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

      const res = await inTenant(() =>
        d.service.versionPrice(
          'ph1',
          'pl1',
          { pharmacyProductId: 'pr1', unitAmount: 10 },
          actor,
        ),
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
        inTenant(() => d.service.closePriceList('ph1', 'pl1', actor)),
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

      const res = await inTenant(() =>
        d.service.closePriceList('ph1', 'pl1', actor),
      );
      expect(res).toEqual({ ok: true });
      expect(list.statusConceptId).toBe(PHARM.PRICE_LIST_CLOSED);
      expect(price.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
    });
  });

  describe('alcance de tenant y referencias (PHARM-01 / PHARM-02)', () => {
    const publicList = { code: 'PL', priceListType: 'PUBLIC' } as any;

    it('createPriceList sobre una farmacia de T2 responde igual que una inexistente y no escribe', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));
      const foreignError = await rejection(
        inTenant(() => d.service.createPriceList('ph2', publicList, actor)),
      );
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.createPriceList('ph2', publicList, actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.priceListsRepo.create).not.toHaveBeenCalled();
    });

    it('versionPrice y closePriceList exigen la farmacia del tenant antes de cargar la lista', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);

      const versionError = await rejection(
        inTenant(() =>
          d.service.versionPrice(
            'ph2',
            'pl1',
            { pharmacyProductId: 'pr1', unitAmount: 5 } as any,
            actor,
          ),
        ),
      );
      const closeError = await rejection(
        inTenant(() => d.service.closePriceList('ph2', 'pl1', actor)),
      );

      expect(versionError.reason).toBe(NOT_AVAILABLE);
      expect(closeError.reason).toBe(NOT_AVAILABLE);
      expect(d.priceListsRepo.findById).not.toHaveBeenCalled();
      expect(d.pricesRepo.create).not.toHaveBeenCalled();
    });

    it('una lista general sin sede ni aseguradora no consulta referencias', async () => {
      const d = build();
      d.priceListsRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.priceListsRepo.create.mockReturnValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        code: 'PL',
        priceListTypeConceptId: PHARM.PRICE_LIST_TYPE_PUBLIC,
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        createdAt: new Date(),
      });

      await inTenant(() => d.service.createPriceList('ph1', publicList, actor));

      expect(
        d.referencesRepo.findPharmacySiteInPharmacy,
      ).not.toHaveBeenCalled();
      expect(d.referencesRepo.isRegisteredInsurer).not.toHaveBeenCalled();
    });

    it('valida la sede contra la farmacia y la aseguradora contra las registradas', async () => {
      const d = build();
      d.priceListsRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.priceListsRepo.create.mockReturnValue({
        id: 'pl1',
        pharmacyId: 'ph1',
        code: 'PL',
        priceListTypeConceptId: PHARM.PRICE_LIST_TYPE_INSURER,
        statusConceptId: PHARM.PRICE_LIST_ACTIVE,
        createdAt: new Date(),
      });

      await inTenant(() =>
        d.service.createPriceList(
          'ph1',
          {
            code: 'PL',
            priceListType: 'INSURER',
            pharmacySiteId: 'site1',
            insurerTenantId: 'ins1',
          } as any,
          actor,
        ),
      );

      expect(d.referencesRepo.findPharmacySiteInPharmacy).toHaveBeenCalledWith(
        d.tx,
        'site1',
        'ph1',
      );
      expect(d.referencesRepo.isRegisteredInsurer).toHaveBeenCalledWith(
        d.tx,
        'ins1',
      );
      expect(d.priceListsRepo.create).toHaveBeenCalled();
    });

    it('rechaza una sede de otra farmacia con 404 y sin escribir', async () => {
      const d = build();
      d.referencesRepo.findPharmacySiteInPharmacy.mockResolvedValue(null);

      const error = await rejection(
        inTenant(() =>
          d.service.createPriceList(
            'ph1',
            { ...publicList, pharmacySiteId: 'site-t2' },
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(REFERENCE_NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.priceListsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('rechaza una aseguradora no registrada con 404 y sin escribir', async () => {
      const d = build();
      d.referencesRepo.isRegisteredInsurer.mockResolvedValue(false);

      const error = await rejection(
        inTenant(() =>
          d.service.createPriceList(
            'ph1',
            {
              code: 'PL',
              priceListType: 'INSURER',
              insurerTenantId: 'x',
            } as any,
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(REFERENCE_NOT_AVAILABLE);
      expect(d.priceListsRepo.create).not.toHaveBeenCalled();
    });
  });
});
