import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyProductsService } from './pharmacy-products.service';
import { PharmacyReadService } from './pharmacy-read.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
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
  const pricesRepo = {
    findActiveByProduct: mockFn().mockResolvedValue([]),
    findActiveByListAndProduct: mockFn().mockResolvedValue([]),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const mappingsRepo = { findActiveByProduct: mockFn().mockResolvedValue([]) };
  const readRepo = { findConcepts: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const pharmacyCatalogRepo = {
    findCurrentPrices: mockFn().mockResolvedValue(new Map()),
    findCategoriesByIds: mockFn().mockResolvedValue([]),
    findImageFileIds: mockFn().mockResolvedValue(new Map()),
    lockCatalogPriceList: mockFn().mockResolvedValue(null),
    createCatalogPriceList: mockFn(() => ({ id: 'list-catalogo' })),
    replaceImages: mockFn().mockResolvedValue(undefined),
  };
  const categories = { resolveByName: mockFn() };
  const attachableFiles = { assertUsableBy: mockFn() };
  // La proyección es la real: el PATCH responde como la lectura de gestión.
  const readService = new PharmacyReadService(
    {} as any,
    readRepo as any,
    pharmacyCatalogRepo as any,
  );
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
    pharmacyCatalogRepo as any,
    categories as any,
    readService,
    attachableFiles as any,
  );
  return {
    service,
    pharmacyCatalogRepo,
    categories,
    attachableFiles,
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
        unitPrice: null,
        currency: null,
        inStock: true,
        category: null,
        description: null,
        status: 'PUBLISHED',
        stock: null,
        minStock: null,
        outOfStockDeclared: false,
        imageFileIds: [],
      });
      expect(product).toMatchObject({ updatedByUserId: 'admin-1' });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.readRepo.findConcepts).toHaveBeenCalledWith(d.tx, ['c-med']);
    });

    it('tells the manager the product is marked out of stock, apart from its count', async () => {
      const d = build();
      given(d, activeProduct({ stockQuantity: 4, outOfStockDeclared: true }));

      const res = await inTenant(() =>
        d.service.updateProduct('ph1', 'pr1', { brandName: 'Amoxil' }, actor),
      );

      expect(res).toMatchObject({
        stock: 4,
        inStock: false,
        outOfStockDeclared: true,
      });
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

  describe('catálogo de la farmacia (P47 §3-5)', () => {
    const pharmacy = { id: 'ph1', tenantId: T1, legalName: 'Andina SRL' };
    function product(overrides: Record<string, unknown> = {}) {
      return {
        id: 'pr1',
        pharmacyId: 'ph1',
        productCode: 'P-1',
        brandName: 'Amoxil',
        statusConceptId: PHARM.PRODUCT_ACTIVE,
        outOfStockDeclared: false,
        ...overrides,
      } as any;
    }
    function given(d: ReturnType<typeof build>, row: unknown) {
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacy);
      d.productsRepo.findById.mockResolvedValue(row);
    }
    const patch = (d: ReturnType<typeof build>, dto: any) =>
      inTenant(() => d.service.updateProduct('ph1', 'pr1', dto, actor));

    it('el primer precio crea la lista CATALOGO y versiona en ella, como texto exacto', async () => {
      const d = build();
      given(d, product());
      await patch(d, { unitPrice: 12.5 });
      expect(d.pharmacyCatalogRepo.createCatalogPriceList).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        'admin-1',
      );
      expect(d.pricesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacyPriceListId: 'list-catalogo',
          pharmacyProductId: 'pr1',
          versionNumber: 1,
          unitAmount: '12.50',
          statusConceptId: PHARM.PRICE_ACTIVE,
        }),
      );
    });

    it('el mismo importe otra vez no crea una versión nueva (reintento idempotente)', async () => {
      const d = build();
      given(d, product());
      d.pharmacyCatalogRepo.lockCatalogPriceList.mockResolvedValue({
        id: 'list-catalogo',
      });
      d.pricesRepo.findActiveByListAndProduct.mockResolvedValue([
        { unitAmount: '12.50', statusConceptId: PHARM.PRICE_ACTIVE },
      ]);
      await patch(d, { unitPrice: '12.5' });
      expect(d.pricesRepo.create).not.toHaveBeenCalled();
    });

    it('un precio nuevo supersede el vigente y toma max+1', async () => {
      const d = build();
      given(d, product());
      const previous = {
        unitAmount: '12.50',
        statusConceptId: PHARM.PRICE_ACTIVE,
      } as any;
      d.pharmacyCatalogRepo.lockCatalogPriceList.mockResolvedValue({
        id: 'list-catalogo',
      });
      d.pricesRepo.findActiveByListAndProduct.mockResolvedValue([previous]);
      d.pricesRepo.maxVersionNumber.mockResolvedValue(3);
      await patch(d, { unitPrice: 14 });
      expect(previous.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
      expect(previous.effectiveTo).toBeInstanceOf(Date);
      expect(d.pricesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ versionNumber: 4, unitAmount: '14.00' }),
      );
    });

    it('unitPrice null quita el precio vigente sin crear otro', async () => {
      const d = build();
      given(d, product());
      const previous = {
        unitAmount: '9.00',
        statusConceptId: PHARM.PRICE_ACTIVE,
      } as any;
      d.pharmacyCatalogRepo.lockCatalogPriceList.mockResolvedValue({ id: 'l' });
      d.pricesRepo.findActiveByListAndProduct.mockResolvedValue([previous]);
      await patch(d, { unitPrice: null });
      expect(previous.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
      expect(d.pricesRepo.create).not.toHaveBeenCalled();
    });

    it('la categoría se resuelve sólo entre las de esta farmacia; otra es 422 y no cambia nada', async () => {
      const d = build();
      const row = product();
      given(d, row);
      d.categories.resolveByName.mockRejectedValue(
        new PreconditionFailedException(
          'La categoría no es una de las de su farmacia',
        ),
      );
      await expect(patch(d, { category: 'Ajena' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.categories.resolveByName).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        'Ajena',
      );
      expect(row.pharmacyProductCategoryId).toBeUndefined();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('existencias e «hay» juntas son 422', async () => {
      const d = build();
      given(d, product());
      await expect(
        patch(d, { stock: 3, inStock: true }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('«no tengo» marca el producto y «tengo» con conteo en 0 lo deja sin conteo', async () => {
      const d = build();
      const row = product({ stockQuantity: 0 });
      given(d, row);
      await patch(d, { inStock: false });
      expect(row.outOfStockDeclared).toBe(true);
      await patch(d, { inStock: true });
      expect(row.outOfStockDeclared).toBe(false);
      expect(row.stockQuantity).toBeNull();
    });

    it('status WITHDRAWN retira en cascada como el DELETE', async () => {
      const d = build();
      const row = product();
      given(d, row);
      const price = { statusConceptId: PHARM.PRICE_ACTIVE } as any;
      d.pricesRepo.findActiveByProduct.mockResolvedValue([price]);
      const res = await patch(d, { status: 'WITHDRAWN' });
      expect(row.statusConceptId).toBe(PHARM.PRODUCT_RETIRED);
      expect(price.statusConceptId).toBe(PHARM.PRICE_SUPERSEDED);
      expect(res.status).toBe('WITHDRAWN');
    });

    it('un retirado vuelve con status PUBLISHED; sin status sigue siendo 422', async () => {
      const d = build();
      const row = product({ statusConceptId: PHARM.PRODUCT_RETIRED });
      given(d, row);
      await expect(patch(d, { description: 'x' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      const res = await patch(d, { status: 'PUBLISHED' });
      expect(row.statusConceptId).toBe(PHARM.PRODUCT_ACTIVE);
      expect(res.status).toBe('PUBLISHED');
    });

    it('una imagen nueva pasa por la regla de archivos adjuntables; la ajena se rechaza y nada se reemplaza', async () => {
      const d = build();
      given(d, product());
      d.attachableFiles.assertUsableBy.mockRejectedValue(
        new ForbiddenException('La imagen del producto no le pertenece'),
      );
      await expect(
        patch(d, { imageFileIds: ['11111111-1111-4111-8111-111111111111'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.attachableFiles.assertUsableBy).toHaveBeenCalledWith(
        d.tx,
        '11111111-1111-4111-8111-111111111111',
        actor,
        expect.objectContaining({ operation: 'pharmacy.product.images' }),
        expect.anything(),
      );
      expect(d.pharmacyCatalogRepo.replaceImages).not.toHaveBeenCalled();
    });

    it('un archivo propio que no es de categoría IMAGE se rechaza con 422', async () => {
      const d = build();
      given(d, product());
      d.attachableFiles.assertUsableBy.mockResolvedValue({
        file: { categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT },
      });
      await expect(
        patch(d, { imageFileIds: ['11111111-1111-4111-8111-111111111111'] }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.pharmacyCatalogRepo.replaceImages).not.toHaveBeenCalled();
    });

    it('las imágenes que ya tenía se conservan sin volver a preguntar', async () => {
      const d = build();
      given(d, product());
      d.pharmacyCatalogRepo.findImageFileIds.mockResolvedValue(
        new Map([['pr1', ['f-old']]]),
      );
      d.attachableFiles.assertUsableBy.mockResolvedValue({
        file: { categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE },
      });
      await patch(d, { imageFileIds: ['f-old', 'f-new'] });
      expect(d.attachableFiles.assertUsableBy).toHaveBeenCalledTimes(1);
      expect(d.pharmacyCatalogRepo.replaceImages).toHaveBeenCalledWith(
        d.tx,
        'pr1',
        ['f-old', 'f-new'],
        'admin-1',
      );
    });
  });

  describe('updateInventory (P47 D7)', () => {
    const run = (d: ReturnType<typeof build>, lines: any[]) =>
      inTenant(() => d.service.updateInventory('ph1', { lines }, actor));

    it('guarda todas las líneas válidas', async () => {
      const d = build();
      const a = { id: 'a', outOfStockDeclared: true, stockQuantity: 0 } as any;
      const b = { id: 'b', outOfStockDeclared: false, stockQuantity: 4 } as any;
      (d.tx as any).find = mockFn().mockResolvedValue([a, b]);
      const res = await run(d, [
        { productId: 'a', stock: 7, minStock: 2 },
        { productId: 'b', inStock: false },
      ]);
      expect(res).toEqual({ updated: 2 });
      expect(a).toMatchObject({
        stockQuantity: 7,
        minStockQuantity: 2,
        outOfStockDeclared: false,
      });
      expect(b).toMatchObject({ stockQuantity: 4, outOfStockDeclared: true });
    });

    it.each([
      ['un producto que no es del catálogo', [{ productId: 'x', stock: 1 }]],
      [
        'existencias e «hay» a la vez',
        [{ productId: 'a', stock: 1, inStock: true }],
      ],
      ['una línea sin nada que cambiar', [{ productId: 'a' }]],
      [
        'un producto repetido',
        [
          { productId: 'a', stock: 1 },
          { productId: 'a', stock: 2 },
        ],
      ],
    ])('%s es 422 y no se guarda ninguna línea', async (_label, lines) => {
      const d = build();
      const a = { id: 'a', outOfStockDeclared: false, stockQuantity: 5 } as any;
      (d.tx as any).find = mockFn().mockResolvedValue([a]);
      await expect(run(d, lines)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(a.stockQuantity).toBe(5);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('la farmacia ajena es el 404 de siempre', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        run(d, [{ productId: 'a', stock: 1 }]),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
