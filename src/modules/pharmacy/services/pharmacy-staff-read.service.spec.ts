import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PHARM } from '../pharmacy.concepts';
import {
  daysUntil,
  describeActivity,
  PharmacyStaffReadService,
} from './pharmacy-staff-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'user-staff', roles: ['USER'] } as any;

const LICENSING = {
  id: 'concept-lic',
  code: 'PHARM_LICENSE_OPERATING',
  display: 'Licencia de funcionamiento',
};
const VERIFIED = {
  id: 'concept-verified',
  code: 'PHARM_VERIFICATION_VERIFIED',
  display: 'Verificada',
};

function pharmacy() {
  return { id: 'ph-1', tenantId: 'tenant-a', legalName: 'Farmacia S.R.L.' };
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findByIdInTenant: mockFn().mockResolvedValue(null),
    findLicenses: mockFn().mockResolvedValue([]),
    findSitesByIds: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
    findCatalogProducts: mockFn().mockResolvedValue([]),
  };
  const tenantAdmin = { assertCanRead: mockFn().mockResolvedValue(undefined) };
  const directoryRead = { readRepresentation: mockFn().mockResolvedValue({}) };
  const catalogRepo = {
    findCurrentPrices: mockFn().mockResolvedValue(new Map()),
    listCategories: mockFn().mockResolvedValue([]),
    findRecentActivity: mockFn().mockResolvedValue([]),
  };
  const readService = {
    toCatalogDtos: mockFn(async (_em: unknown, rows: any[]) =>
      rows.map((row) => ({ id: row.id })),
    ),
  };
  const service = new PharmacyStaffReadService(
    em as any,
    repo as any,
    tenantAdmin as any,
    directoryRead as any,
    catalogRepo as any,
    readService as any,
  );
  return {
    service,
    repo,
    tenantAdmin,
    directoryRead,
    fork,
    catalogRepo,
    readService,
  };
}

describe('PharmacyStaffReadService', () => {
  describe('alcance', () => {
    it('requires the active tenant instead of accepting one from the client', async () => {
      const d = build();
      await expect(
        d.service.listLicenses('ph-1', ACTOR),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('answers 404 for a pharmacy outside the active tenant', async () => {
      const d = build();
      await expect(
        runWithTenant('tenant-a', () => d.service.listLicenses('ph-x', ACTOR)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findByIdInTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        'ph-x',
      );
      expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
    });

    it('answers the same 404 to someone outside the organization, never 403', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.tenantAdmin.assertCanRead.mockRejectedValue(
        new ForbiddenException('fuera'),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.getContacts('ph-1', ACTOR)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tenantAdmin.assertCanRead).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        ACTOR,
      );
      expect(d.directoryRead.readRepresentation).not.toHaveBeenCalled();
    });

    it('lets any other failure of the scope check through untouched', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      const boom = new Error('db caída');
      d.tenantAdmin.assertCanRead.mockRejectedValue(boom);

      await expect(
        runWithTenant('tenant-a', () => d.service.listLicenses('ph-1', ACTOR)),
      ).rejects.toBe(boom);
    });
  });

  describe('licencias', () => {
    it('serves the folder with resolved concepts, site and days to expiry', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      d.repo.findLicenses.mockResolvedValue([
        {
          id: 'lic-1',
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
          licenseTypeConceptId: LICENSING.id,
          licenseNumber: 'LF-2026-0001',
          validFrom: new Date('2026-01-01T00:00:00Z'),
          validTo: inTenDays,
          verificationStatusConceptId: VERIFIED.id,
          evidenceFileId: 'file-1',
        },
        {
          id: 'lic-2',
          pharmacyId: 'ph-1',
          licenseTypeConceptId: 'concept-desconocido',
          licenseNumber: 'SEDES-77',
          verificationStatusConceptId: VERIFIED.id,
        },
      ]);
      d.repo.findSitesByIds.mockResolvedValue([
        { id: 'site-1', name: 'Sede Centro' },
      ]);
      d.repo.findConcepts.mockResolvedValue([LICENSING, VERIFIED]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listLicenses('ph-1', ACTOR),
      );

      expect(result.count).toBe(2);
      expect(result.items[0]).toEqual({
        id: 'lic-1',
        type: { code: LICENSING.code, display: LICENSING.display },
        number: 'LF-2026-0001',
        siteId: 'site-1',
        siteName: 'Sede Centro',
        jurisdiction: null,
        validFrom: '2026-01-01',
        validTo: inTenDays.toISOString().slice(0, 10),
        daysToExpiry: 10,
        verificationStatus: {
          code: VERIFIED.code,
          display: VERIFIED.display,
        },
        evidenceFileId: 'file-1',
      });
      // La licencia de la farmacia entera y sin vigencia declarada: sin sede,
      // sin plazo y con el tipo desconocido dicho null — nada inventado.
      expect(result.items[1]).toMatchObject({
        siteId: null,
        siteName: null,
        type: null,
        validTo: null,
        daysToExpiry: null,
        evidenceFileId: null,
      });
    });

    it('returns an empty folder without relation queries', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());

      const result = await runWithTenant('tenant-a', () =>
        d.service.listLicenses('ph-1', ACTOR),
      );

      expect(result).toEqual({ items: [], count: 0 });
      expect(d.repo.findSitesByIds).not.toHaveBeenCalled();
      expect(d.repo.findConcepts).not.toHaveBeenCalled();
    });
  });

  describe('contactos', () => {
    it('serves representative and executives of the owner organization without their ID document', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.directoryRead.readRepresentation.mockResolvedValue({
        legalRepresentative: {
          role: 'LEGAL_REPRESENTATIVE',
          fullName: 'Ana Pérez',
          email: 'ana@farmacia.bo',
          phone: '+59170000001',
          idNumber: '1234567',
        },
        executives: [{ role: 'GENERAL_MANAGER', fullName: 'Luis Rojas' }],
      });

      const result = await runWithTenant('tenant-a', () =>
        d.service.getContacts('ph-1', ACTOR),
      );

      expect(d.directoryRead.readRepresentation).toHaveBeenCalledWith(
        'tenant-a',
      );
      expect(result).toEqual({
        legalRepresentative: {
          role: 'LEGAL_REPRESENTATIVE',
          fullName: 'Ana Pérez',
          email: 'ana@farmacia.bo',
          phone: '+59170000001',
        },
        executives: [
          {
            role: 'GENERAL_MANAGER',
            fullName: 'Luis Rojas',
            email: null,
            phone: null,
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain('1234567');
    });

    it('says null and empty when the organization registered nobody', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());

      const result = await runWithTenant('tenant-a', () =>
        d.service.getContacts('ph-1', ACTOR),
      );

      expect(result).toEqual({ legalRepresentative: null, executives: [] });
    });
  });

  describe('daysUntil', () => {
    const now = new Date('2026-09-26T23:30:00Z');

    it('counts calendar days: today is 0, not -1 by a few hours', () => {
      expect(daysUntil(new Date('2026-09-26T00:00:00Z'), now)).toBe(0);
      expect(daysUntil(new Date('2026-09-27T00:00:00Z'), now)).toBe(1);
    });

    it('is negative once expired', () => {
      expect(daysUntil(new Date('2026-09-20T00:00:00Z'), now)).toBe(-6);
    });

    it('is null without an end date', () => {
      expect(daysUntil(undefined, now)).toBeNull();
      expect(daysUntil(null, now)).toBeNull();
    });
  });

  describe('catálogo de gestión (P47)', () => {
    it('managed: todo el catálogo de SU farmacia, con el recorte declarado', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.repo.findCatalogProducts.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ]);
      const res = await runWithTenant('tenant-a', () =>
        d.service.listManagedProducts('ph-1', { search: 'amo' }, 2, ACTOR),
      );
      expect(d.repo.findCatalogProducts).toHaveBeenCalledWith(
        d.fork,
        'ph-1',
        { search: 'amo' },
        3,
      );
      expect(d.readService.toCatalogDtos).toHaveBeenCalledWith(
        d.fork,
        [{ id: 'a' }, { id: 'b' }],
        expect.any(Map),
        true,
      );
      expect(res).toEqual({
        items: [{ id: 'a' }, { id: 'b' }],
        limit: 2,
        truncated: true,
      });
    });

    it('managed: alguien de fuera de la organización recibe el 404, no el catálogo', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.tenantAdmin.assertCanRead.mockRejectedValue(
        new ForbiddenException('fuera'),
      );
      await expect(
        runWithTenant('tenant-a', () =>
          d.service.listManagedProducts('ph-1', {}, 50, ACTOR),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findCatalogProducts).not.toHaveBeenCalled();
    });

    it('el resumen cuenta por estado y existencias, y valora en centavos exactos', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      const base = {
        outOfStockDeclared: false,
        pharmacyProductCategoryId: 'cat-1',
      };
      const products = [
        // publicado, 3 unidades a 0.10 → 0.30 (0.1 × 3 en coma flotante no da 0.3)
        {
          id: 'p1',
          statusConceptId: PHARM.PRODUCT_ACTIVE,
          stockQuantity: 3,
          ...base,
        },
        // publicado bajo umbral por defecto (5): 2 unidades a 10.20 → 20.40
        {
          id: 'p2',
          statusConceptId: PHARM.PRODUCT_ACTIVE,
          stockQuantity: 2,
          ...base,
        },
        // publicado «no tengo»
        {
          id: 'p3',
          statusConceptId: PHARM.PRODUCT_ACTIVE,
          stockQuantity: 9,
          ...base,
          outOfStockDeclared: true,
        },
        // publicado sin conteo: hay, pero no suma al valor
        {
          id: 'p4',
          statusConceptId: PHARM.PRODUCT_ACTIVE,
          stockQuantity: null,
          ...base,
          pharmacyProductCategoryId: null,
        },
        {
          id: 'p5',
          statusConceptId: PHARM.PRODUCT_DRAFT,
          stockQuantity: 1,
          ...base,
        },
        {
          id: 'p6',
          statusConceptId: PHARM.PRODUCT_RETIRED,
          stockQuantity: 1,
          ...base,
        },
      ];
      (d.fork as any).find = mockFn().mockResolvedValue(products);
      d.catalogRepo.findCurrentPrices.mockResolvedValue(
        new Map([
          ['p1', { amount: '0.10', currency: 'BOB' }],
          ['p2', { amount: '10.20', currency: 'BOB' }],
          ['p3', { amount: '5.00', currency: 'BOB' }],
          ['p4', { amount: '7.00', currency: 'BOB' }],
        ]),
      );
      d.catalogRepo.listCategories.mockResolvedValue([
        { id: 'cat-1', name: 'Medicamentos' },
      ]);

      const res = await runWithTenant('tenant-a', () =>
        d.service.getSummary('ph-1', ACTOR),
      );

      expect(res).toMatchObject({
        published: 4,
        drafts: 1,
        withdrawn: 1,
        outOfStock: 1,
        lowStock: 2,
        inventoryValue: '20.70',
        byCategory: [
          { category: 'Medicamentos', count: 4 },
          { category: 'Sin categoría', count: 1 },
        ],
      });
      expect(d.catalogRepo.findRecentActivity).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        8,
      );
    });

    it('la actividad nombra el producto y la categoría vigentes, y en genérico lo que ya no existe', () => {
      const at = new Date('2026-10-26T10:00:00Z');
      const res = describeActivity(
        [
          {
            id: '1',
            action: 'PHARMACY_PRODUCT_PUBLISHED',
            entityId: 'p1',
            recordedAt: at,
          },
          {
            id: '2',
            action: 'PHARMACY_CATEGORY_RENAMED',
            entityId: 'c1',
            recordedAt: at,
          },
          {
            id: '3',
            action: 'PHARMACY_CATEGORY_DELETED',
            entityId: 'c9',
            recordedAt: at,
          },
          {
            id: '4',
            action: 'PHARMACY_PRODUCT_UPDATED',
            entityId: 'gone',
            recordedAt: at,
          },
        ],
        [{ id: 'p1', brandName: 'Amoxil' } as any],
        new Map([['c1', 'Bienestar']]),
      );
      expect(res.map((r) => [r.kind, r.text])).toEqual([
        ['ALTA', 'Cargó «Amoxil».'],
        ['CATEGORIA', 'Renombró la categoría «Bienestar».'],
        ['CATEGORIA', 'Eliminó una categoría.'],
        ['EDICION', 'Editó un producto.'],
      ]);
      expect(res[0].at).toBe('2026-10-26T10:00:00.000Z');
    });
  });
});
