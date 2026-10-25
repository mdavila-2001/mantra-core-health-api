import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyProductsService } from './pharmacy-products.service';
import { BadRequestException } from '@nestjs/common';
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
  const productsRepo = {
    findByPharmacyAndCode: mockFn(),
    findById: mockFn(),
    findByPharmacyAndCatalog: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const catalogRepo = {
    findProductById: mockFn(),
    findVademecumConceptIdByAtc: mockFn().mockResolvedValue(null),
  };
  const identifiersRepo = { create: mockFn() };
  const pricesRepo = { findActiveByProduct: mockFn().mockResolvedValue([]) };
  const mappingsRepo = { findActiveByProduct: mockFn().mockResolvedValue([]) };
  const readRepo = { findConcepts: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyProductsService(
    em as any,
    pharmaciesRepo as any,
    productsRepo as any,
    identifiersRepo,
    pricesRepo as any,
    mappingsRepo as any,
    readRepo as any,
    catalogRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    pharmaciesRepo,
    productsRepo,
    catalogRepo,
    identifiersRepo,
    pricesRepo,
    mappingsRepo,
    readRepo,
  };
}

describe('PharmacyProductsService', () => {
  describe('publishProduct (UC-24-04)', () => {
    it('rejects when the pharmacy is not active', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_DRAFT,
      });
      await expect(
        inTenant(() =>
          d.service.publishProduct('ph1', { productCode: 'P-1' } as any, actor),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated product code', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.productsRepo.findByPharmacyAndCode.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        inTenant(() =>
          d.service.publishProduct('ph1', { productCode: 'P-1' } as any, actor),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('publishes the product and its identifiers, flushing parent before children', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.productsRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.productsRepo.create.mockReturnValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        productCode: 'P-1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        createdAt: new Date(),
      });

      const res = await inTenant(() =>
        d.service.publishProduct(
          'ph1',
          {
            productCode: 'P-1',
            identifiers: [{ identifierType: 'GTIN', identifierValue: '123' }],
          } as any,
          actor,
        ),
      );

      expect(res).toMatchObject({ id: 'pr1', identifierCount: 1 });
      expect(d.identifiersRepo.create).toHaveBeenCalledTimes(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });
  });

  describe('publishProduct desde el catálogo universal', () => {
    /** Un producto real del catálogo (CIMA) con dos presentaciones vendibles. */
    const catalogProduct = {
      id: 'cat-1',
      source: 'cima',
      code: '60885',
      display: 'DALSYDOL 400 MG COMPRIMIDOS',
      strengthText: '400 mg',
      requiresPrescription: true,
      activeIngredients: [{ name: 'IBUPROFENO', amount: '400', unit: 'mg' }],
      atc: ['M01AE01'],
      presentations: [
        {
          code: '700001',
          name: 'DALSYDOL 400 mg, 20 comprimidos',
          gtin: null,
          active: true,
        },
        {
          code: '700002',
          name: 'DALSYDOL 400 mg, 40 comprimidos',
          gtin: null,
          active: true,
        },
        { code: '700003', name: 'dada de baja', gtin: null, active: false },
      ],
      regulatoryStatus: 'ACTIVE',
      selectable: true,
    };

    function ready() {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.productsRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.productsRepo.create.mockReturnValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        productCode: 'SKU-1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        createdAt: new Date(),
      });
      d.catalogRepo.findProductById.mockResolvedValue(catalogProduct);
      d.catalogRepo.findVademecumConceptIdByAtc.mockResolvedValue('vad-ibu');
      return d;
    }

    it('deriva marca, genérico, concentración, presentación, receta y vademécum del registro oficial', async () => {
      const d = ready();
      await inTenant(() =>
        d.service.publishProduct(
          'ph1',
          {
            productCode: 'SKU-1',
            catalogProductId: 'cat-1',
            catalogPresentationCode: '700002',
          } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.findVademecumConceptIdByAtc).toHaveBeenCalledWith(
        d.tx,
        ['M01AE01'],
      );
      expect(d.productsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          catalogProductConceptId: 'cat-1',
          catalogPresentationCode: '700002',
          brandName: 'DALSYDOL 400 MG COMPRIMIDOS',
          genericName: 'IBUPROFENO',
          strengthText: '400 mg',
          packageSizeText: 'DALSYDOL 400 mg, 40 comprimidos',
          requiresPrescription: true,
          medicationConceptId: 'vad-ibu',
        }),
      );
    });

    it('rechaza (404) un id que no es del catálogo', async () => {
      const d = ready();
      d.catalogRepo.findProductById.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.publishProduct(
            'ph1',
            { productCode: 'SKU-1', catalogProductId: 'nope' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.productsRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza (422) un registro sanitario que no está vigente', async () => {
      const d = ready();
      d.catalogRepo.findProductById.mockResolvedValue({
        ...catalogProduct,
        selectable: false,
        regulatoryStatus: 'REVOKED',
      });
      await expect(
        inTenant(() =>
          d.service.publishProduct(
            'ph1',
            { productCode: 'SKU-1', catalogProductId: 'cat-1' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it.each([
      'brandName',
      'genericName',
      'strengthText',
      'packageSizeText',
      'requiresPrescription',
      'medicationConceptId',
    ])(
      'rechaza (400) que se mande %s junto al id del catálogo',
      async (field) => {
        const d = ready();
        await expect(
          inTenant(() =>
            d.service.publishProduct(
              'ph1',
              {
                productCode: 'SKU-1',
                catalogProductId: 'cat-1',
                catalogPresentationCode: '700001',
                [field]: 'x',
              } as any,
              actor,
            ),
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(d.productsRepo.create).not.toHaveBeenCalled();
      },
    );

    it('con más de una presentación vendible exige elegir cuál (400)', async () => {
      const d = ready();
      await expect(
        inTenant(() =>
          d.service.publishProduct(
            'ph1',
            { productCode: 'SKU-1', catalogProductId: 'cat-1' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza (400) una presentación ajena o dada de baja', async () => {
      const d = ready();
      for (const code of ['999999', '700003']) {
        await expect(
          inTenant(() =>
            d.service.publishProduct(
              'ph1',
              {
                productCode: 'SKU-1',
                catalogProductId: 'cat-1',
                catalogPresentationCode: code,
              } as any,
              actor,
            ),
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
      }
    });

    it('rechaza (400) una presentación sin producto del catálogo', async () => {
      const d = ready();
      await expect(
        inTenant(() =>
          d.service.publishProduct(
            'ph1',
            { productCode: 'SKU-1', catalogPresentationCode: '700001' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza (409) cargar dos veces el mismo producto y presentación', async () => {
      const d = ready();
      d.productsRepo.findByPharmacyAndCatalog.mockResolvedValue({ id: 'ya' });
      await expect(
        inTenant(() =>
          d.service.publishProduct(
            'ph1',
            {
              productCode: 'SKU-2',
              catalogProductId: 'cat-1',
              catalogPresentationCode: '700001',
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.productsRepo.findByPharmacyAndCatalog).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        'cat-1',
        '700001',
      );
    });

    it('un producto con una sola presentación no obliga a elegirla, y sin ATC conocido queda sin medicamento', async () => {
      const d = ready();
      d.catalogRepo.findProductById.mockResolvedValue({
        ...catalogProduct,
        presentations: [catalogProduct.presentations[0]],
      });
      d.catalogRepo.findVademecumConceptIdByAtc.mockResolvedValue(null);
      await inTenant(() =>
        d.service.publishProduct(
          'ph1',
          { productCode: 'SKU-1', catalogProductId: 'cat-1' } as any,
          actor,
        ),
      );
      const data = d.productsRepo.create.mock.calls[0][1];
      expect(data.medicationConceptId).toBeUndefined();
      expect(data.packageSizeText).toBeUndefined();
      expect(d.productsRepo.findByPharmacyAndCatalog).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        'cat-1',
        null,
      );
    });

    it('sin catalogProductId el alta sigue como antes (producto cargado a mano)', async () => {
      const d = ready();
      await inTenant(() =>
        d.service.publishProduct(
          'ph1',
          {
            productCode: 'SKU-1',
            brandName: 'Manual',
            genericName: 'X',
          } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.findProductById).not.toHaveBeenCalled();
      expect(d.productsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ brandName: 'Manual', genericName: 'X' }),
      );
    });
  });

  describe('updateProduct sobre un producto del catálogo universal', () => {
    it('rechaza (400) corregir los datos oficiales de un producto vinculado al catálogo', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        tenantId: T1,
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_ACTIVE,
      });
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        catalogProductConceptId: 'cat-1',
      });
      await expect(
        inTenant(() =>
          d.service.updateProduct(
            'ph1',
            'pr1',
            { brandName: 'Otra' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });

  describe('retireProduct (UC-24-09)', () => {
    it('throws when the product does not exist / belongs to another pharmacy', async () => {
      const d = build();
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'other',
      });
      await expect(
        inTenant(() => d.service.retireProduct('ph1', 'pr1', actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects retiring a product that is not active', async () => {
      const d = build();
      d.productsRepo.findById.mockResolvedValue({
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_RETIRED,
      });
      await expect(
        inTenant(() => d.service.retireProduct('ph1', 'pr1', actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('retires product, supersedes prices and inactivates mappings', async () => {
      const d = build();
      const product = {
        id: 'pr1',
        pharmacyId: 'ph1',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        updatedAt: new Date(),
      };
      const price = {
        statusConceptId: PHARM.PRICE_ACTIVE,
        effectiveTo: undefined,
      };
      const mapping = {
        verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
        updatedAt: new Date(),
      };
      d.productsRepo.findById.mockResolvedValue(product);
      d.pricesRepo.findActiveByProduct.mockResolvedValue([price]);
      d.mappingsRepo.findActiveByProduct.mockResolvedValue([mapping]);

      const res = await inTenant(() =>
        d.service.retireProduct('ph1', 'pr1', actor),
      );

      expect(res).toEqual({ ok: true });
      expect(product.statusConceptId).toBe(PHARM.PRODUCT_RETIRED);
      expect(price.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
      expect(mapping.verificationStatusConceptId).toBe(PHARM.MAPPING_INACTIVE);
    });
  });

  describe('updateProduct (P47 §2)', () => {
    const pharmacy = {
      id: 'ph1',
      tenantId: T1,
      tradeName: 'Farmacia Andina',
      legalName: 'Andina SRL',
    };

    /** Un producto activo de `ph1`, con todos los datos descriptivos llenos. */
    function activeProduct(overrides: Record<string, unknown> = {}) {
      return {
        id: 'pr1',
        pharmacyId: 'ph1',
        productCode: 'P-1',
        brandName: 'Amoxil',
        genericName: 'Amoxicilina',
        strengthText: '500 mg',
        packageSizeText: 'Caja x 21',
        requiresPrescription: true,
        medicationConceptId: 'c-med',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        ...overrides,
      };
    }

    function given(d: ReturnType<typeof build>, product: unknown) {
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacy);
      d.productsRepo.findById.mockResolvedValue(product);
      d.readRepo.findConcepts.mockResolvedValue([
        { id: 'c-med', code: 'MESH-AMOX', display: 'Amoxicilina' },
      ]);
    }

    it('changes only the sent fields, stamps the actor and answers like the search', async () => {
      const d = build();
      const product = activeProduct();
      given(d, product);

      const res = await inTenant(() =>
        d.service.updateProduct(
          'ph1',
          'pr1',
          { brandName: 'Amoxil Plus' },
          actor,
        ),
      );

      expect(res).toEqual({
        id: 'pr1',
        pharmacyId: 'ph1',
        pharmacyName: 'Farmacia Andina',
        productCode: 'P-1',
        brandName: 'Amoxil Plus',
        genericName: 'Amoxicilina',
        strengthText: '500 mg',
        packageSizeText: 'Caja x 21',
        dosageForm: null,
        medication: { code: 'MESH-AMOX', display: 'Amoxicilina' },
        requiresPrescription: true,
      });
      expect(product).toMatchObject({ updatedByUserId: 'admin-1' });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.readRepo.findConcepts).toHaveBeenCalledWith(d.tx, ['c-med']);
    });

    it('clears a field when the body sends null and leaves the rest alone', async () => {
      const d = build();
      const product = activeProduct();
      given(d, product);

      const res = await inTenant(() =>
        d.service.updateProduct(
          'ph1',
          'pr1',
          { genericName: null, requiresPrescription: null },
          actor,
        ),
      );

      expect(product.genericName).toBeNull();
      expect(product.requiresPrescription).toBeNull();
      expect(product.brandName).toBe('Amoxil');
      expect(res).toMatchObject({
        genericName: null,
        requiresPrescription: null,
        brandName: 'Amoxil',
      });
    });

    it('does nothing, and leaves the audit fields alone, when the body is empty', async () => {
      const d = build();
      const product = activeProduct();
      given(d, product);

      const res = await inTenant(() =>
        d.service.updateProduct('ph1', 'pr1', {}, actor),
      );

      expect(d.tx.flush).not.toHaveBeenCalled();
      expect(product).not.toHaveProperty('updatedByUserId');
      expect(res).toMatchObject({
        brandName: 'Amoxil',
        genericName: 'Amoxicilina',
      });
    });

    it('throws when the product does not exist', async () => {
      const d = build();
      given(d, null);
      await expect(
        inTenant(() =>
          d.service.updateProduct('ph1', 'pr1', { brandName: 'X' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('answers the same 404 when the product belongs to another pharmacy', async () => {
      const d = build();
      const product = activeProduct({ pharmacyId: 'other' });
      given(d, product);
      await expect(
        inTenant(() =>
          d.service.updateProduct('ph1', 'pr1', { brandName: 'X' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(product.brandName).toBe('Amoxil');
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('throws when the pharmacy does not exist', async () => {
      const d = build();
      given(d, activeProduct());
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.updateProduct('ph1', 'pr1', { brandName: 'X' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects editing a retired product', async () => {
      const d = build();
      const product = activeProduct({
        statusConceptId: PHARM.PRODUCT_RETIRED,
      });
      given(d, product);
      await expect(
        inTenant(() =>
          d.service.updateProduct('ph1', 'pr1', { brandName: 'X' }, actor),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(product.brandName).toBe('Amoxil');
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });

  describe('alcance de tenant (PHARM-01)', () => {
    it('publishProduct sobre una farmacia de T2 responde igual que una inexistente y no escribe', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));
      const foreignError = await rejection(
        inTenant(() =>
          d.service.publishProduct('ph2', { productCode: 'P-1' } as any, actor),
        ),
      );
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() =>
          d.service.publishProduct('ph2', { productCode: 'P-1' } as any, actor),
        ),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.productsRepo.create).not.toHaveBeenCalled();
    });

    it('updateProduct y retireProduct exigen la farmacia del tenant antes de cargar el producto', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));

      const updateError = await rejection(
        inTenant(() =>
          d.service.updateProduct('ph2', 'pr1', { brandName: 'X' }, actor),
        ),
      );
      const retireError = await rejection(
        inTenant(() => d.service.retireProduct('ph2', 'pr1', actor)),
      );

      expect(updateError.reason).toBe(NOT_AVAILABLE);
      expect(retireError.reason).toBe(NOT_AVAILABLE);
      expect(d.productsRepo.findById).not.toHaveBeenCalled();
      expect(d.pricesRepo.findActiveByProduct).not.toHaveBeenCalled();
    });
  });
});
