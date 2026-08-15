import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmaCatalogService } from './pharma-catalog.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const PRODUCT = '33333333-3333-3333-3333-333333333333';
const MATERIAL = '44444444-4444-4444-4444-444444444444';
const ACTOR = { id: '99999999-9999-9999-9999-999999999999' } as any;

/** Producto del catálogo. */
function product(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: PRODUCT,
    pharmaLabId: LAB,
    tradeName: 'Andexal',
    activeIngredient: 'andexanet',
    regulatoryStatusConceptId: PHL.PRODUCT_APPROVED,
    disclosureLevelConceptId: PHL.DISCLOSURE_PROFESSIONAL,
    versionNo: 1,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Material informativo. */
function material(
  overrides: Record<string, unknown> = {},
): Record<string, any> {
  return {
    id: MATERIAL,
    pharmaLabId: LAB,
    title: 'Ficha técnica Andexal',
    version: 'v1.0',
    statusConceptId: PHL.MATERIAL_DRAFT,
    disclosureLevelConceptId: PHL.DISCLOSURE_PROFESSIONAL,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles.
 */
function build(
  options: {
    /** Producto devuelto por el repositorio. */
    productRow?: Record<string, any>;
    /** Material devuelto por el repositorio. */
    materialRow?: Record<string, any>;
    /** Adjuntos del material. */
    assets?: unknown[];
  } = {},
) {
  const productRow = options.productRow ?? product();
  const materialRow = options.materialRow ?? material();

  const repo = {
    findProduct: mockFn(async () => productRow),
    listProducts: mockFn(async () => [productRow]),
    createProduct: mockFn(() => productRow),
    findMaterial: mockFn(async () => materialRow),
    listMaterials: mockFn(async () => [materialRow]),
    createMaterial: mockFn(() => materialRow),
    createAsset: mockFn(() => ({ id: 'asset' })),
    listAssets: mockFn(async () => options.assets ?? [{ id: 'asset' }]),
    createApproval: mockFn(() => ({ id: 'approval' })),
    listApprovals: mockFn(async () => []),
  };
  const access = {
    requireLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
    requireActiveLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
  };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new PharmaCatalogService(
    em,
    repo as any,
    access as any,
    audit as any,
    logger as any,
  );
  return { service, repo, audit, productRow, materialRow };
}

describe('PharmaCatalogService', () => {
  describe('indicaciones autorizadas', () => {
    it('no deja declarar una indicación en un producto en investigación', async () => {
      const { service } = build();

      await expect(
        service.createProduct(
          LAB,
          {
            tradeName: 'Andexal',
            activeIngredient: 'andexanet',
            regulatoryStatusConceptId: PHL.PRODUCT_RESEARCH,
            authorizedIndication: 'Reversión de anticoagulación',
            disclosureLevelConceptId: PHL.DISCLOSURE_PROFESSIONAL,
          } as any,
          ACTOR,
        ),
      ).rejects.toThrow('no está aprobado');
    });

    it('la admite en un producto aprobado', async () => {
      const { service, repo } = build();

      await service.createProduct(
        LAB,
        {
          tradeName: 'Andexal',
          activeIngredient: 'andexanet',
          regulatoryStatusConceptId: PHL.PRODUCT_APPROVED,
          authorizedIndication: 'Reversión de anticoagulación',
          disclosureLevelConceptId: PHL.DISCLOSURE_PROFESSIONAL,
        } as any,
        ACTOR,
      );

      expect(repo.createProduct).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          authorizedIndication: 'Reversión de anticoagulación',
        }),
      );
    });

    it('retira la indicación cuando el producto se suspende', async () => {
      const productRow = product({
        regulatoryStatusConceptId: PHL.PRODUCT_MARKETED,
        authorizedIndication: 'Reversión de anticoagulación',
      });
      const { service } = build({ productRow });

      await service.changeProductStatus(
        LAB,
        PRODUCT,
        {
          regulatoryStatusConceptId: PHL.PRODUCT_SUSPENDED,
          reason: 'Alerta de calidad',
        },
        ACTOR,
      );

      expect(productRow.authorizedIndication).toBeUndefined();
    });
  });

  describe('estado regulatorio', () => {
    it('no permite volver de retirado a comercializado', async () => {
      const { service } = build({
        productRow: product({
          regulatoryStatusConceptId: PHL.PRODUCT_WITHDRAWN,
        }),
      });

      await expect(
        service.changeProductStatus(
          LAB,
          PRODUCT,
          {
            regulatoryStatusConceptId: PHL.PRODUCT_MARKETED,
            reason: 'Reingreso',
          },
          ACTOR,
        ),
      ).rejects.toThrow('no está permitida');
    });

    it('permite pasar de aprobado a comercializado', async () => {
      const { service } = build();

      const result = await service.changeProductStatus(
        LAB,
        PRODUCT,
        {
          regulatoryStatusConceptId: PHL.PRODUCT_MARKETED,
          reason: 'Lanzamiento',
        },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.PRODUCT_MARKETED);
    });
  });

  describe('material informativo', () => {
    it('nace siempre en borrador', async () => {
      const { service, repo } = build();

      await service.createMaterial(
        LAB,
        {
          title: 'Ficha técnica',
          kindConceptId: PHL.MATERIAL_KIND_DATA_SHEET,
          version: 'v1.0',
          disclosureLevelConceptId: PHL.DISCLOSURE_PROFESSIONAL,
        } as any,
        ACTOR,
      );

      expect(repo.createMaterial).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusConceptId: PHL.MATERIAL_DRAFT }),
      );
    });

    it('no se envía a revisión sin adjuntos', async () => {
      const { service } = build({ assets: [] });

      await expect(
        service.submitMaterialForReview(LAB, MATERIAL, ACTOR),
      ).rejects.toThrow('no tiene ningún adjunto');
    });

    it('no se aprueba sin pasar por revisión', async () => {
      const { service } = build();

      await expect(
        service.decideMaterial(
          LAB,
          MATERIAL,
          {
            decisionConceptId: PHL.MATERIAL_APPROVED,
            rationale: 'Correcto',
          },
          ACTOR,
        ),
      ).rejects.toThrow('material en revisión');
    });

    it('la aprobación deja la decisión registrada y sella la fecha', async () => {
      const materialRow = material({
        statusConceptId: PHL.MATERIAL_IN_REVIEW,
      });
      const { service, repo } = build({ materialRow });

      const result = await service.decideMaterial(
        LAB,
        MATERIAL,
        {
          decisionConceptId: PHL.MATERIAL_APPROVED,
          rationale: 'Cumple con la información aprobada',
        },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.MATERIAL_APPROVED);
      expect(materialRow.approvedAt).toBeInstanceOf(Date);
      expect(repo.createApproval).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          decisionConceptId: PHL.MATERIAL_APPROVED,
          rationale: 'Cumple con la información aprobada',
        }),
      );
    });

    it('no deja modificar el contenido de un material aprobado', async () => {
      const { service } = build({
        materialRow: material({ statusConceptId: PHL.MATERIAL_APPROVED }),
      });

      await expect(
        service.addAsset(
          LAB,
          MATERIAL,
          {
            kindConceptId: PHL.MATERIAL_KIND_STUDY,
            fileName: 'estudio.pdf',
            storageKey: 'k',
          } as any,
          ACTOR,
        ),
      ).rejects.toThrow('ya aprobado');
    });
  });
});
